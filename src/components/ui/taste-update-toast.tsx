import React from "react";

interface TasteUpdateToastProps {
  type: "music" | "film";
  action: "like" | "dislike";
  onClose?: () => void;
}

export function TasteUpdateToast({ type, action, onClose }: TasteUpdateToastProps) {
  // Define colors based on action
  const bgColor = action === "like" ? "bg-green-700/90" : "bg-red-700/90";
  const accentColor = action === "like" ? "bg-green-400" : "bg-red-400";
  const icon =
    action === "like" ? (
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4.5 12.75l6 6 9-13.5"
        />
      </svg>
    ) : (
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );

  return (
    <div
      className={`${bgColor} rounded-lg p-4 shadow-lg max-w-md w-full backdrop-blur-lg relative overflow-hidden`}
      role="alert"
    >
      {/* Animating accent line */}
      <div className={`absolute top-0 left-0 h-1 ${accentColor} animate-pulse w-full`}></div>

      <div className="flex items-start">
        <div
          className={`${action === "like" ? "bg-green-500" : "bg-red-500"} rounded-full p-2 mr-3 flex-shrink-0`}
        >
          {icon}
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-white">
            {action === "like" ? "Added to your likes" : "Noted your dislike"}
          </h3>
          <p className="text-sm text-white/80 mt-1">
            Your {type} taste profile is being updated based on this feedback
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white ml-4"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar animation */}
      <div className="mt-3 bg-black/20 h-1 rounded-full overflow-hidden">
        <div className="bg-white h-full rounded-full w-0 animate-taste-update"></div>
      </div>
    </div>
  );
}

// Add this to your global CSS or tailwind config
// @keyframes taste-update {
//   0% { width: 0; }
//   100% { width: 100%; }
// }
//
// .animate-taste-update {
//   animation: taste-update 2s ease-in-out forwards;
// }
