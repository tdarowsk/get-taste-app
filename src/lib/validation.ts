/**
 * Funkcje pomocnicze do walidacji formularzy
 */

/**
 * Typ stanu błędu walidacji hasła
 */
export interface PasswordValidationState {
  isValid: boolean;
  error: string | null;
}

/**
 * Typ funkcji ustawiającej błąd walidacji hasła
 */
export type SetPasswordErrorFn = (error: string | null) => void;

/**
 * Waliduje hasło pod kątem wymagań:
 * - minimalna długość 8 znaków
 * - zawiera co najmniej jedną cyfrę
 * - zawiera co najmniej jedną wielką literę
 * - zawiera co najmniej jeden znak specjalny
 *
 * @param password - hasło do walidacji
 * @param confirmPassword - potwierdzenie hasła do porównania
 * @param setError - opcjonalna funkcja do ustawienia błędu w komponencie (efekt uboczny)
 * @returns obiekt zawierający stan walidacji
 */
export function validatePassword(
  password: string,
  confirmPassword: string,
  setError?: SetPasswordErrorFn
): PasswordValidationState {
  // Domyślny stan - poprawna walidacja
  const result: PasswordValidationState = {
    isValid: true,
    error: null,
  };

  // Resetuj błędy jeśli przekazano funkcję setter
  if (setError) {
    setError(null);
  }

  // Sprawdź czy hasła są identyczne
  if (password !== confirmPassword) {
    result.isValid = false;
    result.error = "Hasła nie są identyczne";
  }
  // Sprawdź minimalną długość
  else if (password.length < 8) {
    result.isValid = false;
    result.error = "Hasło musi zawierać minimum 8 znaków";
  }
  // Sprawdź czy zawiera cyfrę
  else if (!/\d/.test(password)) {
    result.isValid = false;
    result.error = "Hasło musi zawierać co najmniej jedną cyfrę";
  }
  // Sprawdź czy zawiera wielką literę
  else if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.error = "Hasło musi zawierać co najmniej jedną wielką literę";
  }
  // Sprawdź czy zawiera znak specjalny
  else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    result.isValid = false;
    result.error = "Hasło musi zawierać co najmniej jeden znak specjalny";
  }

  // Ustaw błąd w komponencie, jeśli przekazano funkcję setter
  if (setError && !result.isValid) {
    setError(result.error);
  }

  return result;
}

/**
 * Waliduje adres email
 *
 * @param email - adres email do walidacji
 * @returns czy email jest poprawny
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
