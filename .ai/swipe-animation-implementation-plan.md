# Plan Implementacji Animacji Swipe dla Kart Rekomendacji

## 1. Przegląd techniczny

Implementacja płynnych animacji swipowania kart rekomendacji będzie oparta na bibliotece Framer Motion, która jest już zainstalowana i częściowo używana w projekcie. Aktualnie w aplikacji istnieją komponenty `SwipeableRecommendationCard` oraz `SwipeableRecommendations`, a także `RecommendationSidebar` z możliwością przeciągania, które stanowią dobrą podstawę do rozbudowy funkcjonalności animacji. Kluczowe usprawnienia skupią się na poprawie płynności animacji, dodaniu efektów wizualnych podczas przeciągania oraz zapewnieniu opcji dostępności, zgodnie z wymaganiami US-017 z PRD.

### Kluczowe technologie
- **Framer Motion** - biblioteka do tworzenia płynnych animacji w React, już używana w `RecommendationSidebar`
- **React** - framework frontendowy aplikacji
- **Tailwind CSS** - do stylowania elementów UI
- **TypeScript** - do typowania komponentów i danych

## 2. Komponenty do stworzenia/modyfikacji

### 2.1. Komponenty główne do modyfikacji
- `SwipeableRecommendationCard` - główny komponent karty z obsługą swipe'ów
- `SwipeableRecommendations` - komponent zarządzający stosem kart
- `RecommendationStack` - komponent wyświetlający stos kart rekomendacji
- `RecommendationSidebar` - istniejący komponent sidebaru zawierający rekomendacje (zgodnie z US-008)

### 2.2. Nowe komponenty
- `AnimationSettingsContext` - kontekst React do zarządzania ustawieniami animacji
- `EnhancedFeedbackIndicator` - rozszerzenie obecnych wskaźników LIKE/NOPE o animowane ikony
- `CardTransitionWrapper` - komponent do zarządzania animacjami przejścia między kartami

### 2.3. Komponenty istniejące do wykorzystania
- `TasteUpdateToast` - istniejący komponent toastu z animacją aktualizacji gustu, który może być wykorzystany jako wskaźnik potwierdzenia swipe

## 3. Główne kroki implementacji

### 3.1. Usprawnienie mechanizmu swipowania
1. Ujednolicenie mechanizmu swipowania w komponencie `SwipeableRecommendationCard`:
   - Zastąpienie obecnej mieszanej implementacji (natywne eventy + częściowo Framer Motion) w pełni komponentami `motion` z Framer Motion
   - Wykorzystanie istniejącej funkcjonalności drag z `RecommendationSidebar` jako wzorca
   - Dodanie zaawansowanych gestów z obsługą inercji i elastyczności
   - Utrzymanie i ulepszenie obecnej implementacji animacji obrotu podczas przeciągania

```typescript
// Przykładowa implementacja usprawnienia mechanizmu swipowania
// Bazując na obecnym kodzie w RecommendationSidebar
const SwipeableRecommendationCard = ({ item, type, onSwipe }) => {
  const [direction, setDirection] = useState(0);
  const [swiped, setSwiped] = useState(false);
  
  return (
    <motion.div
      className="card-container"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, info) => {
        const dragX = info.offset.x;
        if (dragX > 100) {
          setDirection(1);
          setSwiped(true);
          setTimeout(() => {
            onSwipe(item.id, "like", item.metadata || {});
          }, 200);
        } else if (dragX < -100) {
          setDirection(-1);
          setSwiped(true);
          setTimeout(() => {
            onSwipe(item.id, "dislike", item.metadata || {});
          }, 200);
        }
      }}
      animate={{
        x: direction === 0 ? 0 : direction > 0 ? 200 : -200,
        rotate: direction === 0 ? 0 : direction > 0 ? 30 : -30,
        opacity: direction === 0 ? 1 : 0,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
    >
      {/* Card content */}
    </motion.div>
  );
};
```

2. Poprawa obsługi gestów dotykowych i myszki:
   - Zapewnienie spójnej obsługi na różnych urządzeniach
   - Dodanie detektora prędkości przeciągania do płynniejszych animacji
   - Optymalizacja wydajności na słabszych urządzeniach (zgodnie z US-017)

### 3.2. Dodanie płynnych animacji wejścia i wyjścia kart
1. Implementacja animacji wejścia dla nowych kart:
   - Płynne pojawianie się z lekkim przesunięciem i skalowaniem
   - Efekt "wchodzenia" nowej karty na miejsce poprzedniej
   - Zapewnienie płynnego przejścia między kartami (zgodnie z US-017)

```typescript
// Przykładowy wariant animacji wejścia dla nowej karty
// Rozszerzenie obecnego kodu w SwipeableRecommendations
const cardVariants = {
  enter: { 
    scale: 0.8, 
    y: 50, 
    opacity: 0 
  },
  center: { 
    scale: 1, 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 300,
      damping: 25
    } 
  },
  exit: { 
    x: swipeDirection === "right" ? 400 : -400,
    opacity: 0,
    rotate: swipeDirection === "right" ? 30 : -30,
    transition: { 
      type: "spring", 
      stiffness: 300,
      damping: 20
    }
  }
};

return (
  <motion.div
    key={item.id}
    initial="enter"
    animate="center"
    exit="exit"
    variants={cardVariants}
  >
    {/* Card content */}
  </motion.div>
);
```

2. Implementacja animacji wyjścia dla odrzuconych kart:
   - Płynne animacje obrotu i przesunięcia zależne od kierunku swipe'a
   - Zmiana skali i przezroczystości dla dodatkowego efektu
   - Zapewnienie płynnego dokończenia ruchu w odpowiednim kierunku (zgodnie z US-017)

### 3.3. Rozszerzenie wizualnych wskaźników podczas swipowania
1. Ulepszenie wskaźników like/dislike:
   - Rozszerzenie obecnych wskaźników tekstowych "LIKE"/"NOPE" o animowane ikony
   - Zmiana koloru karty (zielone podświetlenie przy like, czerwone przy dislike)
   - Implementacja wyraźnych wskaźników wizualnych zgodnie z US-017

```typescript
// Przykładowa implementacja rozszerzonego wskaźnika feedback
// Bazując na istniejącym getFeedbackIndicatorStyles
const EnhancedFeedbackIndicator = ({ swipeState }) => {
  return (
    <div 
      className={getFeedbackIndicatorStyles(swipeState)}
      data-testid="feedback-indicator"
    >
      {swipeState === "swiping-right" && (
        <div className="flex items-center">
          <HeartIcon className="w-4 h-4 mr-1" />
          <span>LIKE</span>
        </div>
      )}
      {swipeState === "swiping-left" && (
        <div className="flex items-center">
          <XIcon className="w-4 h-4 mr-1" />
          <span>NOPE</span>
        </div>
      )}
    </div>
  );
};
```

2. Dodanie efektu tła podczas swipowania:
   - Gradientowe podświetlenie tła w zależności od kierunku swipe'a
   - Animowany border karty reagujący na kierunek i siłę przeciągnięcia

3. Integracja z istniejącym komponentem TasteUpdateToast:
   - Wykorzystanie istniejącego komponentu TasteUpdateToast do potwierdzania akcji swipe
   - Wykorzystanie animacji taste-update z global.css
   - Dostosowanie wyświetlania komunikatu "Twój gust został zaktualizowany" po wykonaniu swipe'a (zgodnie z US-013)

### 3.4. Implementacja ustawień dostępności
1. Stworzenie kontekstu dla ustawień animacji:
   - Opcja włączania/wyłączania animacji
   - Kontrola prędkości animacji dla użytkowników z zaburzeniami przedsionka

```typescript
// Przykładowa implementacja kontekstu animacji
import { createContext, useState, useContext } from "react";

type AnimationSettings = {
  animationsEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  reduceMotion: boolean;
};

const defaultSettings: AnimationSettings = {
  animationsEnabled: true,
  animationSpeed: 'normal',
  reduceMotion: false,
};

const AnimationSettingsContext = createContext<{
  settings: AnimationSettings;
  updateSettings: (settings: Partial<AnimationSettings>) => void;
}>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const AnimationSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  
  const updateSettings = (newSettings: Partial<AnimationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };
  
  return (
    <AnimationSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AnimationSettingsContext.Provider>
  );
};

export const useAnimationSettings = () => useContext(AnimationSettingsContext);
```

2. Implementacja komponentu ustawień animacji w profilu użytkownika:
   - Przełącznik włączania/wyłączania animacji
   - Opcje dostosowania prędkości animacji
   - Opcja redukcji ruchu dla większej dostępności

## 4. Integracja z systemem rekomendacji

### 4.1. Połączenie z algorytmem rekomendacji
1. Integracja z systemem opinii użytkownika:
   - Upewnienie się, że każdy swipe jest natychmiast zapisywany jako dane uczące (zgodnie z US-013)
   - Przesłanie metadanych o preferencjach użytkownika do systemu rekomendacji
   - Wykorzystanie istniejącej funkcji FeedbackService

2. Obsługa generowania nowych rekomendacji:
   - Po ocenieniu wszystkich rekomendacji, automatyczne generowanie nowych propozycji (zgodnie z US-008)
   - Wyświetlenie animowanego przejścia podczas ładowania nowych rekomendacji

### 4.2. Integracja z historią rekomendacji
1. Upewnienie się, że system swipe aktualizuje historię ocenionych rekomendacji:
   - Zapis polubionych/odrzuconych rekomendacji w historii (zgodnie z US-009)
   - Zapobieganie powtarzaniu się tych samych rekomendacji (zgodnie z US-012)
   - Wykorzystanie istniejącej funkcji UniqueRecommendationsService

## 5. Optymalizacja wydajności

### 5.1. Optymalizacja renderowania
1. Zastosowanie technik memorizacji dla komponentów kart:
   - Użycie `React.memo` dla komponentów kart rekomendacji
   - Wdrożenie `useMemo` dla złożonych obliczeń animacji

```typescript
export const SwipeableRecommendationCard = React.memo(({ 
  item, 
  type, 
  onSwipe 
}: SwipeableRecommendationCardProps) => {
  // Implementacja komponentu
});
```

2. Optymalizacja śledzenia gestów:
   - Implementacja debounce'owania dla zdarzeń dotykowych
   - Ograniczenie liczby przeliczanych klatek animacji

### 5.2. Optymalizacja animacji
1. Użycie efektywnych właściwości CSS do animacji:
   - Preferowanie `transform` i `opacity` zamiast właściwości powodujących reflow
   - Zastosowanie `will-change` dla elementów z animacją
   - Zapewnienie płynności nawet na słabszych urządzeniach (zgodnie z US-017)

2. Implementacja mechanizmu recyklingu kart:
   - Ograniczenie liczby jednocześnie renderowanych kart
   - Ponowne wykorzystanie elementów DOM dla kart

```typescript
// Przykładowa implementacja ograniczenia renderowanych kart
// Bazując na istniejącej implementacji w SwipeableRecommendations
const visibleCards = useMemo(() => {
  return items.slice(
    Math.max(0, currentIndex - 1), 
    Math.min(items.length, currentIndex + 3)
  );
}, [items, currentIndex]);
```

## 6. Testy i zapewnienie jakości

### 6.1. Testy jednostkowe
1. Rozszerzenie istniejących testów komponentów animacyjnych:
   - Testy jednostkowe dla logiki animacji
   - Sprawdzenie poprawnego działania gestów

```typescript
// Przykładowy test jednostkowy
test('powinien wywołać onSwipe z właściwym feedbackiem przy przeciągnięciu', async () => {
  const onSwipeMock = jest.fn();
  render(<SwipeableRecommendationCard item={mockItem} onSwipe={onSwipeMock} />);
  
  // Symulacja gestu swipe
  const card = screen.getByTestId('swipe-card');
  fireEvent.mouseDown(card, { clientX: 100, clientY: 100 });
  fireEvent.mouseMove(document, { clientX: 300, clientY: 100 });
  fireEvent.mouseUp(document);
  
  // Sprawdzenie rezultatu
  expect(onSwipeMock).toHaveBeenCalledWith(
    mockItem.id, 
    'like',
    expect.any(Object)
  );
});
```

2. Testy integracyjne systemu rekomendacji:
   - Sprawdzenie interakcji pomiędzy komponentami
   - Testy interakcji użytkownika z systemem rekomendacji
   - Weryfikacja interakcji między animacjami a algorytmem uczącym (zgodnie z US-013 i US-014)

### 6.2. Testy end-to-end
1. Scenariusze testowe w Playwright:
   - Testowanie pełnych scenariuszy interakcji z kartami
   - Sprawdzanie płynności animacji na różnych urządzeniach
   - Weryfikacja spójności animacji z ogólnym stylem wizualnym aplikacji (zgodnie z US-017)

2. Testy wydajnościowe:
   - Pomiar FPS podczas animacji
   - Sprawdzenie obciążenia CPU/GPU na słabszych urządzeniach

### 6.3. Testy dostępności
1. Testowanie zgodności z WCAG:
   - Sprawdzenie, czy funkcjonalność jest dostępna bez animacji
   - Testy z użytkownikami korzystającymi z czytników ekranu

2. Testy preferencji redukcji ruchu:
   - Sprawdzenie działania aplikacji z włączoną preferencją `prefers-reduced-motion`
   - Weryfikacja, czy ustawienia dostępności animacji działają poprawnie

## 7. Integracja z funkcjonalnościami z PRD

### 7.1. Wsparcie dla zablokowania wyboru muzyki (US-016)
1. Zapewnienie zgodności animacji kart rekomendacji z mechanizmem blokowania muzyki:
   - Dostosowanie wyglądu kart rekomendacji w zależności od wartości zmiennej `isMusicEnabled`
   - Obsługa specjalnego wyglądu dla kart tylko z filmami, gdy muzyka jest zablokowana

### 7.2. Wsparcie dla adaptacyjnego systemu rekomendacji (US-013)
1. Dodanie wizualnych wskaźników podczas aktualizacji preferencji:
   - Wykorzystanie komponentu TasteUpdateToast do wyświetlenia animacji potwierdzającej zapisanie interakcji użytkownika
   - Zapewnienie komunikatu zwrotnego "Twój gust został zaktualizowany"

### 7.3. Integracja z metadanymi rekomendacji (US-014)
1. Wyświetlanie powodów rekomendacji:
   - Animowane wyświetlanie powodu rekomendacji (np. "polecane, ponieważ lubisz reżysera X")
   - Zapewnienie płynnego przejścia przy pokazywaniu szczegółów metadanych

## 8. Dodatkowe uwagi

### 8.1. Rozszerzenia funkcjonalności
1. Dodanie różnych styli animacji:
   - Możliwość wyboru różnych stylów animacji (np. slide, fade, flip)
   - Animacje tematyczne zależne od typu rekomendacji (muzyka/film)

2. Implementacja haptic feedback na urządzeniach mobilnych:
   - Dodanie delikatnych wibracji przy swipowaniu
   - Różne wzorce wibracji dla like/dislike

### 8.2. Integracja z systemem preferencji
1. Zapisywanie preferencji animacji:
   - Przechowywanie ustawień animacji w profilu użytkownika
   - Synchronizacja ustawień między urządzeniami

2. Adaptacja stylu animacji do ogólnego motywu aplikacji:
   - Spójność z wybranym motywem kolorystycznym
   - Dostosowanie do trybu jasnego/ciemnego 