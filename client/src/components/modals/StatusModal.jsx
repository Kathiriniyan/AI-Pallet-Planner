import React, { useState, useEffect } from 'react';

export default function StatusModal({ item, onClose, onSave }) {
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (item) setStatus(item.status || '');
    }, [item]);

    if (!item) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
            <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full relative">
                <button type="button" className="absolute top-3 right-4 text-gray-500 text-xl hover:text-red-500" onClick={onClose}>×</button>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h2>

                <div className="flex items-center gap-4 mb-4">
                    <img src={item.img} className="w-20 h-20 rounded-lg border border-gray-300 object-contain" alt="" />
                    <div className="min-w-0">
                        <div className="font-medium text-gray-800 truncate">{item.item_name}</div>
                        <div className="text-gray-500 text-sm">Origin: <span>{item.country}</span></div>
                    </div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="">Select Item Status</option>
                    <option value="Item not available">Item not available</option>
                    <option value="Waiting for Shipment">Waiting for Shipment</option>
                </select>

                <div className="flex justify-end mt-5">
                    <button type="button" className="bg-red-600 text-white px-6 py-2 rounded-md" onClick={() => onSave(status)}>Save</button>
                </div>
            </div>
        </div>
    );
}
