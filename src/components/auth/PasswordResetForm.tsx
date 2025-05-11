import React, { useState } from "react";
import { AuthForm, AuthInput } from "./AuthForm";
import { usePasswordValidation } from "../../hooks/usePasswordValidation";

interface PasswordResetFormProps {
  /**
   * Tryb formularza - "request" dla żądania resetu, "reset" dla faktycznej zmiany hasła
   */
  mode: "request" | "reset";
  /**
   * Token resetowania hasła (wymagany tylko w trybie reset)
   */
  token?: string;
  /**
   * Callback wywołany po pomyślnym resecie hasła
   */
  onResetSuccess: () => void;
}

/**
 * Komponent formularza resetowania hasła.
 * Obsługuje dwa tryby:
 * - request: formularz żądania linku do resetu hasła (wymagane pole email)
 * - reset: formularz ustawienia nowego hasła (wymagane pola password i confirm-password)
 */
export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  mode,
  token,
  onResetSuccess,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const { passwordError, validatePassword } = usePasswordValidation();

  const handleEmailSubmit = async (formData: Record<string, string>) => {
    try {
      const { email } = formData;

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd podczas wysyłania żądania resetowania hasła");
      }

      // Ustaw stan wskazujący, że email został wysłany
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      throw err;
    }
  };

  const handlePasswordReset = async (formData: Record<string, string>) => {
    try {
      const { password, "confirm-password": confirmPassword } = formData;

      // Walidacja haseł używając hooka
      const validation = validatePassword(password, confirmPassword);
      if (!validation.isValid) {
        throw new Error(validation.error || "Nieprawidłowe hasło");
      }

      // Sprawdź czy token jest dostępny
      if (!token) {
        throw new Error("Brak tokenu resetowania hasła");
      }

      const response = await fetch("/api/auth/confirm-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd podczas resetowania hasła");
      }

      // Wywołaj callback po pomyślnym resecie hasła
      onResetSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      throw err;
    }
  };

  // Formularz żądania linku resetującego
  if (mode === "request") {
    if (emailSent) {
      return (
        <div className="bg-white/5 backdrop-blur-md rounded-lg shadow-lg p-8 w-full max-w-md border border-white/10">
          <h1 className="text-3xl font-bold mb-8 text-center">Email wysłany</h1>
          <p className="text-center mb-6">
            Jeśli podany adres email istnieje w naszej bazie, wysłaliśmy na niego link do
            resetowania hasła.
          </p>
          <p className="text-center text-sm text-white/60">
            Sprawdź swoją skrzynkę odbiorczą oraz folder spam.
          </p>
          <div className="mt-8 text-center">
            <a href="/auth/login" className="text-purple-400 hover:text-purple-300 underline">
              Powrót do strony logowania
            </a>
          </div>
        </div>
      );
    }

    return (
      <AuthForm
        title="Resetowanie hasła"
        onSubmit={handleEmailSubmit}
        submitText="Wyślij link resetujący"
        footer={
          <a href="/auth/login" className="text-purple-400 hover:text-purple-300 underline">
            Powrót do strony logowania
          </a>
        }
      >
        <p className="text-white/80 mb-4">
          Podaj adres email powiązany z Twoim kontem. Wyślemy Ci link umożliwiający zresetowanie
          hasła.
        </p>

        <AuthInput
          label="Email"
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
        />

        {error && <div className="text-red-500 py-2 text-sm">{error}</div>}
      </AuthForm>
    );
  }

  // Formularz ustawienia nowego hasła
  return (
    <AuthForm
      title="Ustaw nowe hasło"
      onSubmit={handlePasswordReset}
      submitText="Zapisz nowe hasło"
      footer={
        <a href="/auth/login" className="text-purple-400 hover:text-purple-300 underline">
          Powrót do strony logowania
        </a>
      }
    >
      <p className="text-white/80 mb-4">Wprowadź i potwierdź nowe hasło dla swojego konta.</p>

      <AuthInput
        label="Nowe hasło"
        type="password"
        id="password"
        name="password"
        required
        autoComplete="new-password"
        hint="Minimum 8 znaków, cyfra, wielka litera i znak specjalny"
      />

      <AuthInput
        label="Potwierdź nowe hasło"
        type="password"
        id="confirm-password"
        name="confirm-password"
        required
        autoComplete="new-password"
      />

      {passwordError && <div className="text-red-500 py-2 text-sm">{passwordError}</div>}

      {error && passwordError === null && <div className="text-red-500 py-2 text-sm">{error}</div>}
    </AuthForm>
  );
};
