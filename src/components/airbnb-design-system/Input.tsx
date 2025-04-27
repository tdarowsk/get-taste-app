import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Etykieta pola wprowadzania
   */
  label?: string;

  /**
   * Komunikat o błędzie
   */
  error?: string;

  /**
   * Pomocniczy tekst pod polem
   */
  helperText?: string;

  /**
   * Ikona wyświetlana po lewej stronie pola
   */
  startIcon?: React.ReactNode;

  /**
   * Ikona wyświetlana po prawej stronie pola
   */
  endIcon?: React.ReactNode;

  /**
   * ID pola (generowane automatycznie jeśli nie podane)
   */
  id?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, startIcon, endIcon, id: providedId, disabled, required, ...props }, ref) => {
    // Generujemy unikalne ID dla pola, jeśli nie zostało podane
    const id = providedId || `input-${React.useId()}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className={cn("block text-sm font-medium mb-1.5", error ? "text-red-500" : "text-gray-700")}
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            required={required}
            className={cn(
              "w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition-colors",
              "placeholder:text-gray-400",
              "focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10",
              "disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
              startIcon && "pl-10",
              endIcon && "pr-10",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-description` : undefined}
            {...props}
          />

          {endIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              {endIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className="mt-1.5 text-sm">
            {error ? (
              <p id={`${id}-error`} className="text-red-500">
                {error}
              </p>
            ) : helperText ? (
              <p id={`${id}-description`} className="text-gray-500">
                {helperText}
              </p>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
