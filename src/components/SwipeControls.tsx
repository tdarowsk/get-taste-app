import React from "react";

interface SwipeControlsProps {
  onLike: () => void;
  onDislike: () => void;
  disabled?: boolean;
}

export function SwipeControls({ onLike, onDislike, disabled = false }: SwipeControlsProps) {
  return (
    <div className="flex justify-center space-x-4 mt-4">
      <button
        onClick={onDislike}
        disabled={disabled}
        className="p-3 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-transform active:scale-95"
        aria-label="Nie lubię"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <button
        onClick={onLike}
        disabled={disabled}
        className="p-3 rounded-full bg-success text-success-foreground hover:bg-success/90 disabled:opacity-50 transition-transform active:scale-95"
        aria-label="Lubię"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  );
}
