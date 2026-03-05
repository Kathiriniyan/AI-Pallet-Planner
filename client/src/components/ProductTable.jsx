import React, { useState } from 'react';

export default function ProductTable({
    items,
    setItems,
    isFinalized,
    openImageModal,
    openStatusModal,
    openMobileModal
}) {
    const [sortDir, setSortDir] = useState('asc'); // asc or desc
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const handleSort = () => {
        const newDir = sortDir === 'desc' ? 'asc' : 'desc';
        setSortDir(newDir);
        setPage(1);
    };

    const sortedItems = [...items].sort((a, b) => {
        const diff = a.weight_per_unit - b.weight_per_unit;
        return sortDir === 'desc' ? -diff : diff;
    });

    const totalPages = Math.max(1, Math.ceil(sortedItems.length / rowsPerPage));
    const displayedItems = sortedItems.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const updateItem = (uid, updater) => {
        setItems(prev => prev.map(it => it.uid === uid ? updater(it) : it));
    };

    const handlePickedChange = (uid, val) => {
        if (isFinalized) return;
        updateItem(uid, it => ({
            ...it,
            picked: Math.max(0, Math.min(Number(val), it.required_qty))
        }));
    };

    const handleAdditionalChange = (uid, val) => {
        if (isFinalized) return;
        updateItem(uid, it => ({
            ...it,
            additional: Math.max(0, Number(val))
        }));
    };

    const handleConfirm = (uid) => {
        if (isFinalized) return;
        updateItem(uid, it => ({ ...it, confirmed: true }));
    };

    return (
        <div>
            <div className="flex items-center justify-end mb-2">
                <button
                    onClick={handleSort}
                    disabled={isFinalized}
                    className={`flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm ${isFinalized ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <svg className={`h-4 w-4 transform transition-transform ${sortDir === 'asc' ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                    Weight
                </button>
            </div>

            <div className="overflow-x-auto backdrop-blur-lg bg-white/60 rounded-2xl shadow-lg border border-white/20 pb-6">
                <table className="min-w-full text-sm md:text-base table-auto">
                    <thead className="bg-indigo-100/70">
                        <tr className="sm:hidden">
                            <th className="p-3 text-left font-semibold rounded-tl-lg">Product</th>
                            <th className="p-3 text-center font-semibold">Quantity</th>
                            <th className="p-3 text-center font-semibold rounded-tr-lg">Status</th>
                        </tr>
                        <tr className="hidden sm:table-row">
                            <th className="p-3 text-center font-semibold rounded-tl-lg w-8"> </th>
                            <th className="p-3 text-left font-semibold">Product</th>
                            <th className="p-3 text-center font-semibold">Country</th>
                            <th className="p-3 text-center font-semibold">Picked Qty</th>
                            <th className="p-3 text-center font-semibold">Required Qty</th>
                            <th className="p-3 text-center font-semibold">Additional Qty</th>
                            <th className="p-3 text-center font-semibold">Total Qty</th>
                            <th className="p-3 text-center font-semibold">Weight/Unit (kg)</th>
                            <th className="p-3 text-center font-semibold rounded-tr-lg">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedItems.length === 0 ? (
                            <tr><td colSpan="9" className="p-4 text-center text-red-500">No items.</td></tr>
                        ) : displayedItems.map(item => {
                            const totalQty = (item.picked + item.additional).toFixed(2);
                            let rowColor = '';
                            if (item.picked > 0 && item.picked < item.required_qty) rowColor = 'bg-blue-200/50';
                            if (item.picked === item.required_qty && item.required_qty > 0) rowColor = 'bg-green-200/50';

                            return (
                                <tr key={item.uid} className={`border-b border-white/30 transition ${rowColor}`} onClick={() => { if (window.innerWidth < 640) openMobileModal(item); }}>
                                    <td className="p-3 text-center hidden sm:table-cell align-middle">
                                        {!isFinalized && <span className="text-gray-400 cursor-grab">&#8942;&#8942;</span>}
                                    </td>
                                    <td className="p-3 cursor-pointer sm:cursor-auto text-left">
                                        <div className="flex items-center gap-3">
                                            <img src={item.img} onClick={(e) => { e.stopPropagation(); openImageModal(item.img); }} className="hidden sm:block w-16 h-16 rounded-lg object-contain border border-gray-300 cursor-pointer" alt="Item" />
                                            <div className="min-w-0">
                                                <div className="font-semibold text-gray-800 truncate">{item.item_name}</div>
                                                <div className="text-xs text-gray-500 sm:hidden">Box: {item.dimsCm?.L}×{item.dimsCm?.W}×{item.dimsCm?.H} cm</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center hidden sm:table-cell">{item.country}</td>

                                    {/* Picked */}
                                    <td className="p-3 hidden sm:table-cell">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); handlePickedChange(item.uid, item.picked - 1); }} className="w-8 h-8 rounded-md bg-red-100 text-red-600 font-bold">−</button>
                                            <input type="number" min="0" value={item.picked || ''} onClick={e => e.stopPropagation()} onChange={(e) => handlePickedChange(item.uid, e.target.value)} className="w-16 text-center rounded-md border border-gray-300 px-2 py-1" />
                                            <button onClick={(e) => { e.stopPropagation(); handlePickedChange(item.uid, item.picked + 1); }} className="w-8 h-8 rounded-md bg-red-100 text-red-600 font-bold">+</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleConfirm(item.uid); }} disabled={isFinalized || item.confirmed} className={`w-8 h-8 rounded-md flex items-center justify-center font-bold ${item.confirmed ? 'bg-green-400 text-white' : 'bg-green-100 text-green-600'}`}>✓</button>
                                        </div>
                                    </td>

                                    <td className="p-3 text-center hidden sm:table-cell">{item.required_qty}</td>

                                    {/* Additional */}
                                    <td className="p-3 hidden sm:table-cell">
                                        <div className="flex items-center justify-center gap-2">
                                            <button disabled={isFinalized || !item.confirmed} onClick={(e) => { e.stopPropagation(); handleAdditionalChange(item.uid, item.additional - 1); }} className={`w-8 h-8 rounded-md font-bold ${item.confirmed && !isFinalized ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'}`}>−</button>
                                            <input type="number" min="0" disabled={isFinalized || !item.confirmed} value={item.additional || ''} onClick={e => e.stopPropagation()} onChange={(e) => handleAdditionalChange(item.uid, e.target.value)} className={`w-16 text-center rounded-md border px-2 py-1 ${item.confirmed && !isFinalized ? 'border-yellow-400 bg-white' : 'border-gray-300 bg-gray-100'}`} />
                                            <button disabled={isFinalized || !item.confirmed} onClick={(e) => { e.stopPropagation(); handleAdditionalChange(item.uid, item.additional + 1); }} className={`w-8 h-8 rounded-md font-bold ${item.confirmed && !isFinalized ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'}`}>+</button>
                                        </div>
                                    </td>

                                    <td className="p-3 text-center hidden sm:table-cell font-semibold text-gray-900">
                                        <input type="text" readOnly value={totalQty} className="w-20 text-center border border-gray-300 rounded-md px-2 py-0.5 bg-gray-100" />
                                    </td>
                                    <td className="p-3 text-center hidden sm:table-cell">
                                        <input type="text" readOnly value={item.weight_per_unit} className="w-20 text-center border border-gray-300 rounded-md px-2 py-0.5 bg-gray-100" />
                                    </td>

                                    {/* MOBILE Qty */}
                                    <td className="p-3 text-center sm:hidden min-w-[120px]">
                                        <div className="text-sm">Total: {totalQty}</div>
                                        <div className="text-xs text-gray-500">Picked: {item.picked}</div>
                                        <div className="text-xs text-green-600">{item.confirmed ? 'Confirmed' : 'Unconfirmed'}</div>
                                    </td>

                                    <td className="p-3 text-center">
                                        <button onClick={(e) => { e.stopPropagation(); openStatusModal(item); }} className="text-gray-600 hover:text-red-600">
                                            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-between items-center mt-4 text-sm">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white disabled:opacity-40 hover:bg-red-700 transition">Prev</button>
                <span className="text-gray-600 font-semibold">Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white disabled:opacity-40 hover:bg-red-700 transition">Next</button>
            </div>
        </div>
    );
}
