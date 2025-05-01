# Plan implementacji widoku Dashboard i Rekomendacji

## 1. Przegląd

Dashboard to główny widok aplikacji getTaste, służący do prezentacji dynamicznie generowanych rekomendacji muzycznych i filmowych. Umożliwia użytkownikowi przeglądanie spersonalizowanych sugestii bazujących na ich preferencjach, a także zapewnia dostęp do edycji preferencji z poziomu tego samego widoku.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/dashboard`, która powinna być chronioną ścieżką wymagającą uwierzytelnienia.

## 3. Struktura komponentów

```
DashboardPage
├── Header
│   ├── UserProfileButton (prowadzi do edycji profilu)
│   └── NotificationIndicator
├── PreferencesSidePanel (widoczny tylko w widoku desktopowym)
│   ├── MusicPreferencesForm
│   └── FilmPreferencesForm
├── RecommendationsPanel
│   ├── RecommendationsHeader
│   │   ├── CategoryTabs ("Muzyka", "Filmy")
│   │   └── RefreshButton
│   ├── RecommendationsList
│   │   └── RecommendationCard (powtarzalny)
│   └── LoadingSpinner
└── MobilePreferencesModal (dostępny tylko na urządzeniach mobilnych)
    ├── MusicPreferencesForm
    └── FilmPreferencesForm
```

## 4. Szczegóły komponentów

### DashboardPage

- **Opis komponentu**: Główny komponent strony, odpowiedzialny za układ i zarządzanie stanem całego widoku.
- **Główne elementy**: Container z flexbox do rozmieszczenia komponentów, obsługa zapytań do API z wykorzystaniem React Query.
- **Obsługiwane interakcje**: Przełączanie między kategoriami rekomendacji, otwieranie/zamykanie panelu preferencji.
- **Obsługiwana walidacja**: Sprawdzanie stanu uwierzytelnienia użytkownika.
- **Typy**: `UserProfileDTO`, `RecommendationDTO`, `UserPreferencesDTO`.
- **Propsy**: Brak (komponent najwyższego poziomu).

### Header

- **Opis komponentu**: Górny pasek nawigacyjny z logo aplikacji, przyciskiem profilu i wskaźnikiem powiadomień.
- **Główne elementy**: Logo, przyciski nawigacyjne, ikona profilu.
- **Obsługiwane interakcje**: Przejście do profilu, wylogowanie.
- **Typy**: `UserProfileDTO`.
- **Propsy**: `user: UserProfileDTO`.

### PreferencesSidePanel

- **Opis komponentu**: Panel boczny z formularzami do edycji preferencji użytkownika. Widoczny tylko w widoku desktopowym.
- **Główne elementy**: Zakładki dla preferencji muzycznych i filmowych, formularze edycji.
- **Obsługiwane interakcje**: Przełączanie między typami preferencji, modyfikacja i zapisywanie preferencji.
- **Obsługiwana walidacja**: Walidacja pól formularza - sprawdzanie niepustych tablic dla gatunków.
- **Typy**: `UserPreferencesDTO`, `UpdateMusicPreferencesCommand`, `UpdateFilmPreferencesCommand`.
- **Propsy**: `preferences: UserPreferencesDTO`, `onUpdate: (type: "music" | "film", data: UpdateMusicPreferencesCommand | UpdateFilmPreferencesCommand) => Promise<void>`.

### MusicPreferencesForm

- **Opis komponentu**: Formularz do edycji preferencji muzycznych.
- **Główne elementy**: Pola formularza dla gatunków i artystów (jako pola z tagami).
- **Obsługiwane interakcje**: Dodawanie/usuwanie tagów, zapisywanie formularza.
- **Obsługiwana walidacja**: Co najmniej jeden gatunek musi być wybrany.
- **Typy**: `MusicPreferencesDTO`, `UpdateMusicPreferencesCommand`.
- **Propsy**: `initialData: MusicPreferencesDTO`, `onSubmit: (data: UpdateMusicPreferencesCommand) => Promise<void>`.

### FilmPreferencesForm

- **Opis komponentu**: Formularz do edycji preferencji filmowych.
- **Główne elementy**: Pola formularza dla gatunków, reżysera, obsady i scenarzysty.
- **Obsługiwane interakcje**: Dodawanie/usuwanie tagów, wypełnianie pól tekstowych, zapisywanie formularza.
- **Obsługiwana walidacja**: Co najmniej jeden gatunek musi być wybrany.
- **Typy**: `FilmPreferencesDTO`, `UpdateFilmPreferencesCommand`.
- **Propsy**: `initialData: FilmPreferencesDTO`, `onSubmit: (data: UpdateFilmPreferencesCommand) => Promise<void>`.

### RecommendationsPanel

- **Opis komponentu**: Główny panel prezentujący rekomendacje.
- **Główne elementy**: Nagłówek z przełącznikami kategorii, lista rekomendacji, przycisk odświeżania.
- **Obsługiwane interakcje**: Przełączanie typu rekomendacji, odświeżanie rekomendacji.
- **Typy**: `RecommendationDTO`.
- **Propsy**: `recommendations: RecommendationDTO[]`, `activeType: "music" | "film"`, `onTypeChange: (type: "music" | "film") => void`, `onRefresh: () => void`.

### RecommendationsHeader

- **Opis komponentu**: Nagłówek panelu rekomendacji z przełącznikami kategorii i przyciskiem odświeżania.
- **Główne elementy**: Przyciski zakładek, przycisk odświeżania.
- **Obsługiwane interakcje**: Przełączanie między kategoriami, odświeżanie rekomendacji.
- **Typy**: Nie wymaga specjalnych typów.
- **Propsy**: `activeType: "music" | "film"`, `onTypeChange: (type: "music" | "film") => void`, `onRefresh: () => void`.

### RecommendationsList

- **Opis komponentu**: Lista rekomendacji wyświetlanych na podstawie wybranej kategorii.
- **Główne elementy**: Grid lub lista elementów `RecommendationCard`.
- **Obsługiwane interakcje**: Przewijanie listy.
- **Typy**: `RecommendationDTO`.
- **Propsy**: `recommendations: RecommendationDTO[]`, `isLoading: boolean`.

### RecommendationCard

- **Opis komponentu**: Karta pojedynczej rekomendacji.
- **Główne elementy**: Obraz, tytuł, opis, szczegóły.
- **Obsługiwane interakcje**: Kliknięcie karty może prowadzić do szczegółów (opcjonalnie).
- **Typy**: `RecommendationItem` lub elementy z `RecommendationDataDetails`.
- **Propsy**: `item: RecommendationItem`, `type: "music" | "film"`.

### MobilePreferencesModal

- **Opis komponentu**: Modal z formularzami edycji preferencji, widoczny tylko na urządzeniach mobilnych.
- **Główne elementy**: Nagłówek z przyciskiem zamknięcia, formularze preferencji.
- **Obsługiwane interakcje**: Otwieranie/zamykanie modalu, przełączanie między typami preferencji.
- **Obsługiwana walidacja**: Taka sama jak w `PreferencesSidePanel`.
- **Typy**: `UserPreferencesDTO`, `UpdateMusicPreferencesCommand`, `UpdateFilmPreferencesCommand`.
- **Propsy**: `isOpen: boolean`, `onClose: () => void`, `preferences: UserPreferencesDTO`, `onUpdate: (type: "music" | "film", data: UpdateMusicPreferencesCommand | UpdateFilmPreferencesCommand) => Promise<void>`.

## 5. Typy

Aplikacja korzysta z istniejących typów zdefiniowanych w `src/types.ts`, które obejmują:

### Potrzebne ViewModel typy do implementacji

```typescript
/**
 * ViewModel do reprezentacji UI rekomendacji
 */
interface RecommendationViewModel {
  id: number;
  type: "music" | "film";
  title: string;
  items: RecommendationItemViewModel[];
  createdAt: Date;
}

/**
 * ViewModel elementu rekomendacji
 */
interface RecommendationItemViewModel {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  metadata: Record<string, unknown>;
}

/**
 * ViewModel formularza preferencji muzycznych
 */
interface MusicPreferencesFormModel {
  genres: string[];
  artists: string[];
}

/**
 * ViewModel formularza preferencji filmowych
 */
interface FilmPreferencesFormModel {
  genres: string[];
  director: string;
  cast: string[];
  screenwriter: string;
}
```

Transformacje między modelami DTO a ViewModel są potrzebne, aby dostosować dane otrzymane z API do potrzeb UI.

## 6. Zarządzanie stanem

Zarządzanie stanem w widoku dashboard będzie realizowane z użyciem React Query i lokalnego stanu Reacta:

1. **Zapytania React Query**:

   - `useUserPreferences` - hook pobierający preferencje użytkownika
   - `useRecommendations` - hook pobierający rekomendacje
   - `useUpdatePreferences` - hook aktualizujący preferencje
   - `useGenerateRecommendations` - hook generujący nowe rekomendacje

2. **Niestandardowe hooki**:
   ```typescript
   const useDashboard = (userId: number) => {
     const [activeType, setActiveType] = useState<"music" | "film">("music");
     const [isMobilePreferencesOpen, setMobilePreferencesOpen] = useState(false);

     const preferencesQuery = useUserPreferences(userId);
     const recommendationsQuery = useRecommendations(userId, activeType);
     const updatePreferencesMutation = useUpdatePreferences();
     const generateRecommendationsMutation = useGenerateRecommendations();

     const refreshRecommendations = useCallback(() => {
       generateRecommendationsMutation.mutate({
         userId,
         type: activeType,
         force_refresh: true,
       });
     }, [userId, activeType, generateRecommendationsMutation]);

     const handlePreferencesUpdate = useCallback(
       async (type: "music" | "film", data: UpdateMusicPreferencesCommand | UpdateFilmPreferencesCommand) => {
         await updatePreferencesMutation.mutateAsync({
           userId,
           type,
           data,
         });
         refreshRecommendations();
       },
       [userId, updatePreferencesMutation, refreshRecommendations]
     );

     return {
       activeType,
       setActiveType,
       isMobilePreferencesOpen,
       setMobilePreferencesOpen,
       preferences: preferencesQuery.data,
       isPreferencesLoading: preferencesQuery.isLoading,
       recommendations: recommendationsQuery.data,
       isRecommendationsLoading: recommendationsQuery.isLoading,
       refreshRecommendations,
       handlePreferencesUpdate,
       isUpdatingPreferences: updatePreferencesMutation.isLoading,
       isGeneratingRecommendations: generateRecommendationsMutation.isLoading,
     };
   };
   ```

## 7. Integracja API

Integracja z API będzie realizowana przy pomocy React Query:

### Pobieranie preferencji użytkownika

```typescript
const useUserPreferences = (userId: number) => {
  return useQuery({
    queryKey: ["preferences", userId],
    queryFn: async () => {
      const response = await fetch(`/users/${userId}/preferences`);
      if (!response.ok) throw new Error("Błąd pobierania preferencji");
      return (await response.json()) as UserPreferencesDTO;
    },
  });
};
```

### Pobieranie rekomendacji

```typescript
const useRecommendations = (userId: number, type: "music" | "film") => {
  return useQuery({
    queryKey: ["recommendations", userId, type],
    queryFn: async () => {
      const response = await fetch(`/users/${userId}/recommendations?type=${type}`);
      if (!response.ok) throw new Error("Błąd pobierania rekomendacji");
      return (await response.json()) as RecommendationDTO[];
    },
  });
};
```

### Aktualizacja preferencji

```typescript
const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      type,
      data,
    }: {
      userId: number;
      type: "music" | "film";
      data: UpdateMusicPreferencesCommand | UpdateFilmPreferencesCommand;
    }) => {
      const response = await fetch(`/users/${userId}/preferences/${type}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`Błąd aktualizacji preferencji ${type}`);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["preferences", variables.userId] });
    },
  });
};
```

### Generowanie nowych rekomendacji

```typescript
const useGenerateRecommendations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      type,
      force_refresh,
    }: {
      userId: number;
      type: "music" | "film";
      force_refresh: boolean;
    }) => {
      const response = await fetch(`/users/${userId}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, force_refresh }),
      });

      if (!response.ok) throw new Error("Błąd generowania rekomendacji");
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["recommendations", variables.userId, variables.type],
      });
    },
  });
};
```

## 8. Interakcje użytkownika

1. **Przełączanie kategorii rekomendacji**:

   - Użytkownik klika na zakładkę "Muzyka" lub "Filmy"
   - System zmienia `activeType` i pobiera odpowiednie rekomendacje
   - Widok jest odświeżany, aby pokazać nowe rekomendacje

2. **Odświeżanie rekomendacji**:

   - Użytkownik klika przycisk odświeżania
   - System wywołuje `useGenerateRecommendations` z `force_refresh: true`
   - Podczas generowania wyświetlany jest spinner
   - Po zakończeniu pokazywane są nowe rekomendacje

3. **Edycja preferencji (desktop)**:

   - Użytkownik modyfikuje pola formularza w panelu bocznym
   - Po zakończeniu klika "Zapisz"
   - System aktualizuje preferencje w bazie i generuje nowe rekomendacje
   - Wyświetlany jest komunikat o powodzeniu operacji

4. **Edycja preferencji (mobile)**:
   - Użytkownik klika przycisk preferencji
   - Otwiera się modal z formularzami
   - Po modyfikacji użytkownik klika "Zapisz"
   - System aktualizuje preferencje i generuje nowe rekomendacje

## 9. Warunki i walidacja

1. **Formularze preferencji muzycznych**:

   - Minimum jeden gatunek musi być wybrany
   - Artyści są opcjonalni

2. **Formularze preferencji filmowych**:

   - Minimum jeden gatunek musi być wybrany
   - Reżyser, obsada i scenarzysta są opcjonalni

3. **Generowanie rekomendacji**:

   - Rekomendacje są generowane tylko gdy użytkownik ma zdefiniowane preferencje
   - W przypadku braku preferencji wyświetlany jest komunikat zachęcający do ich uzupełnienia

4. **Dostęp do widoku**:
   - Widok jest dostępny tylko dla zalogowanych użytkowników
   - Niezalogowani użytkownicy są przekierowywani do strony logowania

## 10. Obsługa błędów

1. **Błędy pobierania danych**:

   - W przypadku błędu pobierania preferencji wyświetlany jest komunikat o błędzie z opcją ponowienia
   - W przypadku błędu pobierania rekomendacji wyświetlany jest komunikat z przyciskiem ponowienia

2. **Błędy aktualizacji preferencji**:

   - Wyświetlany jest toast z informacją o błędzie
   - Formularz pozostaje otwarty z wprowadzonymi danymi
   - Użytkownik może ponowić próbę zapisu

3. **Błędy generowania rekomendacji**:

   - Wyświetlany jest komunikat o błędzie z przyciskiem ponowienia
   - Stare rekomendacje pozostają widoczne

4. **Brak preferencji**:
   - Wyświetlany jest komunikat zachęcający do uzupełnienia preferencji
   - Przyciski prowadzące do odpowiednich formularzy preferencji

## 11. Kroki implementacji

1. Utworzenie podstawowej struktury plików:

   ```
   src/
   ├── pages/
   │   └── dashboard.astro
   ├── components/
   │   ├── dashboard/
   │   │   ├── DashboardLayout.tsx
   │   │   ├── Header.tsx
   │   │   ├── PreferencesSidePanel.tsx
   │   │   ├── MusicPreferencesForm.tsx
   │   │   ├── FilmPreferencesForm.tsx
   │   │   ├── RecommendationsPanel.tsx
   │   │   ├── RecommendationsHeader.tsx
   │   │   ├── RecommendationsList.tsx
   │   │   ├── RecommendationCard.tsx
   │   │   └── MobilePreferencesModal.tsx
   │   └── ui/
   │       └── (istniejące komponenty UI)
   └── lib/
       └── hooks/
           ├── useUserPreferences.ts
           ├── useRecommendations.ts
           ├── useUpdatePreferences.ts
           ├── useGenerateRecommendations.ts
           └── useDashboard.ts
   ```

2. Implementacja hooków API z użyciem React Query.

3. Implementacja głównego hooka `useDashboard` do zarządzania stanem widoku.

4. Implementacja komponentów UI od dołu do góry:

   - Najpierw komponenty najniższego poziomu (`RecommendationCard`)
   - Następnie komponenty warstwy pośredniej (`RecommendationsList`, formularze preferencji)
   - Na końcu główne komponenty kontenera (`DashboardLayout`)

5. Implementacja responsywności:

   - Na desktopie side panel jest zawsze widoczny
   - Na urządzeniach mobilnych preferencje są dostępne przez modal

6. Dodanie obsługi błędów i komunikatów dla użytkownika:

   - Komunikaty toast dla potwierdzenia operacji i błędów
   - Obsługa pustych stanów i ładowania danych

7. Testowanie i debugowanie:
   - Testy komponentów
   - Testy integracyjne
   - Sprawdzenie responsywności i dostępności
