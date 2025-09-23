import React from "react";

function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    confirmButtonClass,
}) {
    if (!open) return null;
    return (
        <>
            {/* Background overlay */}
            <div
                className="fixed inset-0 z-[9999] bg-black opacity-50"
                onClick={onClose}
            ></div>
            {/* Modal content */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <div className="flex justify-center gap-4">
                        <button
                            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition-colors"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            className={`px-4 py-2 rounded text-white font-medium transition-colors ${
                                confirmButtonClass ||
                                "bg-red-600 hover:bg-red-700"
                            }`}
                            onClick={onConfirm}
                        >
                            {confirmText || "Confirm"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ConfirmModal;
