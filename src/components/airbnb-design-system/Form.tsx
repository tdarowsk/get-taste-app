import React from "react";
import { cn } from "@/lib/utils";

// Główny komponent Form
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /**
   * Zawartość formularza
   */
  children: React.ReactNode;
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <form ref={ref} className={cn("space-y-6", className)} {...props}>
        {children}
      </form>
    );
  }
);

Form.displayName = "Form";

// Grupa formularza
interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość grupy formularza
   */
  children: React.ReactNode;
}

export const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {children}
      </div>
    );
  }
);

FormGroup.displayName = "FormGroup";

// Etykieta pola formularza
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Tekst etykiety
   */
  children: React.ReactNode;

  /**
   * Czy pole jest wymagane
   */
  required?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("block text-sm font-medium text-gray-700 mb-1", className)}
        {...props}
      >
        {children}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
    );
  }
);

FormLabel.displayName = "FormLabel";

// Tekst pomocniczy dla pola formularza
interface FormHelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /**
   * Tekst pomocniczy
   */
  children: React.ReactNode;
}

export const FormHelperText = React.forwardRef<HTMLParagraphElement, FormHelperTextProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn("mt-1.5 text-sm text-gray-500", className)} {...props}>
        {children}
      </p>
    );
  }
);

FormHelperText.displayName = "FormHelperText";

// Komunikat błędu dla pola formularza
interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /**
   * Komunikat błędu
   */
  children: React.ReactNode;
}

export const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn("mt-1.5 text-sm text-red-500", className)} role="alert" {...props}>
        {children}
      </p>
    );
  }
);

FormError.displayName = "FormError";

// Pojedyncze pole formularza
interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość pola
   */
  children: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        {children}
      </div>
    );
  }
);

FormField.displayName = "FormField";

// Linia pozioma rozdzielająca sekcje formularza
interface FormDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Etykieta nad linią
   */
  label?: string;
}

export const FormDivider = React.forwardRef<HTMLDivElement, FormDividerProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative my-8", className)} {...props}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        {label && (
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm text-gray-500">{label}</span>
          </div>
        )}
      </div>
    );
  }
);

FormDivider.displayName = "FormDivider";

// Przycisk Submit formularza
interface FormSubmitProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Tekst przycisku
   */
  children: React.ReactNode;

  /**
   * Czy przycisk pokazuje stan ładowania
   */
  isLoading?: boolean;
}

export const FormSubmit = React.forwardRef<HTMLButtonElement, FormSubmitProps>(
  ({ className, children, isLoading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="submit"
        disabled={isLoading || disabled}
        className={cn(
          "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Przetwarzanie...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

FormSubmit.displayName = "FormSubmit";

// Komponent indykatora postępu w formularzu wieloetapowym
interface FormProgressProps {
  /**
   * Aktualny krok
   */
  currentStep: number;

  /**
   * Całkowita liczba kroków
   */
  totalSteps: number;

  /**
   * Etykiety kroków (opcjonalnie)
   */
  stepLabels?: string[];
}

export const FormProgress: React.FC<FormProgressProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index + 1 < currentStep;
          const isCurrent = index + 1 === currentStep;
          const isUpcoming = index + 1 > currentStep;

          return (
            <React.Fragment key={index}>
              {/* Krok */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                    isCompleted && "bg-rose-500 text-white",
                    isCurrent &&
                      "border-2 border-rose-500 bg-white text-rose-500 ring-2 ring-rose-500/20",
                    isUpcoming && "border border-gray-300 bg-white text-gray-400"
                  )}
                >
                  {isCompleted ? (
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
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Etykieta kroku */}
                {stepLabels && (
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      isCompleted && "text-gray-900",
                      isCurrent && "text-rose-500",
                      isUpcoming && "text-gray-400"
                    )}
                  >
                    {stepLabels[index]}
                  </span>
                )}
              </div>

              {/* Linia łącząca kroki */}
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-full max-w-[80px] flex-1",
                    index + 1 < currentStep ? "bg-rose-500" : "bg-gray-200"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export type {
  FormProps,
  FormGroupProps,
  FormLabelProps,
  FormHelperTextProps,
  FormErrorProps,
  FormFieldProps,
  FormDividerProps,
  FormSubmitProps,
  FormProgressProps,
};
