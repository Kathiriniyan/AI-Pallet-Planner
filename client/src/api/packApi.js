const API_BASE_URL = 'http://localhost:8000/api';

export async function createPlan(payload) {
    const response = await fetch(`${API_BASE_URL}/pack/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(`Failed to create plan: ${response.statusText}`);
    }
    return response.json();
}

export async function getLastPlan() {
    const response = await fetch(`${API_BASE_URL}/pack/last`);
    if (!response.ok) {
        throw new Error(`Failed to fetch last plan: ${response.statusText}`);
    }
    return response.json();
}

export async function generateInstructions(planJson) {
    const response = await fetch(`${API_BASE_URL}/pack/instructions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planJson })
    });
    if (!response.ok) {
        throw new Error(`Failed to generate instructions: ${response.statusText}`);
    }
    return response.json();
}
