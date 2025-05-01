# Plan implementacji widoku systemu ulepszonych rekomendacji

## 1. Przegląd

Widok systemu ulepszonych rekomendacji umożliwia użytkownikom przeglądanie spersonalizowanych rekomendacji muzycznych i filmowych opartych na metadanych z ich wcześniejszych pozytywnych interakcji. System zbiera szczegółowe metadane (gatunki muzyczne/filmowe, członkowie obsady, reżyserzy, scenarzyści), analizuje wzorce w tych danych i generuje rekomendacje z wyraźnym uzasadnieniem, dlaczego dana treść została zaproponowana.

## 2. Routing widoku

```
/recommendations/enhanced
```

## 3. Struktura komponentów

```
ImprovedRecommendationsView
├── CategorySelector (wybór między muzyką a filmami)
├── MetadataFilterSelector (filtry do dostosowania rekomendacji)
├── RecommendationStack (kontener dla kart rekomendacji)
│   ├── RecommendationCard
│   │   ├── RecommendationContent (treść rekomendacji)
│   │   ├── RecommendationReason (powód rekomendacji)
│   │   └── SwipeControls (przyciski lubię/nie lubię)
└── MetadataInsightPanel (szczegóły metadanych wpływających na rekomendacje)
    ├── MetadataCategory (kategoria metadanych)
    └── MetadataItem (pojedyncza metadana)
```

## 4. Szczegóły komponentów

### ImprovedRecommendationsView

- **Opis komponentu**: Główny kontener widoku, zarządzający stanem rekomendacji, kategorii i metadanych.
- **Główne elementy**: Container z nagłówkiem, selektorem kategorii, komponentem ładowania, stackiem rekomendacji i panelem wglądu w metadane.
- **Obsługiwane interakcje**: Zmiana kategorii, odświeżanie rekomendacji.
- **Obsługiwana walidacja**: Sprawdzanie czy użytkownik jest zalogowany, walidacja typu rekomendacji.
- **Typy**: RecommendationDTO, EnhancedRecommendationViewModel.
- **Propsy**: userId (number).

### CategorySelector

- **Opis komponentu**: Umożliwia wybór kategorii rekomendacji (muzyka/film).
- **Główne elementy**: Grupa przycisków z ikonami i etykietami dla każdej kategorii.
- **Obsługiwane interakcje**: Kliknięcie w celu zmiany kategorii.
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: Nie wymaga specjalnych typów.
- **Propsy**: selectedCategory ('music' | 'film'), onCategoryChange (callback).

### MetadataFilterSelector

- **Opis komponentu**: Umożliwia dostosowanie wag różnych typów metadanych.
- **Główne elementy**: Sekcja z suwakami dla różnych typów metadanych, przycisk resetowania.
- **Obsługiwane interakcje**: Przeciąganie suwaków, resetowanie filtrów.
- **Obsługiwana walidacja**: Wartości wag muszą być w zakresie 0-1.
- **Typy**: MetadataWeight[].
- **Propsy**: weights (MetadataWeight[]), onWeightsChange (callback).

### RecommendationStack

- **Opis komponentu**: Wyświetla stos kart rekomendacji z animacją.
- **Główne elementy**: Container z kartami rekomendacji, nawigacja (poprzednia/następna).
- **Obsługiwane interakcje**: Swipe, przejście do następnej/poprzedniej.
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: EnhancedRecommendationViewModel[].
- **Propsy**: recommendations (EnhancedRecommendationViewModel[]), onFeedback (callback).

### RecommendationCard

- **Opis komponentu**: Wyświetla pojedynczą rekomendację z możliwością oceny.
- **Główne elementy**: Karta z obrazem, tytułem, opisem, powodem rekomendacji, przyciskami lubię/nie lubię.
- **Obsługiwane interakcje**: Swipe left/right, kliknięcie przycisków oceny.
- **Obsługiwana walidacja**: Sprawdzanie kompletności danych rekomendacji.
- **Typy**: EnhancedRecommendationViewModel, RecommendationFeedbackType.
- **Propsy**: recommendation (EnhancedRecommendationViewModel), onFeedback (callback).

### RecommendationContent

- **Opis komponentu**: Wyświetla treść rekomendacji (tytuł, opis, obraz).
- **Główne elementy**: Container z obrazem, tytułem, opisem, metadanymi.
- **Obsługiwane interakcje**: Nie dotyczy.
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: RecommendationDataDetails, RecommendationItem[].
- **Propsy**: data (RecommendationDataDetails), items (RecommendationItem[]).

### RecommendationReason

- **Opis komponentu**: Wyjaśnia, dlaczego dana rekomendacja została pokazana.
- **Główne elementy**: Tekst z uzasadnieniem, lista powiązanych pozycji.
- **Obsługiwane interakcje**: Rozwijanie/zwijanie szczegółów.
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: RecommendationReason.
- **Propsy**: reason (RecommendationReason), expanded (boolean), onToggle (callback).

### SwipeControls

- **Opis komponentu**: Przyciski dla akcji lubię/nie lubię.
- **Główne elementy**: Dwa przyciski z ikonami i animacją.
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: Nie wymaga specjalnych typów.
- **Propsy**: onLike (callback), onDislike (callback), disabled (boolean).

### MetadataInsightPanel

- **Opis komponentu**: Pokazuje szczegółowe informacje o metadanych wpływających na rekomendacje.
- **Główne elementy**: Sekcje z kategoriami metadanych, wykresy, statystyki.
- **Obsługiwane interakcje**: Rozwijanie/zwijanie kategorii, filtrowanie.
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: MetadataInsight.
- **Propsy**: insight (MetadataInsight), onFilterSelect (callback).

### MetadataCategory

- **Opis komponentu**: Wyświetla kategorię metadanych (np. gatunki, reżyserzy).
- **Główne elementy**: Nagłówek kategorii, lista elementów metadanych.
- **Obsługiwane interakcje**: Rozwijanie/zwijanie sekcji.
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: MetadataType, MetadataItem[].
- **Propsy**: type (MetadataType), items (MetadataItem[]), expanded (boolean), onToggle (callback).

### MetadataItem

- **Opis komponentu**: Wyświetla pojedynczą metadaną z wagą.
- **Główne elementy**: Nazwa metadanej, wskaźnik wagi/istotności, licznik wystąpień.
- **Obsługiwane interakcje**: Kliknięcie (wybór do filtrowania).
- **Obsługiwana walidacja**: Nie dotyczy.
- **Typy**: MetadataItem.
- **Propsy**: item (MetadataItem), selected (boolean), onClick (callback).

## 5. Typy

```typescript
// Istniejące typy z API
// (Te typy są już zdefiniowane w dostarczonym pliku types.ts)

// Nowe typy ViewModel

// Typy metadanych
enum MetadataType {
  MUSIC_GENRE = "musicGenre",
  FILM_GENRE = "filmGenre",
  DIRECTOR = "director",
  CAST_MEMBER = "castMember",
  SCREENWRITER = "screenwriter",
  ARTIST = "artist",
}

// Pojedyncza metadana
interface MetadataItem {
  id: string;
  type: MetadataType;
  name: string;
  count: number; // ile razy wystąpiła w polubionych treściach
  weight: number; // waga w algorytmie rekomendacji (0-1)
}

// Wgląd w metadane wpływające na rekomendację
interface MetadataInsight {
  recommendationId: number;
  primaryFactors: MetadataItem[]; // główne czynniki wpływające
  secondaryFactors: MetadataItem[]; // drugorzędne czynniki
  uniqueFactors: MetadataItem[]; // unikalne czynniki dla tej rekomendacji
}

// Uzasadnienie rekomendacji
interface RecommendationReason {
  primaryReason: string; // główny powód rekomendacji
  detailedReasons: string[]; // szczegółowe powody
  relatedItems: {
    id: string;
    name: string;
    similarity: number; // podobieństwo (0-1)
  }[];
}

// Wagi metadanych do filtrowania
interface MetadataWeight {
  type: MetadataType;
  name: string;
  weight: number; // 0-1
}

// Rozszerzona rekomendacja z dodatkowymi danymi
interface EnhancedRecommendationViewModel {
  recommendation: RecommendationDTO;
  reason: RecommendationReason;
  metadataInsight: MetadataInsight;
  isNew: boolean; // czy to nowa rekomendacja
}
```

## 6. Zarządzanie stanem

Stan widoku będzie zarządzany przez kilka niestandardowych hooków:

### useRecommendations

```typescript
const useRecommendations = (userId: number, type: "music" | "film") => {
  // Stan
  const [recommendations, setRecommendations] = useState<EnhancedRecommendationViewModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Funkcje
  const fetchRecommendations = async (forceRefresh: boolean = false) => {
    // Pobieranie rekomendacji z API
  };

  const submitFeedback = async (recommendationId: number, feedbackType: RecommendationFeedbackType) => {
    // Wysyłanie feedbacku do API
  };

  // Efekty
  useEffect(() => {
    fetchRecommendations();
  }, [userId, type]);

  return { recommendations, isLoading, error, fetchRecommendations, submitFeedback };
};
```

### useMetadataInsights

```typescript
const useMetadataInsights = (recommendationId: number) => {
  // Stan i logika do pobierania i analizy metadanych
  return { insights, isLoading, error };
};
```

### useSwipeGesture

```typescript
const useSwipeGesture = (onSwipeLeft: () => void, onSwipeRight: () => void) => {
  // Wykorzystanie biblioteki do gestów (np. react-use-gesture)
  return bindGesture; // referencja do podpięcia gestów
};
```

## 7. Integracja API

### Pobieranie rekomendacji

```typescript
const fetchRecommendations = async (userId: number, type: "music" | "film", forceRefresh: boolean = false) => {
  try {
    const response = await fetch(`/api/users/${userId}/recommendations?type=${type}&force_refresh=${forceRefresh}`);

    if (!response.ok) {
      throw new Error("Błąd pobierania rekomendacji");
    }

    const data: RecommendationDTO[] = await response.json();

    // Przekształcenie na EnhancedRecommendationViewModel[]
    const enhancedRecommendations = await Promise.all(
      data.map(async (recommendation) => {
        // Pobieranie dodatkowych danych (metadataInsight, reason)
        return {
          recommendation,
          reason: await fetchRecommendationReason(userId, recommendation.id),
          metadataInsight: await fetchMetadataInsight(userId, recommendation.id),
          isNew: true,
        };
      })
    );

    return enhancedRecommendations;
  } catch (error) {
    throw error;
  }
};
```

### Wysyłanie feedbacku

```typescript
const submitFeedback = async (userId: number, recommendationId: number, feedbackType: RecommendationFeedbackType) => {
  try {
    const response = await fetch(`/api/users/${userId}/recommendations/${recommendationId}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ feedback_type: feedbackType }),
    });

    if (!response.ok) {
      throw new Error("Błąd wysyłania feedbacku");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
```

### Pobieranie wglądu w metadane

```typescript
const fetchMetadataInsight = async (userId: number, recommendationId: number) => {
  try {
    const response = await fetch(`/api/users/${userId}/recommendations/${recommendationId}/metadata-insights`);

    if (!response.ok) {
      throw new Error("Błąd pobierania wglądu w metadane");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
```

## 8. Interakcje użytkownika

### Przełączanie kategorii (muzyka/film)

Użytkownik może przełączać się między rekomendacjami muzycznymi i filmowymi.

- **Akcja**: Kliknięcie przycisku kategorii
- **Wynik**: Załadowanie nowych rekomendacji dla wybranej kategorii
- **Implementacja**:
  ```typescript
  const handleCategoryChange = (category: "music" | "film") => {
    setSelectedCategory(category);
    fetchRecommendations(userId, category, true);
  };
  ```

### Swipe right (lubię)

Użytkownik może oznaczyć rekomendację jako lubianą poprzez przeciągnięcie karty w prawo.

- **Akcja**: Przesunięcie karty w prawo lub kliknięcie przycisku lubię
- **Wynik**: Zapisanie pozytywnego feedbacku, pokazanie następnej rekomendacji
- **Implementacja**:
  ```typescript
  const handleLike = (recommendationId: number) => {
    submitFeedback(userId, recommendationId, "like");
    showNextRecommendation();
  };
  ```

### Swipe left (nie lubię)

Użytkownik może odrzucić rekomendację poprzez przeciągnięcie karty w lewo.

- **Akcja**: Przesunięcie karty w lewo lub kliknięcie przycisku nie lubię
- **Wynik**: Zapisanie negatywnego feedbacku, pokazanie następnej rekomendacji
- **Implementacja**:
  ```typescript
  const handleDislike = (recommendationId: number) => {
    submitFeedback(userId, recommendationId, "dislike");
    showNextRecommendation();
  };
  ```

### Wyświetlenie szczegółów metadanych

Użytkownik może zobaczyć szczegółowe informacje o metadanych wpływających na rekomendację.

- **Akcja**: Kliknięcie przycisku "Zobacz więcej" przy metadanych
- **Wynik**: Rozwinięcie panelu z szczegółowymi metadanymi
- **Implementacja**:
  ```typescript
  const handleMetadataDetailsToggle = () => {
    setMetadataDetailsExpanded(!metadataDetailsExpanded);
  };
  ```

### Dostosowanie wag metadanych

Użytkownik może dostosować wagi różnych typów metadanych, aby wpłynąć na rekomendacje.

- **Akcja**: Przesunięcie suwaków w MetadataFilterSelector
- **Wynik**: Przeliczenie i odświeżenie rekomendacji z nowymi wagami
- **Implementacja**:
  ```typescript
  const handleWeightsChange = (weights: MetadataWeight[]) => {
    setMetadataWeights(weights);
    updateRecommendationsWithWeights(weights);
  };
  ```

## 9. Warunki i walidacja

### Autentykacja

- **Warunek**: Użytkownik musi być zalogowany, aby zobaczyć rekomendacje
- **Walidacja**: Sprawdzenie tokenu JWT
- **Wpływ na UI**: Przekierowanie do strony logowania jeśli użytkownik nie jest zalogowany
- **Implementacja**:
  ```typescript
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/recommendations/enhanced");
    }
  }, [isAuthenticated]);
  ```

### Kategoria rekomendacji

- **Warunek**: Typ rekomendacji musi być 'music' lub 'film'
- **Walidacja**: Ograniczenie opcji w UI
- **Wpływ na UI**: Tylko dwie opcje do wyboru w selektorze kategorii
- **Implementacja**:
  ```tsx
  <CategorySelector
    selectedCategory={selectedCategory}
    onCategoryChange={(cat) => {
      if (cat === "music" || cat === "film") {
        handleCategoryChange(cat);
      }
    }}
  />
  ```

### Wagi metadanych

- **Warunek**: Wagi metadanych muszą być w zakresie 0-1
- **Walidacja**: Ograniczenie suwaków w UI
- **Wpływ na UI**: Suwaki z wartościami min=0, max=1
- **Implementacja**:
  ```tsx
  <input
    type="range"
    min="0"
    max="1"
    step="0.1"
    value={weight.weight}
    onChange={(e) => handleWeightChange(weight.type, parseFloat(e.target.value))}
  />
  ```

## 10. Obsługa błędów

### Brak dostępnych rekomendacji

- **Scenariusz**: System nie ma rekomendacji dla użytkownika
- **Obsługa**: Wyświetlenie komunikatu z sugestią rozszerzenia preferencji
- **Implementacja**:
  ```tsx
  {
    recommendations.length === 0 && !isLoading && (
      <div className="empty-state">
        <h3>Brak rekomendacji</h3>
        <p>Rozszerz swoje preferencje lub oceń więcej treści, aby otrzymać lepsze rekomendacje.</p>
        <Button onClick={() => router.push("/profile/preferences")}>Edytuj preferencje</Button>
      </div>
    );
  }
  ```

### Błąd API podczas pobierania rekomendacji

- **Scenariusz**: Wystąpił błąd podczas komunikacji z API
- **Obsługa**: Wyświetlenie komunikatu błędu z opcją ponowienia
- **Implementacja**:
  ```tsx
  {
    error && (
      <div className="error-state">
        <h3>Wystąpił błąd</h3>
        <p>{error.message}</p>
        <Button onClick={() => fetchRecommendations(true)}>Spróbuj ponownie</Button>
      </div>
    );
  }
  ```

### Błąd podczas wysyłania feedbacku

- **Scenariusz**: Nie udało się zapisać oceny rekomendacji
- **Obsługa**: Zapisanie feedbacku lokalnie i próba ponownego wysłania w tle
- **Implementacja**:
  ```typescript
  const submitFeedbackWithRetry = async (recommendationId, feedbackType) => {
    try {
      await submitFeedback(userId, recommendationId, feedbackType);
    } catch (error) {
      // Zapisz w localStorage
      saveToLocalStorage("pendingFeedback", { recommendationId, feedbackType });
      // Pokaż delikatne powiadomienie
      showToast("Zapisano twoją ocenę lokalnie. Spróbujemy wysłać ją później.");
      // Zaplanuj ponowną próbę
      retryQueue.add(() => submitFeedback(userId, recommendationId, feedbackType));
    }
  };
  ```

## 11. Kroki implementacji

1. **Utworzenie struktur typów**

   - Zdefiniowanie nowych interfejsów i typów (MetadataType, MetadataItem, MetadataInsight, RecommendationReason, MetadataWeight, EnhancedRecommendationViewModel)

2. **Implementacja hooków zarządzania stanem**

   - Utworzenie useRecommendations, useMetadataInsights, useSwipeGesture

3. **Budowa komponentów bazowych**

   - Utworzenie komponentów CategorySelector, RecommendationCard, SwipeControls

4. **Implementacja głównego widoku**

   - Utworzenie ImprovedRecommendationsView z podstawowymi funkcjonalnościami

5. **Integracja API**

   - Implementacja funkcji pobierania rekomendacji i wysyłania feedbacku

6. **Dodanie wyświetlania metadanych**

   - Implementacja komponentów MetadataInsightPanel, MetadataCategory, MetadataItem
   - Podłączenie ich do głównego widoku

7. **Implementacja uzasadnienia rekomendacji**

   - Utworzenie komponentu RecommendationReason
   - Podłączenie go do karty rekomendacji

8. **Dodanie filtrowania przez wagi metadanych**

   - Implementacja MetadataFilterSelector
   - Integracja z logiką rekomendacji

9. **Implementacja gestów swipe**

   - Dodanie obsługi gestów do RecommendationCard

10. **Obsługa błędów i stanów pustych**

    - Dodanie komunikatów błędów, stanów ładowania i pustych stanów

11. **Optymalizacja wydajności**

    - Memoizacja komponentów, lazy loading, optymalizacja renderowania

12. **Testowanie i debugowanie**
    - Testowanie na różnych urządzeniach, testowanie dostępności
