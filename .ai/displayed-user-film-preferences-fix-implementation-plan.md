# Plan implementacji wyświetlania ulubionych gatunków filmowych

## Proponowane rozwiązanie

Na podstawie analizy kodu źródłowego aplikacji getTaste zidentyfikowałem, że system już posiada funkcjonalność generowania ulubionych gatunków filmowych na podstawie polubień użytkownika, jednak występują pewne problemy z prezentacją tych danych. Proponuję ujednolicenie i optymalizację mechanizmu wyświetlania ulubionych gatunków poprzez udoskonalenie komponentu `FavoriteFilmGenres`, który będzie prezentował uporządkowane gatunki filmowe bazując **wyłącznie** na danych z endpointu `api/users/[id]/preferences/genres`, który pobiera faktyczne polubienia użytkownika z bazy danych.

> **WAŻNE:** Rozwiązanie nie może korzystać z żadnych mocków ani zahardcodowanych danych. Wszystkie preferencje gatunkowe muszą być generowane dynamicznie na podstawie rzeczywistych polubień użytkownika zarejestrowanych w bazie danych.

## Kroki implementacji

1. **Usunięcie wszystkich mocków i zahardcodowanych danych**:
   - Zidentyfikować i usunąć wszelkie zahardcodowane listy gatunków w komponentach UI
   - Wyeliminować domyślne/fallbackowe gatunki w `UserService` i zastąpić je dynamicznym pozyskiwaniem danych
   - Upewnić się, że w przypadku braku danych wyświetlany jest adekwatny komunikat dla użytkownika, zamiast podstawiania sztucznych danych

2. **Usprawnienie algorytmu analizy gatunków w UserService**:
   - Zoptymalizować metodę `refreshUserPreferencesFromFeedback` w klasie `UserService`, aby dokładniej wykrywała i klasyfikowała gatunki filmowe **wyłącznie na podstawie danych z bazy**
   - Poprawić sortowanie gatunków według częstotliwości występowania (gatunki z największą liczbą rzeczywistych polubień powinny być na początku listy)
   - Dodać mechanizm dostosowania wag dla gatunków, które rzadziej występują w polubieniach, bazując wyłącznie na rzeczywistych danych użytkownika

3. **Ujednolicenie obsługi struktury danych dla gatunków**:
   - Zapewnić spójny format danych zwracanych przez endpoint `api/users/[id]/preferences/genres`, zawsze bazując na aktualnych danych z bazy
   - Zagwarantować, że wszystkie gatunki filmowe mają prawidłowo obliczone wartości `count` i `weight` na podstawie rzeczywistych polubień
   - Zachować zgodność z interfejsem `MetadataItem` zdefiniowanym w `src/types/recommendations.ts`

4. **Rozszerzenie komponentu FavoriteFilmGenres**:
   - Dodać wskaźnik popularności dla każdego gatunku (np. wizualizacja wagi za pomocą intensywności koloru) oparty o rzeczywiste dane
   - Implementacja mechanizmu cache'owania wyników z React Query dla lepszej wydajności, z odpowiednim czasem ważności cache, aby odzwierciedlać zmiany w preferencjach
   - Dodać obsługę przypadku, gdy użytkownik nie ma jeszcze żadnych polubionych filmów (pusty stan z informacją zachęcającą do oznaczania filmów)

5. **Zapewnienie spójności z resztą interfejsu**:
   - Upewnić się, że styl komponentu jest zgodny z designem aplikacji (Tailwind, Shadcn/ui)
   - Zapewnić responsywność komponentu dla różnych rozmiarów ekranu
   - Zachować dostępność interfejsu (a11y) dla wszystkich użytkowników

6. **Dodanie mechanizmu odświeżania preferencji**:
   - Zaimplementować przycisk umożliwiający ręczne odświeżenie preferencji, który wymusza pobranie aktualnych danych z bazy
   - Dodać automatyczne odświeżanie preferencji po dodaniu nowych polubień
   - Zapewnić właściwe zarządzanie stanem ładowania podczas odświeżania danych

## Potencjalne wyzwania i ich rozwiązania

1. **Brak danych o gatunkach dla niektórych filmów**:
   - Rozwiązanie: Wyświetlenie informacji o braku danych i zachęcenie użytkownika do polubienia większej liczby filmów
   - Implementacja mechanizmu wzbogacania danych, który pobierze brakujące informacje o gatunkach z zewnętrznych API (np. TMDB, OMDB)
   - **Unikać** stosowania zahardcodowanych domyślnych gatunków - lepiej pokazać brak danych niż wprowadzać użytkownika w błąd

2. **Problemy z wydajnością przy dużej liczbie polubionych filmów**:
   - Rozwiązanie: Implementacja paginacji lub wirtualizacji dla listy ulubionych gatunków
   - Optymalizacja zapytań do bazy danych poprzez dodanie odpowiednich indeksów
   - Zastosowanie technik cache'owania wyników na różnych poziomach aplikacji (React Query, HTTP Cache), ale z odpowiednim mechanizmem invalidacji cache

3. **Niespójne dane pomiędzy różnymi komponentami**:
   - Rozwiązanie: Implementacja centralnego store'a dla preferencji użytkownika, który zawsze będzie pobierał dane z bazy
   - Ujednolicenie formatów danych we wszystkich komponentach wyświetlających preferencje filmowe
   - Automatyczna synchronizacja stanu pomiędzy różnymi widokami aplikacji

4. **Problemy z aktualizacją preferencji po zmianie polubień**:
   - Rozwiązanie: Mechanizm invalidacji cache React Query po akcji polubienia/odlubienia filmu
   - Implementacja webhooków lub systemu eventów do propagacji zmian w preferencjach
   - Dodanie możliwości manualnego odświeżenia preferencji przez użytkownika, które wymusza nowe zapytanie do bazy danych

5. **Brak uprawnień do aktualizacji preferencji**:
   - Rozwiązanie: Prawidłowa konfiguracja RLS w Supabase, aby użytkownik miał dostęp tylko do własnych danych
   - Wykorzystanie administratorskiego klienta Supabase dla operacji wymagających specjalnych uprawnień
   - Jasne komunikaty o błędach dla użytkownika w przypadku problemów z uprawnieniami

## Testowanie

1. **Scenariusze testowe**:
   - Użytkownik bez polubionych filmów powinien widzieć pusty stan z odpowiednim komunikatem
   - Użytkownik z polubionymi filmami powinien widzieć listę gatunków posortowaną według popularności
   - Dodanie nowego polubienia powinno automatycznie aktualizować listę gatunków po odświeżeniu
   - Usunięcie polubienia powinno aktualizować listę gatunków po odświeżeniu

2. **Testy integracyjne**:
   - Sprawdzenie, czy dane pobierane z bazy są prawidłowo przekształcane i wyświetlane
   - Weryfikacja, czy nie są używane żadne zahardcodowane dane w całym przepływie
   - Potwierdzenie, że komponent reaguje poprawnie na zmiany w danych polubień 