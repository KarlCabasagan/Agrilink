import React, { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

function Modal({
    open,
    onClose,
    onConfirm,
    title,
    message,
    type = "info", // "info" | "success" | "warning" | "error" | "confirm"
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
    icon,
    confirmButtonClass,
    children,
}) {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const getTypeStyles = () => {
        switch (type) {
            case "success":
                return {
                    iconColor: "text-emerald-700",
                    buttonColor: "bg-emerald-700 hover:bg-emerald-800 text-white focus-visible:ring-emerald-700",
                    defaultIcon: "mingcute:check-circle-fill",
                    bgAccent: "bg-emerald-50",
                };
            case "warning":
                return {
                    iconColor: "text-amber-700",
                    buttonColor: "bg-amber-700 hover:bg-amber-800 text-white focus-visible:ring-amber-700",
                    defaultIcon: "mingcute:alert-triangle-fill",
                    bgAccent: "bg-amber-50",
                };
            case "error":
                return {
                    iconColor: "text-red-700",
                    buttonColor: "bg-red-700 hover:bg-red-800 text-white focus-visible:ring-red-700",
                    defaultIcon: "mingcute:close-circle-fill",
                    bgAccent: "bg-red-50",
                };
            case "confirm":
                return {
                    iconColor: "text-emerald-700",
                    buttonColor: "bg-emerald-700 hover:bg-emerald-800 text-white focus-visible:ring-emerald-700",
                    defaultIcon: "mingcute:question-line",
                    bgAccent: "bg-emerald-50",
                };
            default: // info
                return {
                    iconColor: "text-sky-700",
                    buttonColor: "bg-sky-700 hover:bg-sky-800 text-white focus-visible:ring-sky-700",
                    defaultIcon: "mingcute:information-fill",
                    bgAccent: "bg-sky-50",
                };
        }
    };

    const styles = getTypeStyles();
    const displayIcon = icon || styles.defaultIcon;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop: 150ms opacity transition */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-150 ease-out"
                onClick={onClose}
            />

            {/* Modal Card: Emil Kowalski rules:
                - Never scale from 0; start from scale(0.96)
                - GPU transform + opacity only
                - 180ms snappy ease-out
                - Origin top center/center
            */}
            <div
                ref={dialogRef}
                className="relative bg-white rounded-2xl shadow-[0_20px_25px_-5px_rgba(15,23,42,0.1),0_8px_10px_-6px_rgba(15,23,42,0.06)] p-6 sm:p-8 w-full max-w-md text-center border border-slate-200/90 z-10 origin-center transition-all duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:animate-[modal-in_180ms_cubic-bezier(0.16,1,0.3,1)]"
            >
                {displayIcon && (
                    <div className="mb-4">
                        <div
                            className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${styles.bgAccent}`}
                        >
                            <Icon
                                icon={displayIcon}
                                width="30"
                                height="30"
                                className={styles.iconColor}
                            />
                        </div>
                    </div>
                )}

                {title && (
                    <h3
                        id="modal-title"
                        className="text-xl font-bold text-slate-900 mb-2 tracking-tight"
                    >
                        {title}
                    </h3>
                )}

                {message && (
                    <p className="text-slate-600 mb-6 leading-relaxed text-sm max-w-[65ch] mx-auto">
                        {message}
                    </p>
                )}

                {children}

                {/* Actions: Minimum 44x44px touch targets */}
                <div className="flex justify-center items-center gap-3 mt-6">
                    {showCancel && (
                        <button
                            type="button"
                            className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all duration-150 border border-slate-300/80 focus-visible:ring-2 focus-visible:ring-slate-400 focus:outline-none cursor-pointer active:scale-[0.98]"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        className={`min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 shadow-xs focus-visible:ring-2 focus:outline-none cursor-pointer active:scale-[0.98] ${confirmButtonClass || styles.buttonColor}`}
                        onClick={onConfirm || onClose}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Modal;
