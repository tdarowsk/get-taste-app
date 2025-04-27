import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Wariant przycisku
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "tertiary" | "text" | "icon";

  /**
   * Rozmiar przycisku
   * @default "medium"
   */
  size?: "small" | "medium" | "large";

  /**
   * Czy przycisk wypełnia całą szerokość kontenera
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Ikona wyświetlana przed tekstem
   */
  startIcon?: React.ReactNode;

  /**
   * Ikona wyświetlana po tekście
   */
  endIcon?: React.ReactNode;

  /**
   * Zawartość przycisku
   */
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      fullWidth = false,
      className,
      startIcon,
      endIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary: "bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white shadow-sm",
      secondary: "bg-white border border-gray-300 hover:border-gray-400 active:bg-gray-50 text-gray-700 shadow-sm",
      tertiary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700",
      text: "bg-transparent hover:bg-gray-100 text-gray-700 shadow-none",
      icon: "bg-transparent hover:bg-gray-100 text-gray-700 shadow-none p-2 rounded-full",
    };

    const sizeStyles = {
      small: "text-sm px-3 py-1.5 gap-1.5",
      medium: "text-sm px-4 py-2 gap-2",
      large: "text-base px-5 py-2.5 gap-2",
    };

    // Dla wariantu icon rozmiary są inne
    const iconSizeStyles = {
      small: "p-1.5",
      medium: "p-2",
      large: "p-2.5",
    };

    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          baseStyles,
          variant === "icon" ? iconSizeStyles[size] : sizeStyles[size],
          variantStyles[variant],
          widthStyles,
          className
        )}
        {...props}
      >
        {startIcon && <span className="inline-flex shrink-0">{startIcon}</span>}
        {children && <span>{children}</span>}
        {endIcon && <span className="inline-flex shrink-0">{endIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
