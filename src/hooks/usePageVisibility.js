import { useState, useEffect } from "react";

/**
 * Custom hook to track page visibility without triggering unnecessary re-renders
 * @returns {boolean} isVisible - Whether the page is currently visible
 */
export const usePageVisibility = () => {
    const [isVisible, setIsVisible] = useState(!document.hidden);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, []);

    return isVisible;
};

/**
 * Custom hook to prevent data refetching on page visibility changes
 * @param {Function} callback - Function to call when page becomes visible
 * @param {Array} dependencies - Dependencies array
 * @param {boolean} preventRefetch - Whether to prevent refetching on visibility change
 */
export const useStableEffect = (
    callback,
    dependencies,
    preventRefetch = true
) => {
    useEffect(() => {
        callback();
    }, dependencies);

    // Optionally prevent refetching when page becomes visible
    if (!preventRefetch) {
        const isVisible = usePageVisibility();

        useEffect(() => {
            if (isVisible) {
                callback();
            }
        }, [isVisible]);
    }
};
