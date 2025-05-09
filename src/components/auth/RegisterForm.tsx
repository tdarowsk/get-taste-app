import React, { useState } from "react";
import { AuthForm, AuthInput } from "./AuthForm";
import { usePasswordValidation } from "../../hooks/usePasswordValidation";

interface RegisterFormProps {
  /**
   * Callback wywołany po pomyślnej rejestracji
   */
  onRegisterSuccess: () => void;
}

/**
 * Komponent formularza rejestracji
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const { passwordError, validatePassword } = usePasswordValidation();

  const handleSubmit = async (formData: Record<string, string>) => {
    try {
      const { email, password, "confirm-password": confirmPassword } = formData;

      // Walidacja haseł używając hooka
      const validation = validatePassword(password, confirmPassword);
      if (!validation.isValid) {
        throw new Error(validation.error || "Nieprawidłowe hasło");
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd rejestracji");
      }

      if (!data.success) {
        throw new Error(data.error || "Nie udało się utworzyć konta");
      }

      // Wywołaj callback po pomyślnej rejestracji
      onRegisterSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      throw err;
    }
  };

  return (
    <AuthForm
      title="Zarejestruj się w getTaste"
      onSubmit={handleSubmit}
      submitText="Zarejestruj się"
      footer={
        <p className="text-lg">
          Masz już konto?{" "}
          <a href="/auth/login" className="text-purple-400 hover:text-purple-300 underline">
            Zaloguj się
          </a>
        </p>
      }
    >
      <AuthInput label="Email" type="email" id="email" name="email" required autoComplete="email" />

      <AuthInput
        label="Hasło"
        type="password"
        id="password"
        name="password"
        required
        autoComplete="new-password"
        hint="Minimum 8 znaków, cyfra, wielka litera i znak specjalny"
      />

      <AuthInput
        label="Potwierdź hasło"
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
