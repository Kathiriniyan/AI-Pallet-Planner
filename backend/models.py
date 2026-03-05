from pydantic import BaseModel
from typing import List, Optional, Literal, Dict

class Container(BaseModel):
    lengthCm: float
    widthCm: float
    heightCm: float
    maxWeightKg: float
    orientPolicy: Literal['flat', 'all6']
    align: Literal['LR', 'RL']

class PackItem(BaseModel):
    item_code: str
    item_name: str
    qty: int
    weightKg: float

class PackRequest(BaseModel):
    container: Container
    items: List[PackItem]
    useOllama: bool = False

class Placement(BaseModel):
    code: str
    name: str
    weightKg: float
    fragility: int
    maxLoadTopKg: float
    size: dict
    pos: dict
    palletId: str
    layerIndex: int

class Layer(BaseModel):
    z0: float
    height: float
    placements: List[Placement]

class Pallet(BaseModel):
    palletId: str
    usedHeightCm: float
    usedWeightKg: float
    layers: List[Layer]
    warnings: List[str]

class PackResponse(BaseModel):
    container: dict
    pallets: List[Pallet]
    unplaced: List[dict]
    warnings: List[str]

class InstructionRequest(BaseModel):
    plan: dict
