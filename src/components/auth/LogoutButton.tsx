import React, { useState } from "react";

interface LogoutButtonProps {
  /**
   * Callback wywołany po pomyślnym wylogowaniu
   */
  onLogoutSuccess?: () => void;
  /**
   * Niestandardowa klasa CSS dla przycisku
   */
  className?: string;
  /**
   * Niestandardowy tekst przycisku
   */
  text?: string;
}

/**
 * Komponent przycisku wylogowania
 */
export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onLogoutSuccess,
  className = "",
  text = "Wyloguj się",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Błąd podczas wylogowywania");
      }

      // Po wylogowaniu, przekieruj do strony głównej lub wywołaj callback
      if (onLogoutSuccess) {
        onLogoutSuccess();
      } else {
        // Domyślne przekierowanie do strony głównej
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Błąd wylogowywania:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`text-white/80 hover:text-white transition-colors ${isLoading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      aria-label="Wyloguj się"
    >
      {isLoading ? "Wylogowywanie..." : text}
    </button>
  );
};
