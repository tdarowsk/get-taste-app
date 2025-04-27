import React, { useState } from "react";
import { AuthForm, AuthInput } from "./AuthForm";

interface LoginFormProps {
  /**
   * Callback wywołany po pomyślnym zalogowaniu
   */
  onLoginSuccess: () => void;
}

/**
 * Komponent formularza logowania
 */
export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: Record<string, string>) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd logowania");
      }

      if (!data.success) {
        throw new Error(data.error || "Nieprawidłowy email lub hasło");
      }

      // Wywołaj callback po pomyślnym zalogowaniu
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      throw err;
    }
  };

  return (
    <AuthForm
      title="Zaloguj się do getTaste"
      onSubmit={handleSubmit}
      submitText="Zaloguj się"
      footer={
        <p className="text-lg">
          Nie masz jeszcze konta?{" "}
          <a href="/auth/register" className="text-purple-400 hover:text-purple-300 underline">
            Zarejestruj się
          </a>
        </p>
      }
    >
      <AuthInput label="Email" type="email" id="email" name="email" required autoComplete="email" />

      <div className="flex flex-col space-y-2">
        <AuthInput
          label="Hasło"
          type="password"
          id="password"
          name="password"
          required
          autoComplete="current-password"
        />
        <div className="text-right">
          <a href="/auth/reset-password" className="text-sm text-purple-400 hover:text-purple-300">
            Zapomniałeś hasła?
          </a>
        </div>
      </div>

      {error && <div className="text-red-500 py-2 text-sm">{error}</div>}
    </AuthForm>
  );
};
