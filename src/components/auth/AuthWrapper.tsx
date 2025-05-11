import React, { useState, useEffect } from "react";

interface AuthWrapperProps {
  /**
   * Komponent wyświetlany jeśli użytkownik jest zalogowany
   */
  children: React.ReactNode;
  /**
   * Komponent wyświetlany podczas ładowania stanu zalogowania
   */
  loadingComponent?: React.ReactNode;
  /**
   * Komponent wyświetlany jeśli użytkownik nie jest zalogowany
   */
  fallbackComponent?: React.ReactNode;
}

/**
 * Komponent opakowujący, który sprawdza stan zalogowania użytkownika
 * i renderuje odpowiedni komponent
 */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({
  children,
  loadingComponent = <div>Ładowanie...</div>,
  fallbackComponent = <div>Musisz być zalogowany, aby zobaczyć tę treść</div>,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Sprawdź stan zalogowania
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status", {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(!!data.user);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();

    // Nasłuchuj na zdarzenia logowania/wylogowania
    const handleLoginSuccess = () => setIsLoggedIn(true);
    const handleLogoutSuccess = () => setIsLoggedIn(false);

    document.addEventListener("login:success", handleLoginSuccess);
    document.addEventListener("logout:success", handleLogoutSuccess);

    return () => {
      document.removeEventListener("login:success", handleLoginSuccess);
      document.removeEventListener("logout:success", handleLogoutSuccess);
    };
  }, []);

  // Pokaż komponent ładowania, jeśli stan zalogowania jest jeszcze ustalany
  if (isLoggedIn === null) {
    return <>{loadingComponent}</>;
  }

  // Pokaż odpowiedni komponent w zależności od stanu zalogowania
  return <>{isLoggedIn ? children : fallbackComponent}</>;
};
