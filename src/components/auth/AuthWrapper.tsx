import React, { useState, useEffect } from "react";
import { supabaseClient } from "../../db/supabase.client";

interface AuthWrapperProps {
  /**
   * Zawartość do wyświetlenia, gdy użytkownik jest zalogowany
   */
  children: React.ReactNode;
  /**
   * Zawartość do wyświetlenia podczas ładowania
   */
  fallback?: React.ReactNode;
}

/**
 * Komponent opakowujący elementy wymagające autoryzacji.
 * Jeśli użytkownik nie jest zalogowany, zostanie automatycznie przekierowany do strony logowania.
 */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({
  children,
  fallback = (
    <div className="flex justify-center items-center h-24">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  ),
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (!session) {
          // Jeśli brak sesji, przekieruj na stronę logowania
          window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`;
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Błąd sprawdzania autoryzacji:", error);
        // W przypadku błędu przekieruj na stronę logowania
        window.location.href = "/auth/login";
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Jeśli trwa ładowanie, pokaż fallback
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Jeśli użytkownik jest zalogowany, pokaż zawartość
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Domyślnie zwróć null - przekierowanie zostanie obsłużone w useEffect
  return null;
};
