import React from "react";
import type { FormEvent } from "react";
import { useState } from "react";

interface AuthFormProps {
  /**
   * Tytuł formularza wyświetlany jako nagłówek
   */
  title: string;
  /**
   * Callback wywołany po pomyślnym zatwierdzeniu formularza
   */
  onSubmit: (formData: Record<string, string>) => Promise<void>;
  /**
   * Elementy formularza - inputy, przyciski itp.
   */
  children: React.ReactNode;
  /**
   * Tekst wyświetlany na przycisku submit
   */
  submitText: string;
  /**
   * Opcjonalny element wyświetlany pod formularzem
   */
  footer?: React.ReactNode;
}

/**
 * Bazowy komponent formularza autentykacji wykorzystywany do logowania, rejestracji i resetowania hasła
 */
export const AuthForm: React.FC<AuthFormProps> = ({
  title,
  onSubmit,
  children,
  submitText,
  footer,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const formValues: Record<string, string> = {};

      formData.forEach((value, key) => {
        formValues[key] = value.toString();
      });

      await onSubmit(formValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg shadow-lg p-8 w-full max-w-md border border-white/10">
      <h1 className="text-3xl font-bold mb-8 text-center">{title}</h1>

      <form onSubmit={handleSubmit} className="space-y-7">
        {children}

        {error && <div className="text-red-500 py-2 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-md shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 text-lg mt-8 disabled:opacity-70"
        >
          {isLoading ? "Przetwarzanie..." : submitText}
        </button>
      </form>

      {footer && <div className="mt-8 text-center">{footer}</div>}
    </div>
  );
};

/**
 * Komponent wyświetlający komunikaty błędów dla formularzy autentykacji
 */
export const AuthErrorDisplay: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error) return null;

  return <div className="text-red-500 py-2 text-sm">{error}</div>;
};

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

/**
 * Komponent input dla formularzy autentykacji
 */
export const AuthInput: React.FC<AuthInputProps> = ({ label, hint, id, ...props }) => {
  // Zawsze wywołujemy hook, niezależnie od warunków
  const generatedId = React.useId();
  const inputId = id || `auth-input-${generatedId}`;

  return (
    <div>
      <label htmlFor={inputId} className="block mb-2 text-lg">
        {label}
      </label>
      <input
        id={inputId}
        className="w-full px-4 py-3 text-lg rounded-md bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
        {...props}
      />
      {hint && <p className="text-sm text-white/60 mt-1">{hint}</p>}
    </div>
  );
};
