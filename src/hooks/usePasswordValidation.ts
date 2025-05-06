import { useState } from "react";
import { validatePassword } from "../lib/validation";
import type { PasswordValidationState } from "../lib/validation";

/**
 * Hook do walidacji hasła w komponentach React
 *
 * @returns Obiekt zawierający stan błędu, funkcję setter i funkcję walidującą
 */
export function usePasswordValidation() {
  const [passwordError, setPasswordError] = useState<string | null>(null);

  /**
   * Funkcja walidująca hasło z użyciem podzielonej logiki
   *
   * @param password - hasło do walidacji
   * @param confirmPassword - potwierdzenie hasła
   * @returns Obiekt ze stanem walidacji
   */
  const validatePasswordAndUpdateState = (
    password: string,
    confirmPassword: string
  ): PasswordValidationState => {
    return validatePassword(password, confirmPassword, setPasswordError);
  };

  return {
    passwordError,
    setPasswordError,
    validatePassword: validatePasswordAndUpdateState,
  };
}
