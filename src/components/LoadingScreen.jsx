import React from "react";

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center">
        <div className="loader mb-4" />
        <span className="text-primary font-semibold text-lg">Loading...</span>
      </div>
      <style>{`
        .loader {
          border: 8px solid #e0e0e0;
          border-top: 8px solid var(--color-primary, #4F46E5);
          border-radius: 50%;
          width: 64px;
          height: 64px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
