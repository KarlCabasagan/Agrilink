import React from "react";
import { Icon } from "@iconify/react";

function Modal({
    open,
    onClose,
    onConfirm,
    title,
    message,
    type = "info", // "info", "success", "warning", "error", "confirm"
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
    icon,
}) {
    if (!open) return null;

    // Define styles based on type
    const getTypeStyles = () => {
        switch (type) {
            case "success":
                return {
                    iconColor: "text-primary",
                    titleColor: "text-gray-900",
                    buttonColor: "bg-primary hover:bg-primary-dark",
                    defaultIcon: "mingcute:check-circle-fill",
                    bgAccent: "bg-green-50",
                };
            case "warning":
                return {
                    iconColor: "text-orange-500",
                    titleColor: "text-gray-900",
                    buttonColor: "bg-primary hover:bg-primary-dark",
                    defaultIcon: "mingcute:alert-triangle-fill",
                    bgAccent: "bg-orange-50",
                };
            case "error":
                return {
                    iconColor: "text-red-500",
                    titleColor: "text-gray-900",
                    buttonColor: "bg-primary hover:bg-primary-dark",
                    defaultIcon: "mingcute:close-circle-fill",
                    bgAccent: "bg-red-50",
                };
            case "confirm":
                return {
                    iconColor: "text-primary",
                    titleColor: "text-gray-900",
                    buttonColor: "bg-primary hover:bg-primary-dark",
                    defaultIcon: "mingcute:question-line",
                    bgAccent: "bg-blue-50",
                };
            default: // info
                return {
                    iconColor: "text-primary",
                    titleColor: "text-gray-900",
                    buttonColor: "bg-primary hover:bg-primary-dark",
                    defaultIcon: "mingcute:information-fill",
                    bgAccent: "bg-blue-50",
                };
        }
    };

    const styles = getTypeStyles();
    const displayIcon = icon || styles.defaultIcon;

    return (
        <>
            {/* Background overlay */}
            <div
                className="fixed inset-0 z-[9999] bg-black opacity-40 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            {/* Modal content */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-gray-100">
                    {/* Icon with background */}
                    {displayIcon && (
                        <div className="mb-6">
                            <div
                                className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${styles.bgAccent} mb-2`}
                            >
                                <Icon
                                    icon={displayIcon}
                                    width="32"
                                    height="32"
                                    className={`${styles.iconColor}`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <h3
                        className={`text-2xl font-bold mb-3 ${styles.titleColor}`}
                    >
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-600 mb-8 leading-relaxed text-base">
                        {message}
                    </p>

                    {/* Buttons */}
                    <div className="flex justify-center gap-3">
                        {showCancel && (
                            <button
                                className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-all duration-200 border border-gray-200"
                                onClick={onClose}
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            className={`px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${styles.buttonColor}`}
                            onClick={onConfirm || onClose}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Modal;
