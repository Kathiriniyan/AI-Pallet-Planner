import { useState, useEffect } from 'react';

export function useDraft(docId, initialItems) {
    const draftKey = `draft_${docId}`;
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(draftKey);
            if (raw) {
                const savedDraft = JSON.parse(raw);
                // Merge saved draft into initial items
                return initialItems.map(item => {
                    const idUS = String(item.uid).replace(/[\/\s]+/g, '_');
                    const picked = savedDraft[`picked_quantity_${idUS}`];
                    const additional = savedDraft[`additional_quantity_${idUS}`];
                    const status = savedDraft[`item_status_${idUS}`] || '';

                    let updatedPicked = item.picked;
                    let updatedAdditional = item.additional;

                    if (picked !== undefined) {
                        updatedPicked = Math.max(0, Math.min(parseFloat(picked), item.required_qty));
                    }
                    if (additional !== undefined) {
                        updatedAdditional = Math.max(0, parseFloat(additional));
                    }

                    return {
                        ...item,
                        picked: updatedPicked,
                        additional: updatedAdditional,
                        confirmed: updatedPicked > 0,
                        status: status
                    };
                });
            }
        } catch (e) {
            console.warn("Failed to load draft from localStorage", e);
        }
        return initialItems;
    });

    // Autosave when items change
    useEffect(() => {
        const timer = setTimeout(() => {
            const objToSave = {};
            items.forEach(it => {
                const idUS = String(it.uid).replace(/[\/\s]+/g, '_');
                objToSave[`picked_quantity_${idUS}`] = it.picked;
                objToSave[`additional_quantity_${idUS}`] = it.additional;
                objToSave[`total_quantity_${idUS}`] = (it.picked + it.additional).toFixed(2);
                objToSave[`item_status_${idUS}`] = it.status || '';
            });
            try {
                localStorage.setItem(draftKey, JSON.stringify(objToSave));
            } catch (e) {
                console.warn("Failed to save draft to localStorage", e);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [items, draftKey]);

    return [items, setItems];
}
