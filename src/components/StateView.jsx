import React from "react";
import { Icon } from "@iconify/react";

/**
 * Unified StateView for Loading, Empty, and Error states
 * Replaces ad-hoc copy-pasted skeletons and empty messages
 */
export function StateView({
    type = "empty", // "loading" | "empty" | "error"
    title,
    description,
    actionLabel,
    onAction,
    icon,
    className = "",
}) {
    if (type === "loading") {
        return (
            <div
                role="status"
                aria-live="polite"
                className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
            >
                <div className="w-10 h-10 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-600">
                    {title || "Loading content…"}
                </p>
                <span className="sr-only">Loading…</span>
            </div>
        );
    }

    if (type === "error") {
        return (
            <div
                role="alert"
                className={`flex flex-col items-center justify-center py-16 px-4 text-center max-w-prose mx-auto ${className}`}
            >
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
                    <Icon
                        icon={icon || "mingcute:alert-circle-line"}
                        width="28"
                        height="28"
                    />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                    {title || "Something went wrong"}
                </h3>
                {description && (
                    <p className="text-sm text-slate-600 mb-4 max-w-sm">
                        {description}
                    </p>
                )}
                {onAction && (
                    <button
                        onClick={onAction}
                        className="min-h-[44px] min-w-[44px] px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    >
                        {actionLabel || "Try again"}
                    </button>
                )}
            </div>
        );
    }

    // Default: Empty state
    return (
        <div
            className={`flex flex-col items-center justify-center py-16 px-4 text-center max-w-prose mx-auto ${className}`}
        >
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Icon
                    icon={icon || "mingcute:inbox-line"}
                    width="28"
                    height="28"
                />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
                {title || "No items found"}
            </h3>
            {description && (
                <p className="text-sm text-slate-600 mb-4 max-w-sm">
                    {description}
                </p>
            )}
            {onAction && (
                <button
                    onClick={onAction}
                    className="min-h-[44px] min-w-[44px] px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                    {actionLabel || "Explore"}
                </button>
            )}
        </div>
    );
}

export default StateView;
