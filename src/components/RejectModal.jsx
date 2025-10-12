import React, { useState } from "react";
import { Icon } from "@iconify/react";

const RejectModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError("Please provide a rejection reason");
            return;
        }
        setIsSubmitting(true);
        onConfirm(reason);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black opacity-50 flex items-center justify-center z-[9990] px-4"></div>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full z-[9999] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                                <Icon
                                    icon="mingcute:close-circle-line"
                                    className="w-6 h-6 text-red-600"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="rejectionReason"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Rejection Reason *
                        </label>
                        <textarea
                            id="rejectionReason"
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                                error ? "border-red-300" : "border-gray-300"
                            }`}
                            placeholder="Please provide a reason for rejecting this application..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError("");
                            }}
                        />
                        {error && (
                            <p className="mt-1 text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Icon
                                        icon="mingcute:loading-line"
                                        className="animate-spin mr-2"
                                    />
                                    Rejecting...
                                </>
                            ) : (
                                "Reject Application"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RejectModal;
