import pytest
from packer.engine import run_packing

MOCK_CATALOG = {
    "HEAVY_STURDY": {"dimsCm": {"L": 50, "W": 50, "H": 50}, "fragility": 5, "maxLoadTopKg": 100, "allowRotate": "flat"},
    "FRAGILE_LIGHT": {"dimsCm": {"L": 50, "W": 50, "H": 25}, "fragility": 1, "maxLoadTopKg": 10, "allowRotate": "flat"},
    "MEDIUM": {"dimsCm": {"L": 50, "W": 50, "H": 50}, "fragility": 3, "maxLoadTopKg": 40, "allowRotate": "flat"}
}

# Mock container and boxes
CONTAINER = {
    "lengthCm": 100,
    "widthCm": 100,
    "heightCm": 100,
    "maxWeightKg": 1000,
    "orientPolicy": "flat",
    "align": "BL"
}

def get_base_items():
    return [
        {
            "item_code": "BOX_A",
            "item_name": "A",
            "dimsCm": {"L": 50, "W": 50, "H": 50}, # volume = 125,000
            "weightKg": 20,
            "fragility": 5, # Sturdy
            "maxLoadTopKg": 200,
            "allowRotate": "flat",
            "qty": 8  # Total Vol = 1,000,000 = exact fit for 100x100x100 container
        }
    ]

def test_no_early_pallet():
    # 8 boxes of 50x50x50 exactly fill 100x100x100 (2x2x2)
    # The Extreme Points + Beam Search should be able to find this perfect packing
    items = get_base_items()
    plan = run_packing(CONTAINER, items)
    
    assert len(plan["pallets"]) == 1, "Should fit in 1 pallet"
    assert len(plan["unplaced"]) == 0
    
    # Calculate utilization
    p1 = plan["pallets"][0]
    assert p1["utilization"] == 1.0, f"Expected 100% utilization, got {p1['utilization']}"

def test_no_floating_and_fragility():
    # Box B must sit on top of Box A
    # We make Box A 100x100x50 (bottom half)
    # Box B is 100x100x50 (top half)
    items = [
       { "item_code": "BOTTOM", "item_name": "bot", "dimsCm": {"L": 100, "W": 100, "H": 50}, "weightKg": 50, "fragility": 5, "maxLoadTopKg": 100, "allowRotate": "flat", "qty": 1 },
       { "item_code": "TOP", "item_name": "top", "dimsCm": {"L": 100, "W": 100, "H": 50}, "weightKg": 50, "fragility": 3, "maxLoadTopKg": 100, "allowRotate": "flat", "qty": 1 }
    ]
    
    plan = run_packing(CONTAINER, items)
    assert len(plan["pallets"]) == 1
    
    # Check that TOP is physically at z=50
    placements = plan["pallets"][0]["layers"][0]["placements"]
    bot_p = next(p for p in placements if p["code"] == "BOTTOM")
    top_p = next(p for p in placements if p["code"] == "TOP")
    
    assert bot_p["pos"]["z"] == 0
    assert top_p["pos"]["z"] == 50
    assert len(plan["warnings"]) == 0

def test_forbidden_above_zone():
    # Place a FRAGILE_LIGHT (fragility 1) and try to put MEDIUM (fragility 3) on top of it.
    # The engine should refuse to put MEDIUM on top because of Constraint E (forbidden above).
    # To force the issue, we give a tiny container: 50x50 base, 100 height.
    small_cont = {
        "lengthCm": 50,
        "widthCm": 50,
        "heightCm": 100,
        "maxWeightKg": 1000,
        "orientPolicy": "flat",
        "align": "BL"
    }
    
    items = [
         # 50x50x50, fragility 1 (tomatoes)
       { "item_code": "FRAGILE_LIGHT", "item_name": "tomatoes", "dimsCm": {"L": 50, "W": 50, "H": 50}, "weightKg": 5, "fragility": 1, "maxLoadTopKg": 10, "allowRotate": "flat", "qty": 1 },
         # 50x50x50, fragility 3 (cans)
       { "item_code": "MEDIUM", "item_name": "cans", "dimsCm": {"L": 50, "W": 50, "H": 50}, "weightKg": 25, "fragility": 3, "maxLoadTopKg": 100, "allowRotate": "flat", "qty": 1 }
    ]
    
    plan = run_packing(small_cont, items)
    
    # Since area is 50x50, they have to stack.
    # Because of EP hole-filling & alternating, it tries permutations.
    # But because of rules, MEDIUM can NEVER be placed over FRAGILE_LIGHT.
    # However, FRAGILE_LIGHT CAN be placed over MEDIUM.
    # So the only valid stack is z=0: MEDIUM, z=50: FRAGILE_LIGHT
    placements = plan["pallets"][0]["layers"][0]["placements"]
    placements.sort(key=lambda p: p["pos"]["z"])
    
    bottom = placements[0]
    top = placements[1]
    
    assert bottom["code"] == "MEDIUM"
    assert top["code"] == "FRAGILE_LIGHT"

def test_utilization():
    # mixed boxes, utilization should be >= 0.60
    items = [
        {"item_code": f"B{i}", "item_name": "M", "dimsCm": {"L": 40, "W": 30, "H": 20}, "weightKg": 10, "fragility": 5, "maxLoadTopKg": 100, "allowRotate": "none", "qty": 20}
    ]
    plan = run_packing(CONTAINER, items)
    
    u = plan["pallets"][0]["utilization"]
    assert u >= 0.60, f"Expected good utilization, got {u}"
