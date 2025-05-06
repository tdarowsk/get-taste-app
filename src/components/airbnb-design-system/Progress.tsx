import React from "react";
import { cn } from "@/lib/utils";

// Progress - wskaźnik postępu
interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /**
   * Wartość postępu (0-100)
   */
  value: number;

  /**
   * Maksymalna wartość
   * @default 100
   */
  max?: number;

  /**
   * Rozmiar paska postępu
   * @default "medium"
   */
  size?: "small" | "medium" | "large";

  /**
   * Kolor paska postępu
   * @default "primary"
   */
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";

  /**
   * Wariant paska postępu
   * @default "default"
   */
  variant?: "default" | "determinate" | "indeterminate";

  /**
   * Etykieta dostępności
   */
  label?: string;

  /**
   * Wyświetl wartość procentową
   * @default false
   */
  showValue?: boolean;

  /**
   * Kształt paska postępu
   * @default "rounded"
   */
  shape?: "rounded" | "flat" | "pill";
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = "medium",
      color = "primary",
      variant = "default",
      label,
      showValue = false,
      shape = "rounded",
      ...props
    },
    ref
  ) => {
    // Obliczenie procentu ukończenia
    const percent = Math.min(100, Math.max(0, (value / max) * 100));

    // Style dla różnych rozmiarów
    const sizeStyles = {
      small: "h-1",
      medium: "h-2",
      large: "h-3",
    };

    // Style dla różnych kolorów
    const colorStyles = {
      primary: "bg-rose-500",
      secondary: "bg-indigo-500",
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
      info: "bg-blue-500",
    };

    // Style dla różnych kształtów
    const shapeStyles = {
      rounded: "rounded",
      flat: "",
      pill: "rounded-full",
    };

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-1">
            {label && <div className="text-sm font-medium text-gray-700">{label}</div>}
            {showValue && (
              <div className="text-sm font-medium text-gray-500">{Math.round(percent)}%</div>
            )}
          </div>
        )}

        <div
          className={cn("w-full bg-gray-200 overflow-hidden", sizeStyles[size], shapeStyles[shape])}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        >
          <div
            className={cn(
              colorStyles[color],
              variant === "indeterminate"
                ? "animate-progress"
                : "transition-all duration-300 ease-in-out",
              shapeStyles[shape]
            )}
            style={{ width: variant === "indeterminate" ? "100%" : `${percent}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

// CircularProgress - okrągły wskaźnik postępu
interface CircularProgressProps extends Omit<React.SVGAttributes<SVGSVGElement>, "color"> {
  /**
   * Wartość postępu (0-100)
   */
  value: number;

  /**
   * Rozmiar wskaźnika w pikselach
   * @default 40
   */
  size?: number;

  /**
   * Grubość obwódki
   * @default 4
   */
  thickness?: number;

  /**
   * Kolor wskaźnika
   * @default "primary"
   */
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";

  /**
   * Wariant wskaźnika
   * @default "determinate"
   */
  variant?: "determinate" | "indeterminate";

  /**
   * Etykieta dostępności
   */
  label?: string;

  /**
   * Wyświetl wartość procentową w środku
   * @default false
   */
  showValue?: boolean;
}

export const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  (
    {
      className,
      value = 0,
      size = 40,
      thickness = 4,
      color = "primary",
      variant = "determinate",
      label,
      showValue = false,
      ...props
    },
    ref
  ) => {
    // Obliczenie wartości SVG
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min(100, Math.max(0, value));
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    // Style dla różnych kolorów
    const colorStyles = {
      primary: "stroke-rose-500",
      secondary: "stroke-indigo-500",
      success: "stroke-green-500",
      error: "stroke-red-500",
      warning: "stroke-yellow-500",
      info: "stroke-blue-500",
    };

    return (
      <div className="relative inline-flex">
        <svg
          ref={ref}
          className={cn(variant === "indeterminate" ? "animate-spin" : "", className)}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="progressbar"
          aria-valuenow={variant === "determinate" ? percent : undefined}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          {...props}
        >
          {/* Tło */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-gray-200"
            strokeWidth={thickness}
            fill="none"
          />

          {/* Postęp */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={colorStyles[color]}
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={variant === "determinate" ? strokeDashoffset : circumference * 0.25}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={variant === "indeterminate" ? {} : { transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>

        {showValue && variant === "determinate" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">{Math.round(percent)}%</span>
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = "CircularProgress";

// Linear buffer - wskaźnik postępu z buforem
interface LinearBufferProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  /**
   * Wartość postępu (0-100)
   */
  value: number;

  /**
   * Wartość bufora (0-100)
   */
  buffer: number;

  /**
   * Rozmiar paska postępu
   * @default "medium"
   */
  size?: "small" | "medium" | "large";

  /**
   * Kolor paska postępu
   * @default "primary"
   */
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";

  /**
   * Etykieta dostępności
   */
  label?: string;

  /**
   * Kształt paska postępu
   * @default "rounded"
   */
  shape?: "rounded" | "flat" | "pill";
}

export const LinearBuffer = React.forwardRef<HTMLDivElement, LinearBufferProps>(
  (
    {
      className,
      value = 0,
      buffer = 0,
      size = "medium",
      color = "primary",
      label,
      shape = "rounded",
      ...props
    },
    ref
  ) => {
    // Obliczenie procentu ukończenia
    const percent = Math.min(100, Math.max(0, value));
    const bufferPercent = Math.min(100, Math.max(percent, buffer));

    // Style dla różnych rozmiarów
    const sizeStyles = {
      small: "h-1",
      medium: "h-2",
      large: "h-3",
    };

    // Style dla różnych kolorów
    const colorStyles = {
      primary: "bg-rose-500",
      secondary: "bg-indigo-500",
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
      info: "bg-blue-500",
    };

    // Style bufora
    const bufferStyles = {
      primary: "bg-rose-200",
      secondary: "bg-indigo-200",
      success: "bg-green-200",
      error: "bg-red-200",
      warning: "bg-yellow-200",
      info: "bg-blue-200",
    };

    // Style dla różnych kształtów
    const shapeStyles = {
      rounded: "rounded",
      flat: "",
      pill: "rounded-full",
    };

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        <div
          className={cn(
            "w-full bg-gray-100 overflow-hidden relative",
            sizeStyles[size],
            shapeStyles[shape]
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          {/* Bufor */}
          <div
            className={cn(
              "absolute top-0 left-0 h-full transition-all duration-300 ease-in-out",
              bufferStyles[color],
              shapeStyles[shape]
            )}
            style={{ width: `${bufferPercent}%` }}
          />

          {/* Główny pasek postępu */}
          <div
            className={cn(
              "absolute top-0 left-0 h-full transition-all duration-300 ease-in-out",
              colorStyles[color],
              shapeStyles[shape]
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }
);

LinearBuffer.displayName = "LinearBuffer";

// Eksport typów
export type { ProgressProps, CircularProgressProps, LinearBufferProps };
