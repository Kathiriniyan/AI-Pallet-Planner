import { MOCK_DOC, BOX_CATALOG, ITEM_IMAGES } from '../data/assets';

const sanitize = (s) => String(s || '').replace(/[\/\s]+/g, '_');

export function mapDocToUIList() {
    const seen = new Map();
    return MOCK_DOC.data.items.map((item, idx) => {
        const code = String(item.item_code || `ROW_${idx}`);
        const key = sanitize(code);
        const seenCount = seen.get(key) || 0;
        seen.set(key, seenCount + 1);
        const uid = `${key}__${seenCount}`;

        const catalogEntry = BOX_CATALOG[code] || {
            dimsCm: { L: 50, W: 40, H: 25 },
            fragility: 2,
            maxLoadTopKg: 15,
            allowRotate: "flat"
        };

        return {
            uid,
            item_code: code,
            item_name: item.item_name || code,
            country: item.country || "—",
            required_qty: parseFloat(item.qty || 0) || 0,
            weight_per_unit: parseFloat(item.weight_per_unit || 0) || 0,
            img: ITEM_IMAGES[code] || "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Vegetable_Market%2C_Pudupet%2C_Chennai.jpg/640px-Vegetable_Market%2C_Pudupet%2C_Chennai.jpg",
            dimsCm: catalogEntry.dimsCm,
            fragility: catalogEntry.fragility,
            maxLoadTopKg: catalogEntry.maxLoadTopKg,
            allowRotate: catalogEntry.allowRotate,
            // Status state placeholders
            picked: 0,
            additional: 0,
            confirmed: false,
            status: ""
        };
    });
}
