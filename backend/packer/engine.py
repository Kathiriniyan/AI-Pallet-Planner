import copy
from itertools import permutations
from .rules import validate_placement, validate_plan, calculate_loads_and_warnings

def get_orientations(item, allow_rotate):
    L, W, H = item['dimsCm']['L'], item['dimsCm']['W'], item['dimsCm']['H']
    if allow_rotate == 'flat':
        return [
            {'width': W, 'length': L, 'height': H, 'orientation': 'W,L,H'},
            {'width': L, 'length': W, 'height': H, 'orientation': 'L,W,H'}
        ]
    else:
        return [
            {'width': W, 'length': L, 'height': H, 'orientation': 'W,L,H'},
            {'width': L, 'length': W, 'height': H, 'orientation': 'L,W,H'},
            {'width': W, 'length': H, 'height': L, 'orientation': 'W,H,L'},
            {'width': H, 'length': W, 'height': L, 'orientation': 'H,W,L'},
            {'width': L, 'length': H, 'height': W, 'orientation': 'L,H,W'},
            {'width': H, 'length': L, 'height': W, 'orientation': 'H,L,W'}
        ]

def score_pallet_state(state, container):
    # State: dict with 'placements', 'eps', 'used_vol'
    W, L, H = container['widthCm'], container['lengthCm'], container['heightCm']
    max_z = 0
    min_x, max_x = W, 0
    min_y, max_y = L, 0
    
    for p in state['placements']:
        px, py, pz = p['pos']['x'], p['pos']['y'], p['pos']['z']
        pw, pl, ph = p['size']['width'], p['size']['length'], p['size']['height']
        max_z = max(max_z, pz + ph)
        min_x = min(min_x, px)
        max_x = max(max_x, px + pw)
        min_y = min(min_y, py)
        max_y = max(max_y, py + pl)
        
    used_floor_area = (max_x - min_x) * (max_y - min_y) if state['placements'] else 0
    unused_floor_area = (W * L) - used_floor_area
    utilization_volume = state['used_vol'] / (W * L * H) if W*L*H > 0 else 0
    fragmentation_count = len(state['eps'])
    
    # score = 1000*(U) - 5*(F) - 2*(A) - 1*(H)
    score = (1000 * utilization_volume) - (5 * fragmentation_count) - (2 * unused_floor_area) - (1 * (max_z / max(1, H)))
    return score

def update_extreme_points(eps, placed_box, container):
    x, y, z = placed_box['pos']['x'], placed_box['pos']['y'], placed_box['pos']['z']
    w, l, h = placed_box['size']['width'], placed_box['size']['length'], placed_box['size']['height']
    W, L, H = container['widthCm'], container['lengthCm'], container['heightCm']
    
    # Remove EPs that are now physically inside or on the boundaries of the placed box
    new_eps = []
    for ep in eps:
        # If an EP is strictly inside the box boundaries, it's dead
        if (x <= ep[0] < x + w) and (y <= ep[1] < y + l) and (z <= ep[2] < z + h):
            continue
        new_eps.append(ep)
        
    # Add new extreme points (top, front, right)
    candidates = [
        (x + w, y, z), # right
        (x, y + l, z), # front  
        (x, y, z + h)  # top
    ]
    
    # Clamp to container and add
    for cx, cy, cz in candidates:
        if cx < W and cy < L and cz < H:
            new_eps.append((cx, cy, cz))
            
    # Deduplicate
    new_eps = list(set(new_eps))
    # Sort lower z, then y, then x
    new_eps.sort(key=lambda p: (p[2], p[1], p[0]))
    return new_eps

def beam_search_pack_pallet(items, container, K=20):
    # Items: list of dicts. We want to place as many as possible to maximize score.
    # We maintain top K states. A state is dict: {'placements': [], 'eps': [(0,0,0)], 'remaining_items': items, 'score': 0, 'used_vol': 0}
    
    initial_state = {
        'placements': [], 
        'eps': [(0,0,0)], 
        'remaining_items': sorted(items, key=lambda x: x['dimsCm']['L'] * x['dimsCm']['W'], reverse=True), # start sorted big
        'used_vol': 0,
        'used_weight': 0
    }
    
    beam = [initial_state]
    best_overall_state = initial_state
    
    # Continue expanding while at least one state in beam can still place an item
    placed_something_in_beam = True
    while placed_something_in_beam:
        placed_something_in_beam = False
        new_states = []
        
        for state in beam:
            if not state['remaining_items']:
                # Already complete, pass it to next tier
                new_states.append(state)
                continue
                
            # Try to place items. To limit branching, we pick the FIRST few items that fit, 
            # alternating large vs small (Hole Filling Phase)
            # Find largest fitting
            large_item = None
            small_item = None
            
            # Sort remaining by size desc for phase A
            rem_desc = sorted(state['remaining_items'], key=lambda x: x['dimsCm']['L'] * x['dimsCm']['W'], reverse=True)
            # Sort remaining by size asc for phase B (hole fill)
            rem_asc = sorted(state['remaining_items'], key=lambda x: x['dimsCm']['L'] * x['dimsCm']['W'])
            
            items_to_try = []
            if rem_desc: items_to_try.append(rem_desc[0])
            if rem_asc and len(rem_asc) > 1: items_to_try.append(rem_asc[0])
            
            # For each item, try all orientations on all EPs
            item_placed = False
            for item in items_to_try:
                if state['used_weight'] + item['weightKg'] > container['maxWeightKg']:
                    continue
                    
                for orient in get_orientations(item, item['allowRotate']):
                    w, l, h = orient['width'], orient['length'], orient['height']
                    for ep in state['eps']:
                        candidate = {
                            'code': item['item_code'],
                            'name': item['item_name'],
                            'weightKg': item['weightKg'],
                            'fragility': item['fragility'],
                            'maxLoadTopKg': item['maxLoadTopKg'],
                            'size': {'width': w, 'length': l, 'height': h},
                            'pos': {'x': ep[0], 'y': ep[1], 'z': ep[2], 'orientation': orient['orientation']}
                        }
                        
                        valid, _ = validate_placement(candidate, state['placements'], container)
                        if valid:
                            item_placed = True
                            placed_something_in_beam = True
                            
                            new_placements = list(state['placements'])
                            new_placements.append(candidate)
                            
                            new_eps = update_extreme_points(state['eps'], candidate, container)
                            
                            # Safely remove this specific instance from remaining (using id logic or list remove)
                            new_rem = list(state['remaining_items'])
                            # remove the first dict that matches item_code (since multiples exist)
                            for r in new_rem:
                                if r['item_code'] == item['item_code']:
                                    new_rem.remove(r)
                                    break
                                    
                            new_vol = state['used_vol'] + (w * l * h)
                            new_weight = state['used_weight'] + item['weightKg']
                            
                            child_state = {
                                'placements': new_placements,
                                'eps': new_eps,
                                'remaining_items': new_rem,
                                'used_vol': new_vol,
                                'used_weight': new_weight
                            }
                            # Score it
                            child_state['score'] = score_pallet_state(child_state, container)
                            new_states.append(child_state)
            
            if not item_placed:
                # This state can't expand further, keep it for the top K
                if 'score' not in state:
                    state['score'] = score_pallet_state(state, container)
                new_states.append(state)
                
        # Deduplicate states by packing signature to avoid beam collapse into identical paths
        unique_states = {}
        for s in new_states:
            sig = frozenset((p['code'], p['pos']['x'], p['pos']['y'], p['pos']['z']) for p in s['placements'])
            if sig not in unique_states or s['score'] > unique_states[sig]['score']:
                unique_states[sig] = s
                
        # Keep top K
        sorted_states = sorted(list(unique_states.values()), key=lambda x: x.get('score', -9999), reverse=True)
        beam = sorted_states[:K]
        
        if beam and beam[0].get('score', -9999) > best_overall_state.get('score', -9999):
            best_overall_state = beam[0]

    return best_overall_state


def try_pack_pallet(items, container, pallet_idx, ai_sequence=None):
    # Use True 3D Beam Search
    # If AI sequence is passed, optionally seed the beam or score items in that order. 
    # For now, beam search natively explores both large/small paths robustly.
    best_state = beam_search_pack_pallet(items, container, K=20)
    
    if not best_state['placements']:
        return None, items
        
    placements = best_state['placements']
    utilization = best_state['used_vol'] / (container['widthCm'] * container['lengthCm'] * container['heightCm'])
    used_height = max([p['pos']['z'] + p['size']['height'] for p in placements] + [0])
    
    # Format to schema
    for p in placements:
        p['palletId'] = f"P{pallet_idx}"
        p['layerIndex'] = 1
        
    pallet_out = {
        "palletId": f"P{pallet_idx}",
        "usedHeightCm": used_height,
        "usedWeightKg": best_state['used_weight'],
        "utilization": utilization,
        "layers": [{
            "layerIndex": 1,
            "z0": 0,
            "height": used_height,
            "placements": placements
        }],
        "warnings": []
    }
    
    return pallet_out, best_state['remaining_items']

def run_packing(container, items, ai_sequence=None):
    flat_items = []
    for it in items:
        for _ in range(int(it['qty'])):
            flat_items.append(it)
            
    pallets = []
    unplaced = list(flat_items)
    pallet_idx = 1
    
    while unplaced:
        pallet, remaining = try_pack_pallet(unplaced, container, pallet_idx, ai_sequence)
        
        # If no item could be placed on a fresh pallet, we are physically stuck
        if not pallet or len(remaining) == len(unplaced):
            break
            
        pallets.append(pallet)
        unplaced = remaining
        pallet_idx += 1
        
    plan = {
        "container": container,
        "pallets": pallets,
        "unplaced": unplaced,
        "warnings": []
    }
    
    try:
        plan = validate_plan(plan)
    except ValueError as e:
        plan['warnings'].append(str(e))
        
    return plan
