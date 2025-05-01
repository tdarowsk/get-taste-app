# Specyfikacja Techniczna Systemu Autentykacji dla getTaste

## 1. Architektura Interfejsu Użytkownika

### 1.1. Struktura stron i komponentów

#### Strony Astro (Server-Side Rendering):

- **`/` (Landing Page)** - Strona powitalna dla niezalogowanych użytkowników
- **`/auth/register`** - Strona formularza rejestracji
- **`/auth/login`** - Strona formularza logowania
- **`/auth/reset-password`** - Strona formularza resetowania hasła
- **`/auth/confirm`** - Strona potwierdzenia rejestracji/resetu hasła
- **`/dashboard`** - Strona główna dla zalogowanych użytkowników (chroniona)
- **`/profile`** - Strona profilu użytkownika (chroniona)

#### Komponenty React (Client-Side):

- **`AuthForm`** - Bazowy komponent formularza autentykacji z obsługą stanu i walidacji
- **`LoginForm`** - Specyficzny komponent formularza logowania
- **`RegisterForm`** - Specyficzny komponent formularza rejestracji
- **`PasswordResetForm`** - Komponent formularza resetowania hasła
- **`AuthErrorDisplay`** - Komponent do wyświetlania komunikatów błędów
- **`LogoutButton`** - Komponent przycisku wylogowania
- **`AuthWrapper`** - Komponent opakowujący strony chronione, weryfikujący sesję użytkownika

#### Layouty:

- **`BaseLayout.astro`** - Podstawowy layout aplikacji
- **`AuthLayout.astro`** - Layout dla stron autentykacji
- **`ProtectedLayout.astro`** - Layout dla stron wymagających zalogowania

### 1.2. Przepływ użytkownika i integracja

#### Rejestracja:

1. Użytkownik trafia na stronę powitalną (Landing Page)
2. Klika przycisk "Zarejestruj się"
3. Zostaje przekierowany na `/auth/register`
4. Wypełnia formularz rejestracji (email, hasło, potwierdzenie hasła)
5. Po pomyślnej walidacji front-end, dane są przesyłane do Supabase
6. W przypadku sukcesu, użytkownik jest automatycznie logowany i przekierowywany do `/dashboard`
7. W przypadku błędu, wyświetlany jest odpowiedni komunikat

#### Logowanie:

1. Użytkownik trafia na stronę powitalną (Landing Page)
2. Klika przycisk "Zaloguj się"
3. Zostaje przekierowany na `/auth/login`
4. Wypełnia formularz logowania (email, hasło)
5. Po walidacji front-end, dane są przesyłane do Supabase
6. W przypadku sukcesu, użytkownik jest przekierowywany do `/dashboard`
7. W przypadku błędu, wyświetlany jest odpowiedni komunikat

#### Reset hasła:

1. Użytkownik klika "Zapomniałem hasła" na stronie logowania
2. Zostaje przekierowany na `/auth/reset-password`
3. Wprowadza swój email
4. Po pomyślnej walidacji, Supabase wysyła email z linkiem do resetowania hasła
5. Użytkownik klika w link w emailu i trafia na `/auth/confirm` z odpowiednimi parametrami
6. Wprowadza nowe hasło i potwierdza je
7. Po pomyślnej walidacji, hasło jest aktualizowane w Supabase
8. Użytkownik jest przekierowywany na stronę logowania

#### Wylogowanie:

1. Zalogowany użytkownik klika przycisk "Wyloguj" dostępny na każdej stronie
2. Sesja jest usuwana z Supabase
3. Użytkownik jest przekierowywany na stronę powitalną

### 1.3. Walidacja i obsługa błędów

#### Walidacja Client-Side:

- Email:
  - Format email (regex)
  - Wymagane pole
- Hasło:
  - Minimum 8 znaków
  - Zawiera co najmniej jedną cyfrę
  - Zawiera co najmniej jedną wielką literę
  - Zawiera co najmniej jeden znak specjalny
  - Wymagane pole
- Potwierdzenie hasła:
  - Musi być identyczne z hasłem
  - Wymagane pole

#### Komunikaty błędów:

- Walidacja formularza:

  - "Wprowadź poprawny adres email"
  - "Hasło musi zawierać minimum 8 znaków"
  - "Hasło musi zawierać co najmniej jedną cyfrę"
  - "Hasło musi zawierać co najmniej jedną wielką literę"
  - "Hasło musi zawierać co najmniej jeden znak specjalny"
  - "Hasła nie są identyczne"
  - "To pole jest wymagane"

- Błędy Supabase:
  - "Konto z tym adresem email już istnieje"
  - "Nieprawidłowy email lub hasło"
  - "Nie znaleziono konta z tym adresem email"
  - "Link do resetowania hasła wygasł"
  - "Wystąpił błąd podczas przetwarzania żądania. Spróbuj ponownie później"

## 2. Logika Backendowa

### 2.1. Integracja z Supabase

#### Konfiguracja Supabase:

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### Model danych użytkownika:

```typescript
// types/user.ts
export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  music_preferences: {
    genres: string[];
    artists: string[];
  };
  movie_preferences: {
    genres: string[];
    directors: string[];
    actors: string[];
    screenwriters: string[];
  };
  created_at: string;
  updated_at: string;
}
```

### 2.2. Serwisy autentykacji

```typescript
// services/auth.ts
import { supabase } from "../lib/supabase";

export const authService = {
  // Rejestracja użytkownika
  async register(email: string, password: string) {
    return await supabase.auth.signUp({
      email,
      password,
    });
  },

  // Logowanie użytkownika
  async login(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  // Wylogowanie użytkownika
  async logout() {
    return await supabase.auth.signOut();
  },

  // Pobranie aktualnej sesji
  async getSession() {
    return await supabase.auth.getSession();
  },

  // Resetowanie hasła
  async resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });
  },

  // Aktualizacja hasła
  async updatePassword(password: string) {
    return await supabase.auth.updateUser({
      password,
    });
  },
};
```

### 2.3. API Middleware (Server-Side)

Astro udostępnia mechanizm middleware, który możemy wykorzystać do ochrony stron wymagających zalogowania:

```typescript
// middleware.ts
import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";

export const onRequest = defineMiddleware(async ({ request, locals, redirect }, next) => {
  const { pathname } = new URL(request.url);

  // Strony chronione, wymagające autentykacji
  const protectedRoutes = ["/dashboard", "/profile"];

  // Sprawdzenie czy ścieżka wymaga autentykacji
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return redirect("/auth/login?redirectTo=" + encodeURIComponent(pathname));
    }

    // Dodanie informacji o użytkowniku do kontekstu
    locals.user = session.user;
  }

  return next();
});
```

### 2.4. Server Endpoints

W Astro możemy zdefiniować endpointy API, które będą obsługiwały żądania od komponentów React:

```typescript
// src/pages/api/auth/register.ts
import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const post: APIRoute = async ({ request, redirect }) => {
  try {
    const data = await request.json();
    const { email, password } = data;

    // Walidacja danych wejściowych
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email i hasło są wymagane" }), { status: 400 });
    }

    // Rejestracja użytkownika
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    // Tworzenie profilu użytkownika
    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: authData.user.id,
        music_preferences: { genres: [], artists: [] },
        movie_preferences: { genres: [], directors: [], actors: [], screenwriters: [] },
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    return new Response(JSON.stringify({ success: true, user: authData.user }), { status: 200 });
  } catch (e) {
    console.error("Registration error:", e);
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas rejestracji" }), { status: 500 });
  }
};
```

Podobne endpointy dla logowania, wylogowania i resetowania hasła.

## 3. System Autentykacji

### 3.1. Integracja Supabase Auth z Astro

#### Inicjalizacja klienta Supabase

W main.ts lub odpowiednim pliku konfiguracyjnym:

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

#### Kontrola dostępu w layoutach

```astro
---
import BaseLayout from "./BaseLayout.astro";
import { supabase } from "../lib/supabase";

// Sprawdzenie czy użytkownik jest zalogowany
const {
  data: { session },
} = await supabase.auth.getSession();

// Jeśli nie ma sesji, przekieruj na stronę logowania
if (!session) {
  return Astro.redirect("/auth/login?redirectTo=" + encodeURIComponent(Astro.url.pathname));
}

const { user } = session;
---

<!-- src/layouts/ProtectedLayout.astro -->
<BaseLayout>
  <slot />
</BaseLayout>
```

### 3.2. Hooks React dla autentykacji

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "../types/user";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pobranie aktualnego użytkownika
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    fetchUser();

    // Nasłuchiwanie zmian autoryzacji
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    return { data, error };
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    return { data, error };
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    return { error };
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });
    setLoading(false);
    return { data, error };
  };

  const updatePassword = async (password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    return { data, error };
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
  };
}
```

### 3.3. Kontekst autentykacji

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
```

### 3.4. Konfiguracja Astro

W pliku `astro.config.mjs` należy dodać odpowiednią konfigurację:

```javascript
// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [react(), tailwind()],
  output: "server", // Konieczne dla autentykacji server-side
});
```

## 4. Podsumowanie i wnioski

Przedstawiona architektura systemu autentykacji dla aplikacji getTaste zapewnia:

1. **Kompleksowe rozwiązanie uwzględniające rejestrację, logowanie i resetowanie hasła** zgodnie z wymaganiami US-002 i US-003.

2. **Optymalny podział odpowiedzialności**:

   - Strony Astro zapewniają server-side rendering i kontrolę dostępu
   - Komponenty React obsługują interaktywne formularze i logikę client-side
   - Supabase Auth odpowiada za bezpieczne przechowywanie i weryfikację danych uwierzytelniających

3. **Bezpieczny przepływ danych**:

   - Walidacja danych zarówno na front-endzie, jak i na back-endzie
   - Szyfrowanie haseł wykonywane przez Supabase
   - Bezpieczne zarządzanie tokenami sesji

4. **Skalowalność rozwiązania**:

   - Możliwość łatwego dodania dodatkowych metod autentykacji (OAuth, Magic Link)
   - Rozbudowa systemu ról i uprawnień w przyszłości

5. **Spójność z istniejącą dokumentacją**:
   - Implementacja zgodna z wymaganiami zawartymi w PRD.md
   - Wykorzystanie technologii wymienionych w tech-stack.md
   - Uwzględnienie przepływu użytkownika opisanego w historyjkach użytkownika

Zaproponowana architektura zapewnia solidną podstawę dla funkcjonalności autentykacji w aplikacji getTaste, jednocześnie umożliwiając przyszłą rozbudowę systemu.
