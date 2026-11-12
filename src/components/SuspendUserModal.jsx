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
            confirmButtonClass="bg-rose-600 hover:bg-rose-700 text-white"
            showCancel={true}
            cancelText="Cancel"
        >
            <div className="text-left mt-2">
                <p className="text-xs text-slate-600 mb-3 leading-relaxed max-w-prose">
                    Are you sure you want to suspend{" "}
                    <span className="font-semibold text-slate-900">{userName}</span>
                    's account? This will immediately prevent them from accessing the platform.
                </p>
                <label
                    htmlFor="suspensionReason"
                    className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                    Suspension Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                    id="suspensionReason"
                    rows={3}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600 transition-all ${
                        error
                            ? "border-rose-400 bg-rose-50/30"
                            : "border-slate-300 bg-slate-50/50 focus:bg-white"
                    }`}
                    placeholder="Provide detailed reason for suspension…"
                    value={reason}
                    onChange={(e) => {
                        setReason(e.target.value);
                        if (error) setError("");
                    }}
                />
                {error && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                        {error}
                    </p>
                )}
            </div>
        </Modal>
    );
};

export default SuspendUserModal;
