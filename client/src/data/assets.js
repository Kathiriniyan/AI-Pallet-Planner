export const MOCK_DOC = {
    success: true,
    message: "Fetched picking list",
    data: {
        id: "DN-00045",
        supplier: "Acme Foods BV",
        status: "Pending",
        transaction_date: "2025-09-20T00:00:00",
        total_qty: 69.0,
        total_net_weight: 445.0,
        items: [
            { item_code: "ITM-JACK-BOX", item_name: "Jackfruit Crate", country: "India", qty: 3, weight_per_unit: 10 },
            { item_code: "ITM-PUMP-BOX", item_name: "Pumpkin Box", country: "Sri Lanka", qty: 4, weight_per_unit: 12 },
            { item_code: "ITM-WAT-BOX", item_name: "Watermelon Box", country: "India", qty: 2, weight_per_unit: 15 },
            { item_code: "ITM-OKRA-BOX", item_name: "Okra (Lady's Finger) Box", country: "Sri Lanka", qty: 8, weight_per_unit: 4 },
            { item_code: "ITM-CUCU-BOX", item_name: "Cucumber Box", country: "India", qty: 6, weight_per_unit: 6 },
            { item_code: "ITM-APPL-BOX", item_name: "Apples Box", country: "Canada", qty: 5, weight_per_unit: 8 },
            { item_code: "ITM-BANA-BOX", item_name: "Banana Box", country: "India", qty: 6, weight_per_unit: 7 },
            { item_code: "ITM-TOM-BOX", item_name: "Tomato Box", country: "Jaffna", qty: 10, weight_per_unit: 5 },
            { item_code: "ITM-GRAP-BOX", item_name: "Grapes Box", country: "India", qty: 8, weight_per_unit: 4 },
            { item_code: "ITM-CURRY-BOX", item_name: "Curry Leaves Box", country: "Jaffna", qty: 6, weight_per_unit: 2 },
            { item_code: "ITM-DRUM-BOX", item_name: "Drumstick (Moringa) Box", country: "India", qty: 5, weight_per_unit: 5 },
            { item_code: "ITM-CHIL-BOX", item_name: "Green Chilli Box", country: "India", qty: 6, weight_per_unit: 3 }
        ]
    }
};

export const BOX_CATALOG = {
    "ITM-JACK-BOX": { "dimsCm": { "L": 60, "W": 40, "H": 35 }, "fragility": 3, "maxLoadTopKg": 25, "allowRotate": "flat" },
    "ITM-TOM-BOX": { "dimsCm": { "L": 40, "W": 30, "H": 20 }, "fragility": 1, "maxLoadTopKg": 8, "allowRotate": "flat" },
    "ITM-OKRA-BOX": { "dimsCm": { "L": 50, "W": 30, "H": 20 }, "fragility": 2, "maxLoadTopKg": 15, "allowRotate": "flat" },
    "ITM-CUCU-BOX": { "dimsCm": { "L": 50, "W": 35, "H": 20 }, "fragility": 2, "maxLoadTopKg": 15, "allowRotate": "flat" },
    "ITM-CURRY-BOX": { "dimsCm": { "L": 40, "W": 30, "H": 15 }, "fragility": 1, "maxLoadTopKg": 5, "allowRotate": "flat" },
    "ITM-GRAP-BOX": { "dimsCm": { "L": 40, "W": 30, "H": 15 }, "fragility": 1, "maxLoadTopKg": 5, "allowRotate": "flat" },
    "ITM-BANA-BOX": { "dimsCm": { "L": 60, "W": 40, "H": 25 }, "fragility": 2, "maxLoadTopKg": 20, "allowRotate": "flat" },
    "ITM-APPL-BOX": { "dimsCm": { "L": 50, "W": 40, "H": 25 }, "fragility": 2, "maxLoadTopKg": 20, "allowRotate": "flat" },
    "ITM-PUMP-BOX": { "dimsCm": { "L": 60, "W": 40, "H": 40 }, "fragility": 3, "maxLoadTopKg": 30, "allowRotate": "flat" },
    "ITM-WAT-BOX": { "dimsCm": { "L": 80, "W": 50, "H": 45 }, "fragility": 3, "maxLoadTopKg": 35, "allowRotate": "flat" },
    "ITM-DRUM-BOX": { "dimsCm": { "L": 60, "W": 30, "H": 20 }, "fragility": 2, "maxLoadTopKg": 15, "allowRotate": "flat" },
    "ITM-CHIL-BOX": { "dimsCm": { "L": 40, "W": 30, "H": 15 }, "fragility": 1, "maxLoadTopKg": 5, "allowRotate": "flat" }
};

export const ITEM_IMAGES = {
    "ITM-JACK-BOX": "https://www.veganfoodandliving.com/wp-content/uploads/2023/05/Jackfruit-768x509.jpg",
    "ITM-TOM-BOX": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/480px-Tomato_je.jpg",
    "ITM-OKRA-BOX": "https://5.imimg.com/data5/SELLER/Default/2021/1/JG/LP/FI/591899/lady-finger-1000x1000.jpg",
    "ITM-CUCU-BOX": "https://www.highmowingseeds.com/media/catalog/product/cache/95cbc1bb565f689da055dd93b41e1c28/2/4/2425-0.jpg",
    "ITM-CURRY-BOX": "https://estelletrading.com/wp-content/uploads/2024/08/Curry-Leaves.jpg",
    "ITM-GRAP-BOX": "https://www.seriouseats.com/thmb/RaM1yOMH5r4WcBlaY09kNol9omI=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1289843973-karandaev-hero-ca6df1eb21504ba0965e2319ef4c26e3.jpg",
    "ITM-BANA-BOX": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/480px-Banana-Single.jpg",
    "ITM-APPL-BOX": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/480px-Red_Apple.jpg",
    "ITM-PUMP-BOX": "https://upload.wikimedia.org/wikipedia/commons/5/5c/FrenchMarketPumpkinsB.jpg",
    "ITM-WAT-BOX": "https://egmontseeds.co.nz/cdn/shop/files/58965WatermelonPeace_Yellow.jpg?v=1721889637&width=1920",
    "ITM-DRUM-BOX": "https://m.media-amazon.com/images/I/61Dq32tHocL.jpg",
    "ITM-CHIL-BOX": "https://www.simhas.in/image/cache/catalog/products/green-chilli-2-500x500.jpg"
};
