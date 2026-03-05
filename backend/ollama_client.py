import httpx
import json
import os
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = f"{os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434').rstrip('/')}/api/generate"
MODEL_NAME = os.getenv('OLLAMA_MODEL', 'gpt-oss:120b-cloud')

async def call_ollama(system_prompt: str, user_prompt: str) -> dict:
    prompt = f"{system_prompt}\n\n{user_prompt}"
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            response_text = data.get("response", "")
            return json.loads(response_text)
            
    except httpx.ConnectError:
        print("Error: Ollama is offline or unreachable", flush=True)
        raise HTTPException(status_code=503, detail="Ollama is offline or unreachable")
    except httpx.TimeoutException:
        print("Error: Ollama request timed out", flush=True)
        raise HTTPException(status_code=504, detail="Ollama request timed out")
    except json.JSONDecodeError:
        print("Error: Ollama returned invalid JSON", flush=True)
        raise HTTPException(status_code=422, detail="Ollama returned invalid JSON")
    except Exception as e:
        print(f"Error calling Ollama: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

async def check_ollama_status() -> bool:
    print("Checking Ollama model...", flush=True)
    try:
        # Just ping the local host
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434').rstrip('/')}/api/tags")
            if resp.status_code == 200:
                print("Connecting to Ollama model... SUCCESS", flush=True)
                return True
    except Exception:
        pass
    print("Connecting to Ollama model... FAILED", flush=True)
    return False

async def generate_ai_sequence(items_input: list) -> list:
    system = "You are a 3D packing AI. Output ONLY valid JSON. No markdown."
    user = f"""Analyze these boxes and propose an optimal packing sequence targeting maximum space utilization.
Return JSON exactly:
{{
  "sequence_item_codes": ["code1", "code2", ...]
}}

Sort heavy/sturdy boxes first, then fragile. Mix sizes to fill gaps. Do not omit any items.
ITEMS:
{json.dumps([{"code": i["item_code"], "weight": i["weightKg"], "fragility": i["fragility"], "qty": i["qty"]} for i in items_input])}"""

    try:
        result = await call_ollama(system, user)
        # expand by qty 
        seq = result.get("sequence_item_codes", [])
        return seq
    except Exception as e:
        print(f"Failed to generate AI sequence: {e}", flush=True)
        return []

async def enrich_items_with_ollama(items_input: list, box_catalog: dict) -> list:
    system = "You are a packing metadata resolver. Output ONLY valid JSON. No markdown. No explanations."
    user = f"""Resolve packing metadata for pallet packing.

Return JSON exactly:
{{
  "packing_items":[
    {{
      "item_code":"...",
      "item_name":"...",
      "qty": 0,
      "weightKg": 0.0,
      "dimsCm":{{"L":0,"W":0,"H":0}},
      "fragility": 1,
      "maxLoadTopKg": 0.0,
      "allowRotate":"flat",
      "estimated": true
    }}
  ],
  "notes":[]
}}

Rules:
- If item_code exists in BOX_CATALOG use it.
- Otherwise infer dims from item_name (e.g. "5Kg") and typical produce box sizes.
- Tomatoes/grapes/curry leaves/leafy => fragility 1
- Okra/banana/papaya/mango => fragility 2-3
- Pumpkin/jackfruit/watermelon/potato => fragility 4-5
- maxLoadTopKg: fragility1 3-8, fragility2 10-25, fragility3 25-40, fragility4 40-60, fragility5 60-100

ITEMS_INPUT:
{json.dumps(items_input)}

BOX_CATALOG:
{json.dumps(box_catalog)}"""

    result = await call_ollama(system, user)
    return result.get("packing_items", items_input)

async def generate_packing_instructions(plan: dict) -> dict:
    system = "You are a warehouse packing assistant. Output ONLY valid JSON. No markdown. No explanations."
    user = f"""Write step-by-step packing instructions for humans using this plan JSON.
Do not change the plan. Do not invent boxes.

Return JSON:
{{
  "instructions":[
    {{
      "palletId":"P1",
      "layers":[
        {{ "layerIndex":1, "steps":[ "...", "..." ] }}
      ]
    }}
  ],
  "checklist":[ "...", "..." ]
}}

PLAN:
{json.dumps(plan)}"""

    return await call_ollama(system, user)
