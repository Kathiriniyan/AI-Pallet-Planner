import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPlan, generateInstructions } from '../api/packApi';
import { downloadJSON } from '../lib/download';
import { ftToCm } from '../lib/units';

export default function PackingAutomationCard({ items, addToast }) {
    const navigate = useNavigate();
    const [params, setParams] = useState({
        lengthFt: 4, widthFt: 6, heightFt: 4,
        type: 'pallet', orientPolicy: 'all6', packAlign: 'LR'
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [instructions, setInstructions] = useState(null);

    const handlePack = async () => {
        setLoading(true);
        try {
            // Collect picked and additional quantities
            const itemsToPack = items.filter(it => (it.picked + it.additional) > 0).map(it => ({
                item_code: it.item_code,
                item_name: it.item_name,
                qty: it.picked + it.additional,
                weightKg: it.weight_per_unit
            }));

            const payload = {
                container: {
                    lengthCm: ftToCm(params.lengthFt),
                    widthCm: ftToCm(params.widthFt),
                    heightCm: ftToCm(params.heightFt),
                    maxWeightKg: 1000,
                    orientPolicy: params.orientPolicy,
                    align: params.packAlign
                },
                items: itemsToPack,
                useOllama: true
            };

            const plan = await createPlan(payload);
            setResult(plan);
            localStorage.setItem('lastPlan', JSON.stringify(plan));
            addToast('Packing plan generated successfully', 'success');
        } catch (err) {
            addToast(err.message || 'Error creating plan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInstructions = async () => {
        if (!result) return;
        try {
            const instr = await generateInstructions(result);
            setInstructions(instr);
        } catch (err) {
            addToast(err.message || 'Error generating instructions', 'error');
        }
    };

    return (
        <div className="backdrop-blur-lg bg-white/80 shadow-xl rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-bold text-red-600 mb-4 hidden sm:block">Packing Automation (Picked Items)</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 mt-4 text-sm">
                <div>
                    <label className="block text-gray-600 mb-1">Length (ft)</label>
                    <input type="number" step="0.1" value={params.lengthFt} onChange={e => setParams({ ...params, lengthFt: e.target.value })} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Width (ft)</label>
                    <input type="number" step="0.1" value={params.widthFt} onChange={e => setParams({ ...params, widthFt: e.target.value })} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Height (ft)</label>
                    <input type="number" step="0.1" value={params.heightFt} onChange={e => setParams({ ...params, heightFt: e.target.value })} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Type</label>
                    <select value={params.type} onChange={e => setParams({ ...params, type: e.target.value })} className="w-full border rounded-md px-3 py-2">
                        <option value="pallet">Pallet</option>
                        <option value="box">Box / Carton</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Orientation</label>
                    <select value={params.orientPolicy} onChange={e => setParams({ ...params, orientPolicy: e.target.value })} className="w-full border rounded-md px-3 py-2">
                        <option value="flat">Flat only</option>
                        <option value="all6">All rotations</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-600 mb-1">Pack Direction</label>
                    <select value={params.packAlign} onChange={e => setParams({ ...params, packAlign: e.target.value })} className="w-full border rounded-md px-3 py-2">
                        <option value="LR">Left → Right</option>
                        <option value="RL">Right → Left</option>
                    </select>
                </div>
                <div className="flex items-end col-span-2">
                    <button onClick={handlePack} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-md px-4 py-2 disabled:opacity-50">
                        {loading ? 'Packing...' : 'Packing Plan'}
                    </button>
                </div>
            </div>

            {result && (
                <div className="mt-5 text-sm p-4 bg-gray-50 rounded border">
                    <h3 className="font-bold mb-2">Plan Summary</h3>
                    <p>Pallets used: {result.pallets?.length || 0}</p>
                    <p>Unplaced items: {result.unplaced?.length || 0}</p>

                    <div className="flex gap-2 mt-4 flex-wrap">
                        <button onClick={() => downloadJSON(result, 'packing_plan.json')} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md">
                            Download JSON
                        </button>
                        <button onClick={() => window.print()} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md">
                            Print
                        </button>
                        <button onClick={() => navigate('/pallet3d')} className="px-3 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md font-semibold">
                            View 3D Model
                        </button>
                        <button onClick={handleInstructions} className="px-3 py-2 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-md font-semibold">
                            Generate Instructions
                        </button>
                    </div>

                    {instructions && (
                        <div className="mt-4 p-3 bg-white border border-purple-200 rounded">
                            <h4 className="font-bold text-purple-800">Checklist</h4>
                            <ul className="list-disc pl-5 mb-3">
                                {instructions.checklist?.map((chk, i) => <li key={i}>{chk}</li>)}
                            </ul>
                            <h4 className="font-bold text-purple-800">Steps</h4>
                            {instructions.instructions?.map((inst, i) => (
                                <div key={i} className="mb-2">
                                    <strong>{inst.palletId}</strong>
                                    {inst.layers.map((lyr, j) => (
                                        <div key={j} className="ml-4">
                                            <em>Layer {lyr.layerIndex}</em>
                                            <ul className="list-decimal pl-5">
                                                {lyr.steps.map((st, k) => <li key={k}>{st}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
