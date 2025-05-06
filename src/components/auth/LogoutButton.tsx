import React, { useState } from "react";

interface LogoutButtonProps {
  /**
   * Callback wywołany po pomyślnym wylogowaniu
   */
  onLogoutSuccess?: () => void;
  /**
   * Dodatkowe klasy CSS
   */
  className?: string;
  /**
   * Treść przycisku
   */
  children?: React.ReactNode;
}

/**
 * Komponent przycisku wylogowania
 */
export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onLogoutSuccess,
  className = "",
  children = "Wyloguj się",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd wylogowania");
      }

      // Wywołaj niestandardowe zdarzenie po pomyślnym wylogowaniu
      const logoutSuccessEvent = new CustomEvent("logout:success");
      document.dispatchEvent(logoutSuccessEvent);

      // Opcjonalnie wywołaj callback
      if (onLogoutSuccess) {
        onLogoutSuccess();
      } else {
        // Domyślnie przekieruj na stronę logowania
        window.location.href = "/auth/login";
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-800 font-medium rounded-lg px-5 py-2.5 text-center ${className}`}
    >
      {isLoading ? "Wylogowywanie..." : children}
    </button>
  );
};
