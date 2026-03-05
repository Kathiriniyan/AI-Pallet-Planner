import React from 'react';

export default function ImageModal({ imgUrl, onClose }) {
    if (!imgUrl) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4" onClick={onClose}>
            <img src={imgUrl} className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain" alt="Item Preview" />
        </div>
    );
}
