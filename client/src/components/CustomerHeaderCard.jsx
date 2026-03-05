import React, { useState } from 'react';

export default function CustomerHeaderCard({ items, docId }) {
    const [isOpen, setIsOpen] = useState(false);
    const firstItem = items[0] || {};
    const customerName = "Acme Foods BV"; // Extracted from mock or hardcoded as in original

    const totalQty = items.reduce((sum, item) => sum + item.required_qty, 0);
    const totalNetWeight = items.reduce((sum, item) => sum + (item.required_qty * item.weight_per_unit), 0);

    return (
        <div className="backdrop-blur-lg bg-white/70 shadow-xl rounded-2xl p-6 mb-6 border border-white/20 text-sm">
            <h2 className="text-xl font-bold text-red-600 mb-4 hidden sm:block">Customer Details</h2>

            {/* Mobile-only customer toggle */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="sm:hidden w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
                <span className="font-semibold text-gray-800">
                    Customer: <span>{customerName}</span>
                </span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                </svg>
            </button>

            <div className={`${isOpen ? 'grid' : 'hidden'} sm:grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 sm:mt-0`}>
                <p className="hidden sm:block"><strong>Customer:</strong> <span>{customerName}</span></p>
                <p><strong>Sales Order ID:</strong> <span>No Sales Order Linked</span></p>
                <p><strong>Pick List ID:</strong> <span>{docId}</span></p>
                <p><strong>Total Quantity:</strong> <span>{totalQty}</span></p>
                <p><strong>Total Net Weight:</strong> <span>{totalNetWeight.toFixed(2)}</span></p>
                <p>
                    <strong>Status:</strong>
                    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold text-black bg-yellow-500 ml-1">Pending</span>
                </p>
                <p><strong>Picking Date:</strong> <span>2025-09-20</span></p>
            </div>
        </div>
    );
}
