import React from 'react';

export default function ToastStack({ toasts }) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`px-4 py-3 rounded-lg shadow-lg text-sm transition-all duration-300 transform translate-y-0 opacity-100 ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                        }`}
                >
                    {t.msg}
                </div>
            ))}
        </div>
    );
}
