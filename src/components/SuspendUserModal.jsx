import React, { useState } from "react";
import Modal from "./Modal.jsx";

const SuspendUserModal = ({ isOpen, onClose, onConfirm, userName }) => {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError("Please provide a suspension reason");
            return;
        }
        setIsSubmitting(true);
        onConfirm(reason);
    };

    if (!isOpen) return null;

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            onConfirm={handleSubmit}
            title="Suspend User Account"
            type="error"
            confirmText={isSubmitting ? "Suspending…" : "Suspend User"}
            showCancel={true}
            cancelText="Cancel"
        >
            <div className="text-left mt-2">
                <p className="text-sm text-slate-600 mb-3">
                    Are you sure you want to suspend{" "}
                    <span className="font-semibold text-slate-900">{userName}</span>
                    's account? This will immediately prevent them from accessing the platform.
                </p>
                <label
                    htmlFor="suspensionReason"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                    Suspension Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="suspensionReason"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 ${
                        error ? "border-red-400 bg-red-50/20" : "border-slate-300"
                    }`}
                    placeholder="Provide detailed reason for suspension…"
                    value={reason}
                    onChange={(e) => {
                        setReason(e.target.value);
                        if (error) setError("");
                    }}
                />
                {error && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                        {error}
                    </p>
                )}
            </div>
        </Modal>
    );
};

export default SuspendUserModal;
