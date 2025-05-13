import { useState, createContext, useContext } from "react";
import type { ReactNode } from "react";

export type ToastVariant = "default" | "destructive" | "success";

/* eslint-disable react/prop-types */
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
  toasts: ToastProps[];
  clearToast: (index: number) => void;
}

// Create context with meaningful initial values that do nothing to satisfy linter
const ToastContext = createContext<ToastContextType>({
  toast: () => {
    // This is just a placeholder that will be overridden by the provider
  },
  toasts: [],
  clearToast: () => {
    // This is just a placeholder that will be overridden by the provider
  },
});

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => {
    const newToast = {
      ...props,
      variant: props.variant || "default",
      duration: props.duration || 3000,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Auto-dismiss toast after duration
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t !== newToast));
    }, newToast.duration);
  };

  const clearToast = (index: number) => {
    setToasts((prevToasts) => prevToasts.filter((_, i) => i !== index));
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, clearToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const ToastContainer = () => {
  const { toasts, clearToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast, i) => (
        <Toast key={i} toast={toast} onClose={() => clearToast(i)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }: { toast: ToastProps; onClose: () => void }) => {
  const { title, description, variant = "default" } = toast;

  const bgColors = {
    default: "bg-white/80 dark:bg-gray-800/80",
    success: "bg-green-700/90",
    destructive: "bg-red-700/90",
  };

  const textColors = {
    default: "text-gray-900 dark:text-white",
    success: "text-white",
    destructive: "text-white",
  };

  return (
    <div
      className={`${bgColors[variant]} backdrop-blur-lg rounded-lg p-4 shadow-lg w-full animate-in slide-in-from-right-5 relative overflow-hidden`}
      role="alert"
    >
      {/* Accent Line */}
      <div
        className={`absolute top-0 left-0 h-1 w-full
          ${variant === "default" ? "bg-primary" : variant === "success" ? "bg-green-400" : "bg-red-400"} 
          animate-pulse
        `}
      ></div>

      <div className="flex items-start justify-between">
        <div>
          {title && <h3 className={`font-medium ${textColors[variant]}`}>{title}</h3>}
          {description && (
            <p className={`text-sm mt-1 ${textColors[variant]} opacity-80`}>{description}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className={`${textColors[variant]} opacity-60 hover:opacity-100 ml-4`}
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
      </div>

      {/* Progress Bar (auto-dismissing indicator) */}
      <div className="mt-3 bg-black/20 h-1 rounded-full overflow-hidden">
        <div className="bg-white h-full rounded-full w-0 animate-taste-update"></div>
      </div>
    </div>
  );
};
