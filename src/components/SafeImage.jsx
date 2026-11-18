import { useState, useRef, useEffect } from "react";

export default function SafeImage({
    src,
    alt = "",
    className = "",
    containerClassName = "",
    fallbackSrc,
    loading = "lazy",
    fetchPriority = "auto",
    style,
    ...props
}) {
    const [loaded, setLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    // Auto-detect cached image on initial mount or src change
    useEffect(() => {
        if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
            setLoaded(true);
        }
    }, [src]);

    const handleError = (e) => {
        if (!hasError && fallbackSrc) {
            setHasError(true);
            e.currentTarget.src = fallbackSrc;
        } else {
            setHasError(true);
            setLoaded(true); // Release skeleton if no further fallback
        }
    };

    // Extract border-radius from className to sync skeleton clipping cleanly
    const roundedMatch = className.match(/\brounded(?:-[^\s]+)?\b/);
    const roundedClass = roundedMatch ? roundedMatch[0] : "";

    const transitionStyle = {
        transition: "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
    };

    return (
        <div
            className={`relative overflow-hidden ${roundedClass} ${
                containerClassName || "w-full h-full"
            }`}
        >
            <div
                data-testid="safe-image-skeleton"
                className={`absolute inset-0 bg-slate-200/80 animate-pulse pointer-events-none z-10 transition-opacity duration-300 ease-out ${
                    loaded ? "opacity-0" : "opacity-100"
                }`}
                style={{ transition: "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                loading={loading}
                decoding="async"
                fetchPriority={fetchPriority}
                onLoad={() => setLoaded(true)}
                onError={handleError}
                className={`transition-opacity duration-300 ease-out ${
                    loaded ? "opacity-100" : "opacity-0"
                } ${className}`}
                style={transitionStyle}
                {...props}
            />
        </div>
    );
}
