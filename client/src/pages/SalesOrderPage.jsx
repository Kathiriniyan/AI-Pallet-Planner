import React, { useState, useEffect } from 'react';
import CustomerHeaderCard from '../components/CustomerHeaderCard';
import PackingAutomationCard from '../components/PackingAutomationCard';
import ProductTable from '../components/ProductTable';
import ToastStack from '../components/ToastStack';
import ImageModal from '../components/modals/ImageModal';
import StatusModal from '../components/modals/StatusModal';
import MobileProductModal from '../components/modals/MobileProductModal';
import { useDraft } from '../lib/useDraft';
import { mapDocToUIList } from '../lib/mapper';
import { MOCK_DOC } from '../data/assets';

const DOC_ID = MOCK_DOC.data.id;

export default function SalesOrderPage() {
    const initialItems = mapDocToUIList();
    const [items, setItems] = useDraft(DOC_ID, initialItems);
    const [isFinalized, setIsFinalized] = useState(false);

    const [toasts, setToasts] = useState([]);
    const [imgModalUrl, setImgModalUrl] = useState(null);
    const [activeStatusItem, setActiveStatusItem] = useState(null);
    const [activeMobileItem, setActiveMobileItem] = useState(null);

    const addToast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000);
    };

    const finalizeDocument = () => {
        setIsFinalized(true);
        addToast('Document finalized successfully', 'success');
    };

    const saveStatus = (status) => {
        if (activeStatusItem) {
            setItems(prev => prev.map(it =>
                it.uid === activeStatusItem.uid ? { ...it, status } : it
            ));
        }
        setActiveStatusItem(null);
    };

    const updateItemFromMobile = (updatedItem) => {
        setItems(prev => prev.map(it => it.uid === updatedItem.uid ? updatedItem : it));
    };

    return (
        <div className="bg-gradient-to-b from-indigo-50/60 to-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-6">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                    <div className="text-sm text-gray-400">
                        <span className="hover:text-red-600 transition cursor-pointer">Pick List</span>
                        <span className="mx-1">/</span>
                        <span className="font-semibold text-gray-700">{DOC_ID}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={() => window.print()}>
                            Print
                        </button>
                        {isFinalized ? (
                            <button className="px-3 py-2 rounded-lg bg-green-500/60 text-white text-sm cursor-not-allowed" disabled>
                                Already Finalized
                            </button>
                        ) : (
                            <button onClick={finalizeDocument} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm">
                                Finalize
                            </button>
                        )}
                    </div>
                </div>

                <CustomerHeaderCard items={items} docId={DOC_ID} />
                <PackingAutomationCard items={items} addToast={addToast} />

                <div className="space-y-0">
                    <ProductTable
                        items={items}
                        setItems={setItems}
                        isFinalized={isFinalized}
                        openImageModal={setImgModalUrl}
                        openStatusModal={setActiveStatusItem}
                        openMobileModal={setActiveMobileItem}
                    />
                </div>

                {isFinalized && (
                    <div className="mt-6 bg-yellow-100 border border-yellow-300 text-yellow-900 rounded-xl px-4 py-3 text-center font-medium">
                        This document has been finalized. No further editing is allowed.
                    </div>
                )}
            </div>

            <ToastStack toasts={toasts} />
            <ImageModal imgUrl={imgModalUrl} onClose={() => setImgModalUrl(null)} />
            <StatusModal item={activeStatusItem} onClose={() => setActiveStatusItem(null)} onSave={saveStatus} />
            <MobileProductModal item={activeMobileItem} onClose={() => setActiveMobileItem(null)} onUpdateItem={updateItemFromMobile} />
        </div>
    );
}
