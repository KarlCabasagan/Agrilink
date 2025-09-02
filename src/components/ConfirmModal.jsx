import React from "react";

function ConfirmModal({ open, onClose, onConfirm, title, message }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
                <h3 className="text-xl font-bold text-text mb-2">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <button
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-light font-medium transition-colors"
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
