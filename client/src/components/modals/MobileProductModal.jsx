import React, { useState, useEffect } from 'react';

export default function MobileProductModal({ item, onClose, onUpdateItem }) {
    const [localItem, setLocalItem] = useState(null);

    useEffect(() => {
        if (item) setLocalItem({ ...item });
    }, [item]);

    if (!localItem) return null;

    const handlePickedChange = (val) => {
        const newVal = Math.max(0, Math.min(Number(val), localItem.required_qty));
        setLocalItem(prev => ({ ...prev, picked: newVal }));
    };

    const handleAdditionalChange = (val) => {
        const newVal = Math.max(0, Number(val));
        setLocalItem(prev => ({ ...prev, additional: newVal }));
    };

    const handleConfirm = () => {
        setLocalItem(prev => ({ ...prev, confirmed: true }));
    };

    const handleSave = () => {
        onUpdateItem(localItem);
        onClose();
    };

    const isFinalized = false; // We can pass this as prop if needed
    const totalQty = (localItem.picked + localItem.additional).toFixed(2);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4 sm:hidden">
            <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md relative overflow-y-auto max-h-[90vh]">
                <button type="button" className="absolute top-3 right-4 text-gray-500 text-xl hover:text-red-500" onClick={onClose}>×</button>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h2>

                <div className="flex items-center gap-4 mb-4">
                    <img src={localItem.img} className="w-20 h-20 rounded-lg border border-gray-300 object-contain" alt="" />
                    <div className="min-w-0">
                        <div className="font-medium text-gray-800 truncate">{localItem.item_name}</div>
                        <div className="text-gray-500 text-sm">Origin: <span>{localItem.country}</span></div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Picked Quantity</label>
                    <div className="flex items-center gap-2 mt-1">
                        <button className="w-12 h-10 rounded-lg bg-red-100 text-red-600 font-bold" onClick={() => handlePickedChange(localItem.picked - 1)}>−</button>
                        <input type="number" min="0" className="w-full text-center border border-gray-300 rounded-md px-2 py-1"
                            value={localItem.picked || ''} onChange={e => handlePickedChange(e.target.value)} />
                        <button className="w-12 h-10 rounded-lg bg-red-100 text-red-600 font-bold" onClick={() => handlePickedChange(localItem.picked + 1)}>+</button>
                        <button className={`w-12 h-10 rounded-lg flex items-center justify-center font-bold ml-2 ${localItem.confirmed ? 'bg-green-400 text-white' : 'bg-green-100 text-green-600'}`}
                            onClick={handleConfirm} disabled={localItem.confirmed}>✓</button>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Additional Quantity</label>
                    <div className="flex items-center gap-2 mt-1">
                        <button className={`w-12 h-10 rounded-lg font-bold ${!localItem.confirmed ? 'bg-gray-200 text-gray-400' : 'bg-yellow-100 text-yellow-600'}`}
                            onClick={() => handleAdditionalChange(localItem.additional - 1)} disabled={!localItem.confirmed}>−</button>
                        <input type="number" min="0" className={`w-full text-center rounded-md border ${localItem.confirmed ? 'border-yellow-400 bg-white' : 'border-gray-300 bg-gray-100'} px-2 py-1`}
                            value={localItem.additional || ''} onChange={e => handleAdditionalChange(e.target.value)} disabled={!localItem.confirmed} />
                        <button className={`w-12 h-10 rounded-lg font-bold ${!localItem.confirmed ? 'bg-gray-200 text-gray-400' : 'bg-yellow-100 text-yellow-600'}`}
                            onClick={() => handleAdditionalChange(localItem.additional + 1)} disabled={!localItem.confirmed}>+</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-gray-500">Required Qty</div>
                        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-center">{localItem.required_qty}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Total Qty</div>
                        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-center">{totalQty}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Weight / Unit</div>
                        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-center">{localItem.weight_per_unit}</div>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select value={localItem.status || ''} onChange={e => setLocalItem(prev => ({ ...prev, status: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2">
                        <option value="">Select Item Status</option>
                        <option value="Item not available">Item not available</option>
                        <option value="Waiting for Shipment">Waiting for Shipment</option>
                    </select>
                </div>

                <div className="flex justify-end mt-5">
                    <button type="button" className="bg-red-600 text-white px-6 py-2 rounded-md" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}
