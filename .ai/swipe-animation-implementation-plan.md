# Plan Implementacji Animacji Swipe dla Kart Rekomendacji

## 1. Przegląd techniczny

Implementacja płynnych animacji swipowania kart rekomendacji będzie oparta na bibliotece Framer Motion, która jest już zainstalowana w projekcie. Aktualnie w aplikacji istnieją komponenty `SwipeableRecommendationCard` oraz `SwipeableRecommendations`, które stanowią dobrą podstawę do rozbudowy funkcjonalności animacji. Kluczowe usprawnienia skupią się na poprawie płynności animacji, dodaniu efektów wizualnych podczas przeciągania oraz zapewnieniu opcji dostępności.

### Kluczowe technologie
- **Framer Motion** - biblioteka do tworzenia płynnych animacji w React
- **React** - framework frontendowy aplikacji
- **Tailwind CSS** - do stylowania elementów UI
- **TypeScript** - do typowania komponentów i danych

## 2. Komponenty do stworzenia/modyfikacji

### 2.1. Komponenty główne do modyfikacji
- `SwipeableRecommendationCard` - główny komponent karty z obsługą swipe'ów
- `SwipeableRecommendations` - komponent zarządzający stosem kart
- `RecommendationStack` - komponent wyświetlający stos kart rekomendacji

### 2.2. Nowe komponenty
- `AnimationSettingsContext` - kontekst React do zarządzania ustawieniami animacji
- `AnimatedFeedbackIndicator` - komponent z animowanymi wskaźnikami like/dislike
- `CardTransition` - komponent do zarządzania animacjami przejścia między kartami

## 3. Główne kroki implementacji

### 3.1. Usprawnienie mechanizmu swipowania
1. Przeprojektowanie mechanizmu swipowania w komponencie `SwipeableRecommendationCard`:
   - Zastąpienie obecnej implementacji ręcznego śledzenia przeciągnięć komponentami `motion` z Framer Motion
   - Dodanie zaawansowanych gestów z obsługą inercji i elastyczności

```typescript
// Przykładowa implementacja usprawnienia mechanizmu swipowania
const x = useMotionValue(0);
const y = useMotionValue(0);
const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30]);
const opacity = useTransform(
  x, 
  [-300, -200, 0, 200, 300], 
  [0, 1, 1, 1, 0]
);

// Dodanie wizualnych wskaźników podczas przeciągania
const likeOpacity = useTransform(
  x, 
  [0, 50, 100], 
  [0, 0.5, 1]
);
const dislikeOpacity = useTransform(
  x, 
  [-100, -50, 0], 
  [1, 0.5, 0]
);
```

2. Poprawa obsługi gestów dotykowych i myszki:
   - Zwiększenie responsywności na urządzeniach mobilnych
   - Dodanie detektora prędkości przeciągania do płynniejszych animacji

### 3.2. Dodanie płynnych animacji wejścia i wyjścia kart
1. Implementacja animacji wejścia dla nowych kart:
   - Płynne pojawianie się z lekkim przesunięciem i skalowaniem
   - Efekt "wchodzenia" nowej karty na miejsce poprzedniej

```typescript
// Przykładowy wariant animacji wejścia dla nowej karty
const enterVariants = {
  initial: { scale: 0.8, y: 50, opacity: 0 },
  animate: { 
    scale: 1, 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 300,
      damping: 25,
      mass: 0.8
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
```

2. Implementacja animacji wyjścia dla odrzuconych kart:
   - Płynne animacje obrotu i przesunięcia zależne od kierunku swipe'a
   - Zmiana skali i przezroczystości dla dodatkowego efektu

### 3.3. Wizualne wskaźniki podczas swipowania
1. Dodanie dynamicznych wskaźników like/dislike:
   - Animowane ikony "serce" i "krzyżyk" wyświetlane odpowiednio podczas przeciągania
   - Zmiana koloru karty (zielone podświetlenie przy like, czerwone przy dislike)

```typescript
// Przykładowa implementacja komponentu wskaźnika feedback
const AnimatedFeedbackIndicator = ({ x }) => {
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);
  
  return (
    <>
      <motion.div 
        className="absolute top-2 right-4 bg-green-500 text-white rounded-full p-2"
        style={{ opacity: likeOpacity }}
      >
        <HeartIcon className="w-6 h-6" />
      </motion.div>
      
      <motion.div 
        className="absolute top-2 left-4 bg-red-500 text-white rounded-full p-2"
        style={{ opacity: dislikeOpacity }}
      >
        <XIcon className="w-6 h-6" />
      </motion.div>
    </>
  );
};
```

2. Dodanie efektu tła podczas swipowania:
   - Gradientowe podświetlenie tła w zależności od kierunku swipe'a
   - Animowany border karty reagujący na kierunek i siłę przeciągnięcia

### 3.4. Implementacja ustawień dostępności
1. Stworzenie kontekstu dla ustawień animacji:
   - Opcja włączania/wyłączania animacji
   - Kontrola prędkości animacji dla użytkowników z zaburzeniami przedsionka

```typescript
// Przykładowa implementacja kontekstu animacji
type AnimationSettings = {
  animationsEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  reduceMotion: boolean;
};

const AnimationSettingsContext = createContext<{
  settings: AnimationSettings;
  updateSettings: (settings: Partial<AnimationSettings>) => void;
}>({
  settings: {
    animationsEnabled: true,
    animationSpeed: 'normal',
    reduceMotion: false,
  },
  updateSettings: () => {},
});
```

2. Implementacja komponentu ustawień animacji w profilu użytkownika:
   - Przełącznik włączania/wyłączania animacji
   - Opcje dostosowania prędkości animacji
   - Opcja redukcji ruchu dla większej dostępności

## 4. Optymalizacja wydajności

### 4.1. Optymalizacja renderowania
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

### 4.2. Optymalizacja animacji
1. Użycie efektywnych właściwości CSS do animacji:
   - Preferowanie `transform` i `opacity` zamiast właściwości powodujących reflow
   - Zastosowanie `will-change` dla elementów z animacją

2. Implementacja mechanizmu recyklingu kart:
   - Ograniczenie liczby jednocześnie renderowanych kart
   - Ponowne wykorzystanie elementów DOM dla kart

```typescript
// Przykładowa implementacja ograniczenia renderowanych kart
const visibleCards = useMemo(() => {
  return items.slice(
    Math.max(0, currentIndex - 1), 
    Math.min(items.length, currentIndex + 3)
  );
}, [items, currentIndex]);
```

## 5. Testy i zapewnienie jakości

### 5.1. Testy jednostkowe
1. Testowanie komponentów animacyjnych:
   - Testy jednostkowe dla logiki animacji
   - Sprawdzenie poprawnego działania gestów

```typescript
// Przykładowy test jednostkowy
test('powinien wywołać onSwipe z właściwym feedbackiem przy przeciągnięciu', async () => {
  const onSwipeMock = jest.fn();
  render(<SwipeableRecommendationCard item={mockItem} onSwipe={onSwipeMock} />);
  
  // Symulacja gestu swipe
  const card = screen.getByTestId('swipe-card');
  await userEvent.click(card);
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

### 5.2. Testy end-to-end
1. Scenariusze testowe w Playwright:
   - Testowanie pełnych scenariuszy interakcji z kartami
   - Sprawdzanie płynności animacji na różnych urządzeniach

2. Testy wydajnościowe:
   - Pomiar FPS podczas animacji
   - Sprawdzenie obciążenia CPU/GPU na słabszych urządzeniach

### 5.3. Testy dostępności
1. Testowanie zgodności z WCAG:
   - Sprawdzenie, czy funkcjonalność jest dostępna bez animacji
   - Testy z użytkownikami korzystającymi z czytników ekranu

2. Testy preferencji redukcji ruchu:
   - Sprawdzenie działania aplikacji z włączoną preferencją `prefers-reduced-motion`
   - Weryfikacja, czy ustawienia dostępności animacji działają poprawnie

## 6. Dodatkowe uwagi

### 6.1. Rozszerzenia funkcjonalności
1. Dodanie różnych styli animacji:
   - Możliwość wyboru różnych stylów animacji (np. slide, fade, flip)
   - Animacje tematyczne zależne od typu rekomendacji (muzyka/film)

2. Implementacja haptic feedback na urządzeniach mobilnych:
   - Dodanie delikatnych wibracji przy swipowaniu
   - Różne wzorce wibracji dla like/dislike

### 6.2. Integracja z systemem preferencji
1. Zapisywanie preferencji animacji:
   - Przechowywanie ustawień animacji w profilu użytkownika
   - Synchronizacja ustawień między urządzeniami

2. Adaptacja stylu animacji do ogólnego motywu aplikacji:
   - Spójność z wybranym motywem kolorystycznym
   - Dostosowanie do trybu jasnego/ciemnego 