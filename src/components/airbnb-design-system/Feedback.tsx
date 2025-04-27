import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Alert - statyczny komunikat
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Treść alertu
   */
  children: React.ReactNode;

  /**
   * Typ alertu
   * @default "info"
   */
  type?: "info" | "success" | "warning" | "error";

  /**
   * Tytuł alertu (opcjonalny)
   */
  title?: string;

  /**
   * Ikona alertu (opcjonalnie)
   */
  icon?: React.ReactNode;

  /**
   * Funkcja zamykająca alert
   */
  onClose?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, children, type = "info", title, icon, onClose, ...props }, ref) => {
    // Style dla różnych typów alertów
    const typeStyles = {
      info: "bg-blue-50 border-blue-100 text-blue-800",
      success: "bg-green-50 border-green-100 text-green-800",
      warning: "bg-yellow-50 border-yellow-100 text-yellow-800",
      error: "bg-red-50 border-red-100 text-red-800",
    };

    // Style dla ikon różnych typów alertów
    const iconColors = {
      info: "text-blue-500",
      success: "text-green-500",
      warning: "text-yellow-500",
      error: "text-red-500",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-lg border p-4", typeStyles[type], className)}
        role={type === "error" ? "alert" : "status"}
        {...props}
      >
        <div className="flex items-start">
          {icon && <div className={cn("flex-shrink-0 mr-3", iconColors[type])}>{icon}</div>}

          <div className="flex-1 pt-0.5">
            {title && <h3 className="font-medium mb-1">{title}</h3>}
            <div className="text-sm">{children}</div>
          </div>

          {onClose && (
            <button
              type="button"
              className={cn(
                "flex-shrink-0 ml-3 p-1.5 rounded-md transition-colors",
                `hover:bg-${type === "info" ? "blue" : type === "success" ? "green" : type === "warning" ? "yellow" : "red"}-100`
              )}
              onClick={onClose}
              aria-label="Zamknij"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = "Alert";

// Toast - tymczasowe powiadomienie
interface ToastProps {
  /**
   * Treść wiadomości
   */
  message: string;

  /**
   * Typ powiadomienia
   * @default "info"
   */
  type?: "info" | "success" | "warning" | "error";

  /**
   * Czy toast jest widoczny
   * @default false
   */
  isVisible: boolean;

  /**
   * Funkcja zamykająca toast
   */
  onClose: () => void;

  /**
   * Czas wyświetlania (w ms)
   * @default 3000
   */
  duration?: number;

  /**
   * Pozycja toastu
   * @default "bottom-center"
   */
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  isVisible,
  onClose,
  duration = 3000,
  position = "bottom-center",
}) => {
  const [isMounted, setIsMounted] = useState(false);

  // Ikonki dla różnych typów toastów
  const icons = {
    info: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="8"></line>
      </svg>
    ),
    success: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
    warning: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12" y2="17"></line>
      </svg>
    ),
    error: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    ),
  };

  // Style dla różnych typów toastów
  const typeStyles = {
    info: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    error: "bg-red-600",
  };

  // Style dla różnych pozycji toastów
  const positionStyles = {
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
  };

  // Auto-zamknięcie po upływie czasu
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  // Hook do obsługi portalu
  useEffect(() => {
    setIsMounted(true);

    return () => setIsMounted(false);
  }, []);

  // Nie renderuj nic, gdy komponent nie jest zamontowany lub toast nie jest widoczny
  if (!isMounted || !isVisible) return null;

  const toastContent = (
    <div
      className={cn(
        "fixed z-50 max-w-sm transform transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        positionStyles[position]
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn("flex items-center shadow-lg rounded-lg text-white pr-2 pl-3 py-2", typeStyles[type])}>
        <div className="flex-shrink-0 mr-2">{icons[type]}</div>
        <div className="flex-1 mr-2 text-sm py-1">{message}</div>
        <button
          type="button"
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          onClick={onClose}
          aria-label="Zamknij"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
};

// Spinner - wskaźnik ładowania
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Rozmiar spinnera
   * @default "medium"
   */
  size?: "small" | "medium" | "large";

  /**
   * Kolor spinnera
   * @default "primary"
   */
  color?: "primary" | "white" | "gray";

  /**
   * Tekst ładowania
   */
  label?: string;
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "medium", color = "primary", label, ...props }, ref) => {
    // Style dla różnych rozmiarów
    const sizeStyles = {
      small: "h-4 w-4",
      medium: "h-8 w-8",
      large: "h-12 w-12",
    };

    // Style dla różnych kolorów
    const colorStyles = {
      primary: "text-rose-500",
      white: "text-white",
      gray: "text-gray-400",
    };

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center", className)}
        role="status"
        aria-busy="true"
        aria-live="polite"
        {...props}
      >
        <svg
          className={cn("animate-spin", sizeStyles[size], colorStyles[color])}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>

        {label && <span className="mt-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>}

        <span className="sr-only">Ładowanie</span>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";

// Badge - etykiety statusów
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Zawartość odznaki
   */
  children: React.ReactNode;

  /**
   * Wariant odznaki
   * @default "default"
   */
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, children, variant = "default", ...props }, ref) => {
    // Style dla różnych wariantów
    const variantStyles = {
      default: "bg-gray-100 text-gray-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      info: "bg-blue-100 text-blue-800",
      outline: "bg-transparent border border-gray-300 text-gray-700",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export type { AlertProps, ToastProps, SpinnerProps, BadgeProps };
