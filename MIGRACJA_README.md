# Instrukcja dodania kolumn genre i artist do tabeli item_feedback

## Opis problemu

W aplikacji getTaste tabela `item_feedback` wymaga kolumn `genre` i `artist` dla poprawnego działania funkcjonalności rekomendacji. Te kolumny są potrzebne do zapisywania metadanych związanych z polubieniami użytkownika, co pozwoli algorytmowi rekomendacji lepiej dostosować propozycje.

## Przygotowane pliki

W repozytorium znajdziesz następujące pliki związane z migracją:

1. `supabase/migrations/20250511000100_add_item_feedback_columns.sql` - plik migracji Supabase
2. `manual_migration.sql` - plik SQL do ręcznego wykonania w panelu Supabase
3. `MIGRACJA_README.md` - ten plik z instrukcjami

## Jak zastosować migrację

### Sposób 1: Przez panel Supabase Studio (zalecany)

1. Otwórz panel Supabase Studio (zwykle dostępny pod adresem https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do sekcji "SQL Editor" / "Edytor SQL"
4. Utwórz nowe zapytanie i wklej zawartość pliku `manual_migration.sql`
5. Uruchom zapytanie klikając przycisk "Run" / "Uruchom"
6. Sprawdź wyniki zapytania, aby upewnić się, że kolumny zostały dodane
7. Przejdź do sekcji "Table Editor" i wybierz tabelę `item_feedback` - powinieneś zobaczyć nowe kolumny

### Sposób 2: Przez Supabase CLI (w środowisku deweloperskim)

Jeśli korzystasz z lokalnego środowiska Supabase, możesz zastosować migrację za pomocą CLI:

```bash
# Upewnij się, że jesteś w głównym katalogu projektu
cd getTaste

# Zastosuj migrację
npx supabase migration up
```

### Sposób 3: Przy wdrożeniu na produkcję

Jeśli wdrażasz na produkcję, migracja zostanie automatycznie uwzględniona w ramach procesu wdrożenia, ponieważ znajduje się w katalogu `supabase/migrations`.

## Po migracji

Po zastosowaniu migracji należy:

1. Zrestartować aplikację, aby zmiany zostały uwzględnione.
2. Sprawdzić, czy funkcjonalność zapisywania ocen działa poprawnie (swipe right/left).

## Weryfikacja

Aby zweryfikować, czy migracja została poprawnie zastosowana, możesz wykonać następujące zapytanie w SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'item_feedback'
AND column_name IN ('genre', 'artist');
```

Powinno ono zwrócić dwa wiersze, po jednym dla każdej kolumny.

## Rozwiązywanie problemów

Jeśli po zastosowaniu migracji nadal występuje błąd:

```
Could not find the 'artist' column of 'item_feedback' in the schema cache
```

Wykonaj ponownie polecenie odświeżenia cache schematu:

```sql
NOTIFY pgrst, 'reload schema';
```

Jeśli problem nadal występuje, zrestartuj serwis Supabase (w przypadku lokalnego środowiska) lub skontaktuj się z administratorem bazy danych.
