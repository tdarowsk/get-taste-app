import React, { useState } from "react";
import { AuthForm, AuthInput } from "./AuthForm";

interface LoginFormProps {
  /**
   * Callback wywołany po pomyślnym logowaniu
   */
  onLoginSuccess?: () => void;
}

/**
 * Komponent formularza logowania
 */
export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: Record<string, string>) => {
    try {
      const { email, password } = formData;

      console.log("Próba logowania...");

      const response = await fetch("/api/auth/login", {
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
      console.log("Odpowiedź z serwera:", data);

      if (!response.ok) {
        throw new Error(data.error || "Błąd logowania");
      }

      if (!data.success) {
        throw new Error(data.error || "Nieprawidłowy email lub hasło");
      }

      console.log("Logowanie pomyślne, przygotowanie do przekierowania...");

      // Wywołaj niestandardowe zdarzenie po pomyślnym logowaniu
      const loginSuccessEvent = new CustomEvent("login:success");
      document.dispatchEvent(loginSuccessEvent);

      // Obsługa przekierowania po zalogowaniu
      const handleRedirect = () => {
        // Pobierz bazowy URL z bieżącej lokalizacji
        const baseUrl = window.location.origin;
        console.log("Bazowy URL:", baseUrl);

        // Pobierz parametr przekierowania z URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectPath = urlParams.get("redirectTo") || "/dashboard";
        console.log("Ścieżka przekierowania:", redirectPath);

        // Upewnij się, że względna ścieżka ma prawidłowy format
        const redirectUrl = redirectPath.startsWith("/") ? `${baseUrl}${redirectPath}` : `${baseUrl}/${redirectPath}`;

        console.log("Przekierowanie do:", redirectUrl);

        // Przekieruj na właściwy adres - używamy setTimeout, aby przekierowanie
        // miało szansę się wykonać po wszystkich innych operacjach
        setTimeout(() => {
          console.log("Wykonuję przekierowanie...");
          window.location.href = redirectUrl;
        }, 100);
      };

      // Wywołaj callback po pomyślnym logowaniu jeśli został przekazany
      if (typeof onLoginSuccess === "function") {
        console.log("Wywołuję onLoginSuccess callback");
        onLoginSuccess();
      } else {
        console.log("Brak callbacku onLoginSuccess, wykonuję domyślne przekierowanie");
        handleRedirect();
      }
    } catch (err) {
      console.error("Błąd podczas logowania:", err);
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    }
  };

  return (
    <AuthForm
      title="Zaloguj się do getTaste"
      onSubmit={handleSubmit}
      submitText="Zaloguj się"
      footer={
        <div className="flex flex-col gap-4 items-center">
          <a href="/auth/reset-password" className="text-purple-400 hover:text-purple-300 underline">
            Zapomniałeś hasła?
          </a>
          <p className="text-lg">
            Nie masz konta?{" "}
            <a href="/auth/register" className="text-purple-400 hover:text-purple-300 underline">
              Zarejestruj się
            </a>
          </p>
        </div>
      }
    >
      <AuthInput label="Email" type="email" id="email" name="email" required autoComplete="email" />

      <AuthInput label="Hasło" type="password" id="password" name="password" required autoComplete="current-password" />

      {error && <div className="text-red-500 py-2 text-sm">{error}</div>}
    </AuthForm>
  );
};
