import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Ładuj zmienne środowiskowe z pliku .env.test na początku
const envPath = path.resolve(process.cwd(), ".env.test");
dotenv.config({ path: envPath });

/**
 * WAŻNE: Zmienne środowiskowe używane do połączenia z Supabase powinny być przechowywane
 * wyłącznie w plikach .env.test, które są ignorowane przez system kontroli wersji.
 * Nigdy nie umieszczaj wrażliwych danych bezpośrednio w kodzie ani w skryptach package.json.
 */

// Wypisz informacje diagnostyczne o ścieżce do pliku .env.test
console.log(`Ładowanie zmiennych środowiskowych z pliku: ${envPath}`);

// Sprawdź, czy plik .env.test istnieje
if (fs.existsSync(envPath)) {
  console.log(`Plik .env.test istnieje.`);
} else {
  console.log(`Plik .env.test nie istnieje w lokalizacji: ${envPath}`);
}

export default async () => {
  console.log("Starting global teardown...");

  try {
    // Walidacja zmiennych środowiskowych
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      // Załaduj ponownie zmienne środowiskowe
      dotenv.config({ path: envPath, override: true });
    }

    // Pobierz zmienne środowiskowe
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    // Wypisz dostępne zmienne środowiskowe (bez wartości, dla bezpieczeństwa)
    console.log("Dostępne zmienne środowiskowe:");
    console.log(`SUPABASE_URL dostępny: ${!!supabaseUrl}`);
    console.log(`SUPABASE_KEY dostępny: ${!!supabaseKey}`);

    // Sprawdź czy zmienne są dostępne
    if (!supabaseUrl || !supabaseKey) {
      console.error("Brak poświadczeń Supabase w zmiennych środowiskowych. Sprawdź zawartość pliku .env.test");
      console.error("Upewnij się, że plik .env.test zawiera poprawne wartości SUPABASE_URL i SUPABASE_KEY");
      return;
    }

    // Dodatkowa weryfikacja URL
    try {
      // Sprawdźmy, czy URL jest poprawny
      const url = new URL(supabaseUrl);
      console.log(`URL Supabase zweryfikowany jako poprawny: ${url.origin}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(`URL Supabase jest niepoprawny: ${errorMessage}`);
      return;
    }

    // Utwórz klienta Supabase
    console.log("Próba utworzenia klienta Supabase");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Najpierw sprawdzamy, ile rekordów jest w tabeli przed czyszczeniem
    console.log("Sprawdzanie liczby rekordów w tabeli item_feedback przed czyszczeniem...");
    try {
      const { data: records, error: countError } = await supabase.from("item_feedback").select("*", { count: "exact" });

      if (countError) {
        console.error("Error checking item_feedback records:", countError);
      } else {
        const recordCount = records?.length || 0;
        console.log(`Znaleziono ${recordCount} rekordów do usunięcia z tabeli item_feedback`);

        if (recordCount > 0) {
          console.log("To oznacza, że testy e2e skutecznie zapisywały dane w bazie Supabase!");
          // Zamiast pokazywać rekordy, co mogłoby ujawnić wrażliwe dane, tylko informujemy o ich liczbie
          console.log(`Liczba rekordów do usunięcia: ${recordCount}`);
        } else {
          console.log("Nie znaleziono rekordów - sprawdź czy testy e2e działają poprawnie.");
        }
      }
    } catch (queryError) {
      console.error("Błąd podczas zapytania do bazy danych:", queryError);
    }

    console.log("Cleaning up item_feedback table...");

    // Delete records from the item_feedback table
    try {
      const { error } = await supabase.from("item_feedback").delete().neq("id", 0); // This will delete all records

      if (error) {
        console.error("Error cleaning up item_feedback table:", error);
      } else {
        console.log("Successfully cleaned up item_feedback table");

        // Sprawdzamy czy rzeczywiście wszystkie rekordy zostały usunięte
        const { data: remainingRecords, error: verifyError } = await supabase
          .from("item_feedback")
          .select("*", { count: "exact" });

        if (verifyError) {
          console.error("Error verifying cleanup:", verifyError);
        } else {
          const remainingCount = remainingRecords?.length || 0;
          console.log(`Po wyczyszczeniu pozostało ${remainingCount} rekordów`);
        }
      }
    } catch (deleteError) {
      console.error("Błąd podczas usuwania rekordów:", deleteError);
    }
  } catch (error) {
    console.error("Error in global teardown:", error);
  } finally {
    console.log("Global teardown complete");
  }
};
