def intersect_area(r1, r2):
    dx = min(r1['x'] + r1['w'], r2['x'] + r2['w']) - max(r1['x'], r2['x'])
    dy = min(r1['y'] + r1['l'], r2['y'] + r2['l']) - max(r1['y'], r2['y'])
    if dx > 0 and dy > 0:
        return dx * dy
    return 0

def check_overlap(p1, p2):
    # Strict 3D overlap check
    dx = min(p1['pos']['x'] + p1['size']['width'], p2['pos']['x'] + p2['size']['width']) - max(p1['pos']['x'], p2['pos']['x'])
    dy = min(p1['pos']['y'] + p1['size']['length'], p2['pos']['y'] + p2['size']['length']) - max(p1['pos']['y'], p2['pos']['y'])
    dz = min(p1['pos']['z'] + p1['size']['height'], p2['pos']['z'] + p2['size']['height']) - max(p1['pos']['z'], p2['pos']['z'])
    
    return dx > 0 and dy > 0 and dz > 0

def validate_placement(candidate, existing_placements, container):
    # 1. Bounds check (Geometry)
    if candidate['pos']['x'] < 0 or candidate['pos']['y'] < 0 or candidate['pos']['z'] < 0:
        return False, "Out of bounds (negative coords)"
    if candidate['pos']['x'] + candidate['size']['width'] > container['widthCm']:
        return False, "Exceeds width"
    if candidate['pos']['y'] + candidate['size']['length'] > container['lengthCm']:
        return False, "Exceeds length"
    if candidate['pos']['z'] + candidate['size']['height'] > container['heightCm']:
        return False, "Exceeds height"

    z = candidate['pos']['z']

    # 2. Strict 3D Overlap (Geometry)
    for p in existing_placements:
        if check_overlap(candidate, p):
            return False, "Overlap in 3D space"

    # 3. Support & Gravity check (z > 0)
    if z > 0:
        supported_area = 0
        base_area = candidate['size']['width'] * candidate['size']['length']
        lower_boxes = []
        for p in existing_placements:
            # Check if top of p is exactly level with our bottom
            if abs(p['pos']['z'] + p['size']['height'] - z) < 1e-4:
                ia = intersect_area(
                    {'x': candidate['pos']['x'], 'y': candidate['pos']['y'], 'w': candidate['size']['width'], 'l': candidate['size']['length']},
                    {'x': p['pos']['x'], 'y': p['pos']['y'], 'w': p['size']['width'], 'l': p['size']['length']}
                )
                if ia > 0:
                    supported_area += ia
                    lower_boxes.append(p)
        
        # New Requirement: > 0.90 ratio
        if supported_area / base_area < 0.90:
            return False, "Insufficient support (ratio < 0.90)"
        
        if len(lower_boxes) < 1:
            return False, "Floating box"
        
        # 4. Fragility check
        for low in lower_boxes:
            # upper is allowed to be same crunchiness or stronger (more fragile)
            # 1=fragile, 5=sturdy. If candidate=3 and low=1: candidate is sturdier, error!
            if candidate['fragility'] > low['fragility']:
                return False, "Fragility violation: cannot put sturdy box on fragile box"

    # 5. Forbidden above zone rule (Constraint E)
    for p in existing_placements:
        # Check if p is strictly below the candidate
        if p['pos']['z'] + p['size']['height'] <= z + 1e-4:
            if p['fragility'] == 1 and candidate['fragility'] > 1:
                ia = intersect_area(
                    {'x': candidate['pos']['x'], 'y': candidate['pos']['y'], 'w': candidate['size']['width'], 'l': candidate['size']['length']},
                    {'x': p['pos']['x'], 'y': p['pos']['y'], 'w': p['size']['width'], 'l': p['size']['length']}
                )
                if ia > 0:
                    return False, "Forbidden-above: cannot place non-fragility=1 box over fragility=1 footprint"

    # 6. Max load check (global)
    for p in existing_placements:
        # If 'p' is somewhere below our candidate
        if p['pos']['z'] + p['size']['height'] <= z + 1e-4:
            ia = intersect_area(
                {'x': candidate['pos']['x'], 'y': candidate['pos']['y'], 'w': candidate['size']['width'], 'l': candidate['size']['length']},
                {'x': p['pos']['x'], 'y': p['pos']['y'], 'w': p['size']['width'], 'l': p['size']['length']}
            )
            if ia > 0:
                # Calculate current weight above p
                weight_above = candidate['weightKg']
                for upper in existing_placements:
                    if upper['pos']['z'] >= p['pos']['z'] + p['size']['height'] - 1e-4:
                        ia_upper = intersect_area(
                            {'x': upper['pos']['x'], 'y': upper['pos']['y'], 'w': upper['size']['width'], 'l': upper['size']['length']},
                            {'x': p['pos']['x'], 'y': p['pos']['y'], 'w': p['size']['width'], 'l': p['size']['length']}
                        )
                        if ia_upper > 0:
                            weight_above += upper['weightKg']
                if weight_above > p['maxLoadTopKg']:
                    return False, f"Max load exceeded on box below (Max {p['maxLoadTopKg']}Kg)"

    return True, ""


def calculate_loads_and_warnings(plan):
    warnings = []
    # global validation
    for pallet in plan.get('pallets', []):
        all_p = []
        for v in pallet.get('layers', []):
            all_p.extend(v['placements'])
        
        for p in all_p:
            weight_above = 0
            for upper in all_p:
                if upper['pos']['z'] >= p['pos']['z'] + p['size']['height'] - 1e-4:
                    ia = intersect_area(
                        {'x': upper['pos']['x'], 'y': upper['pos']['y'], 'w': upper['size']['width'], 'l': upper['size']['length']},
                        {'x': p['pos']['x'], 'y': p['pos']['y'], 'w': p['size']['width'], 'l': p['size']['length']}
                    )
                    if ia > 0:
                        weight_above += upper['weightKg']
            if weight_above > p['maxLoadTopKg']:
                warnings.append(f"Max load exceeded on {p['code']} (Max {p['maxLoadTopKg']}Kg, Got {weight_above}Kg)")
    
    plan['warnings'] = warnings
    return plan

def validate_plan(plan):
    container = plan['container']
    for pallet in plan.get('pallets', []):
        all_p = []
        for layer in pallet.get('layers', []):
            all_p.extend(layer['placements'])
            
        for i, p in enumerate(all_p):
            other_placements = all_p[:i] # since it's order of placement
            valid, msg = validate_placement(p, other_placements, container)
            if not valid:
                raise ValueError(f"Plan validation failed for box {p['code']} at {p['pos']}: {msg}")

    return calculate_loads_and_warnings(plan)
