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

// Sprawdź, czy plik .env.test istnieje
if (fs.existsSync(envPath)) {
  // File exists, continue with normal execution
} else {
  // File doesn't exist but we'll continue with environment variables
  // that might be set elsewhere (e.g. CI environment)
}

export default async () => {
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

    // Sprawdź czy zmienne są dostępne
    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Brak poświadczeń Supabase w zmiennych środowiskowych. Sprawdź zawartość pliku .env.test"
      );
      console.error(
        "Upewnij się, że plik .env.test zawiera poprawne wartości SUPABASE_URL i SUPABASE_KEY"
      );
      return;
    }

    // Dodatkowa weryfikacja URL
    try {
      // Sprawdźmy, czy URL jest poprawny
      // URL is validated by trying to construct a URL object
      new URL(supabaseUrl);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(`URL Supabase jest niepoprawny: ${errorMessage}`);
      return;
    }

    // Utwórz klienta Supabase

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Najpierw sprawdzamy, ile rekordów jest w tabeli przed czyszczeniem

    try {
      const { data: records, error: countError } = await supabase
        .from("item_feedback")
        .select("*", { count: "exact" });

      if (countError) {
        console.error("Error checking item_feedback records:", countError);
      } else {
        const recordCount = records?.length || 0;

        if (recordCount > 0) {
          // Zamiast pokazywać rekordy, co mogłoby ujawnić wrażliwe dane, tylko informujemy o ich liczbie
          // Found records to clean up
        } else {
          // No records found, nothing to clean up
        }
      }
    } catch (queryError) {
      console.error("Błąd podczas zapytania do bazy danych:", queryError);
    }

    // Delete records from the item_feedback table
    try {
      const { error } = await supabase.from("item_feedback").delete().neq("id", 0); // This will delete all records

      if (error) {
        console.error("Error cleaning up item_feedback table:", error);
      } else {
        // Sprawdzamy czy rzeczywiście wszystkie rekordy zostały usunięte
        const { error: verifyError } = await supabase
          .from("item_feedback")
          .select("*", { count: "exact" });

        if (verifyError) {
          console.error("Error verifying cleanup:", verifyError);
        } else {
          // Uncomment if you need to verify or log the count
          // const remainingCount = remainingRecords?.length || 0;
        }
      }
    } catch (deleteError) {
      console.error("Błąd podczas usuwania rekordów:", deleteError);
    }
  } catch (error) {
    console.error("Error in global teardown:", error);
  } finally {
    // Cleanup complete - no additional actions needed
  }
};
