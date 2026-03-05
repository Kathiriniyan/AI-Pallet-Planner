from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .models import PackRequest, PackResponse, InstructionRequest
from .storage import store
from .packer.engine import run_packing
from .ollama_client import enrich_items_with_ollama, generate_packing_instructions, check_ollama_status, generate_ai_sequence

load_dotenv()

app = FastAPI(title="Packing API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_DOC = {
  "success": True,
  "message": "Fetched picking list",
  "data": {
    "id": "DN-00045",
    "supplier": "Acme Foods BV",
    "status": "Pending",
    "transaction_date": "2025-09-20T00:00:00",
    "total_qty": 69.0,
    "total_net_weight": 445.0,
    "items": [
      { "item_code":"ITM-JACK-BOX", "item_name":"Jackfruit Crate", "country": "India", "qty":3, "weight_per_unit":10 },
      { "item_code":"ITM-PUMP-BOX", "item_name":"Pumpkin Box", "country": "Sri Lanka", "qty":4, "weight_per_unit":12 },
      { "item_code":"ITM-WAT-BOX", "item_name":"Watermelon Box", "country": "India", "qty":2, "weight_per_unit":15 },
      { "item_code":"ITM-OKRA-BOX", "item_name":"Okra (Lady's Finger) Box", "country": "Sri Lanka", "qty":8, "weight_per_unit":4 },
      { "item_code":"ITM-CUCU-BOX", "item_name":"Cucumber Box", "country": "India", "qty":6, "weight_per_unit":6 },
      { "item_code":"ITM-APPL-BOX", "item_name":"Apples Box", "country": "Canada", "qty":5, "weight_per_unit":8 },
      { "item_code":"ITM-BANA-BOX", "item_name":"Banana Box", "country": "India", "qty":6, "weight_per_unit":7 },
      { "item_code":"ITM-TOM-BOX", "item_name":"Tomato Box", "country": "Jaffna", "qty":10, "weight_per_unit":5 },
      { "item_code":"ITM-GRAP-BOX", "item_name":"Grapes Box", "country": "India", "qty":8, "weight_per_unit":4 },
      { "item_code":"ITM-CURRY-BOX", "item_name":"Curry Leaves Box", "country": "Jaffna", "qty":6, "weight_per_unit":2 },
      { "item_code":"ITM-DRUM-BOX", "item_name":"Drumstick (Moringa) Box", "country": "India", "qty":5, "weight_per_unit":5 },
      { "item_code":"ITM-CHIL-BOX", "item_name":"Green Chilli Box", "country": "India", "qty":6, "weight_per_unit":3 }
    ]
  }
}

BOX_CATALOG = {
    "ITM-JACK-BOX": { "dimsCm": { "L": 60, "W": 40, "H": 35 }, "fragility": 3, "maxLoadTopKg": 25, "allowRotate": "flat" },
    "ITM-TOM-BOX":  { "dimsCm": { "L": 40, "W": 30, "H": 20 }, "fragility": 1, "maxLoadTopKg": 8, "allowRotate": "flat" },
    "ITM-OKRA-BOX": { "dimsCm": { "L": 50, "W": 30, "H": 20 }, "fragility": 2, "maxLoadTopKg": 15, "allowRotate": "flat" },
    "ITM-CUCU-BOX": { "dimsCm": { "L": 50, "W": 35, "H": 20 }, "fragility": 2, "maxLoadTopKg": 15, "allowRotate": "flat" },
    "ITM-CURRY-BOX":{ "dimsCm": { "L": 40, "W": 30, "H": 15 }, "fragility": 1, "maxLoadTopKg": 5, "allowRotate": "flat" },
    "ITM-GRAP-BOX": { "dimsCm": { "L": 40, "W": 30, "H": 15 }, "fragility": 1, "maxLoadTopKg": 5, "allowRotate": "flat" },
    "ITM-BANA-BOX": { "dimsCm": { "L": 60, "W": 40, "H": 25 }, "fragility": 2, "maxLoadTopKg": 20, "allowRotate": "flat" },
    "ITM-APPL-BOX": { "dimsCm": { "L": 50, "W": 40, "H": 25 }, "fragility": 2, "maxLoadTopKg": 20, "allowRotate": "flat" },
    "ITM-PUMP-BOX": { "dimsCm": { "L": 60, "W": 40, "H": 40 }, "fragility": 3, "maxLoadTopKg": 30, "allowRotate": "flat" },
    "ITM-WAT-BOX":  { "dimsCm": { "L": 80, "W": 50, "H": 45 }, "fragility": 3, "maxLoadTopKg": 35, "allowRotate": "flat" },
    "ITM-DRUM-BOX": { "dimsCm": { "L": 60, "W": 30, "H": 20 }, "fragility": 2, "maxLoadTopKg": 15, "allowRotate": "flat" },
    "ITM-CHIL-BOX": { "dimsCm": { "L": 40, "W": 30, "H": 15 }, "fragility": 1, "maxLoadTopKg": 5, "allowRotate": "flat" }
}

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running! The API is at /api"}

@app.get("/api/doc/mock")
def get_mock_doc():
    return MOCK_DOC

@app.post("/api/pack/plan")
async def create_plan(payload: PackRequest):
    items_to_pack = [it.model_dump() for it in payload.items]
    ai_sequence = []
    
    if payload.useOllama:
        is_running = await check_ollama_status()
        if is_running:
            enriched_items = await enrich_items_with_ollama(items_to_pack, BOX_CATALOG)
            ai_sequence = await generate_ai_sequence(enriched_items)
        else:
            enriched_items = items_to_pack
    else:
        enriched_items = []
        for it in items_to_pack:
            meta = BOX_CATALOG.get(it["item_code"], { "dimsCm": { "L": 50, "W": 40, "H": 25 }, "fragility": 2, "maxLoadTopKg": 15, "allowRotate": "flat" })
            it["dimsCm"] = meta["dimsCm"]
            it["fragility"] = meta["fragility"]
            it["maxLoadTopKg"] = meta["maxLoadTopKg"]
            it["allowRotate"] = meta["allowRotate"]
            enriched_items.append(it)

    plan = run_packing(payload.container.model_dump(), enriched_items, ai_sequence=ai_sequence)
    store.save_plan(plan)
    return plan

@app.get("/api/pack/last")
def get_last_plan():
    plan = store.get_plan()
    if not plan:
        raise HTTPException(status_code=404, detail="No recent plan found")
    return plan

@app.post("/api/pack/instructions")
async def generate_instructions(payload: InstructionRequest):
    return await generate_packing_instructions(payload.plan)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
