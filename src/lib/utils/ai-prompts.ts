/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Zbiór promptów używanych do interakcji z modelami OpenRouter.ai
 * w systemie rekomendacji getTaste.
 */

export const getAiPrompts = () => {
  return {
    /**
     * Prompt do generowania rekomendacji muzycznych lub filmowych.
     */
    generateRecommendations: (
      preferences: Record<string, unknown>,
      feedbackHistory: Record<string, unknown>[],
      type: "music" | "film"
    ): string => {
      return `
        Jesteś ekspertem w znajdowaniu dopasowanych ${type === "music" ? "utworów muzycznych" : "filmów"} 
        dla użytkowników na podstawie ich preferencji.
        
        Preferencje użytkownika:
        ${JSON.stringify(preferences, null, 2)}
        
        Historia feedbacku użytkownika (ostatnie interakcje):
        ${JSON.stringify(feedbackHistory, null, 2)}
        
        Zadanie:
        Wygeneruj listę 5-10 ${type === "music" ? "utworów/albumów muzycznych" : "filmów"}, 
        które najprawdopodobniej spodobają się temu użytkownikowi. Zwróć szczególną uwagę na:
        
        1. Wzorce w lubianej zawartości (gatunki, wykonawcy, reżyserzy itp.)
        2. Cechy wspólne pozytywnie ocenianych pozycji
        3. Cechy zawartości, którą użytkownik ocenił negatywnie (aby ich unikać)
        4. Balans między podobnymi pozycjami a nowymi odkryciami
        
        Dla każdej rekomendacji podaj:
        - Unikalny identyfikator
        - Nazwę
        - Typ (${type === "music" ? "album/artysta/utwór" : "film/serial"})
        - Szczegóły (metadane: gatunki, ${type === "music" ? "wykonawcy, rok wydania" : "reżyser, obsada, rok produkcji"})
        
        Zwróć dane w formacie JSON.
      `;
    },

    /**
     * Prompt do analizy wzorców preferencji użytkownika.
     */
    analyzeUserPatterns: (
      feedbackHistory: Record<string, unknown>[],
      type: "music" | "film"
    ): string => {
      return `
        Przeanalizuj historię feedbacku użytkownika dotyczącą ${type === "music" ? "muzyki" : "filmów"} 
        i zidentyfikuj wzorce w jego preferencjach.
        
        Historia feedbacku:
        ${JSON.stringify(feedbackHistory, null, 2)}
        
        Zadanie:
        Zidentyfikuj i wyjaśnij wzorce w preferencjach użytkownika, zwracając szczególną uwagę na:
        
        1. Najczęściej lubiane gatunki
        2. Cechy wspólne lubianych ${type === "music" ? "artystów/utworów" : "filmów"}
        3. Cechy, których użytkownik konsekwentnie unika
        4. Zmiany w preferencjach w czasie (jeśli widoczne)
        
        Zwróć analizę w formacie JSON zawierającą:
        - Lista preferowanych gatunków w kolejności popularności
        - Lista preferowanych cech i ich wartości z poziomem pewności (0-1)
        - Lista unikanych cech i ich wartości z poziomem pewności (0-1)
        - Zauważalne trendy w preferencjach użytkownika
        - Rekomendowane ulepszenia dla przyszłych propozycji
      `;
    },

    /**
     * Prompt do aktualizacji profilu preferencji na podstawie feedbacku.
     */
    updatePreferencesFromFeedback: (
      currentPreferences: Record<string, unknown>,
      recentFeedback: Record<string, unknown>[],
      type: "music" | "film"
    ): string => {
      return `
        Zaktualizuj profil preferencji użytkownika na podstawie ostatniego feedbacku.
        
        Aktualne preferencje:
        ${JSON.stringify(currentPreferences, null, 2)}
        
        Ostatni feedback (najpierw najnowszy):
        ${JSON.stringify(recentFeedback, null, 2)}
        
        Zadanie:
        Zaktualizuj profil preferencji użytkownika, uwzględniając ostatni feedback. Zwróć uwagę na:
        1. Zachowanie istniejących silnych preferencji, o ile nie zostały zaprzeczone przez nowy feedback
        2. Dodanie nowych preferencji wynikających z pozytywnego feedbacku
        3. Usunięcie lub obniżenie wagi preferencji sprzecznych z negatywnym feedbackiem
        4. Aktualizację miar pewności dla każdej preferencji
        
        Zwróć zaktualizowany profil preferencji w formacie JSON.
      `;
    },

    /**
     * Prompt do generowania uzasadnienia dla rekomendacji.
     */
    generateRecommendationExplanation: (
      recommendation: Record<string, unknown>,
      userPreferences: Record<string, unknown>,
      type: "music" | "film"
    ): string => {
      return `
        Wygeneruj krótkie, personalizowane uzasadnienie dlaczego ta rekomendacja pasuje do użytkownika.
        
        Rekomendacja:
        ${JSON.stringify(recommendation, null, 2)}
        
        Preferencje użytkownika:
        ${JSON.stringify(userPreferences, null, 2)}
        
        Zadanie:
        Napisz krótkie (1-2 zdania) uzasadnienie, dlaczego ta ${type === "music" ? "muzyka" : "film"} 
        powinna spodobać się użytkownikowi, bazując na jego preferencjach. 
        Uzasadnienie powinno być konkretne i odnosić się do specyficznych cech rekomendacji 
        oraz preferencji użytkownika.
      `;
    },

    /**
     * Prompt do wyboru następnej najlepszej rekomendacji.
     */
    selectNextBestRecommendation: (
      remainingRecommendations: Record<string, unknown>[],
      userFeedback: Record<string, unknown>[],
      type: "music" | "film"
    ): string => {
      return `
        Wybierz najlepszą kolejną rekomendację na podstawie dotychczasowego feedbacku użytkownika.
        
        Pozostałe rekomendacje:
        ${JSON.stringify(remainingRecommendations, null, 2)}
        
        Dotychczasowy feedback:
        ${JSON.stringify(userFeedback, null, 2)}
        
        Zadanie:
        Przeanalzuj dotychczasowy feedback i wybierz rekomendację, która najprawdopodobniej spodoba się
        użytkownikowi jako następna. Weź pod uwagę:
        1. Wzorce pozytywnych i negatywnych reakcji
        2. Różnorodność rekomendacji (unikaj pokazywania podobnych treści pod rząd)
        3. Stopniowe poznawanie gustu użytkownika (eksploracja vs eksploatacja)
        
        Zwróć indeks wybranej rekomendacji oraz krótkie uzasadnienie wyboru.
      `;
    },
  };
};

/**
 * Zwraca przykładowy systemowy prompt określający rolę AI w generowaniu rekomendacji.
 */
export const getSystemPrompts = () => {
  return {
    recommendationGenerator: (type: "music" | "film"): string => {
      return `Jesteś zaawansowanym systemem rekomendacji ${type === "music" ? "muzyki" : "filmów"}. 
        Twoje rekomendacje są precyzyjne, różnorodne i dopasowane do profilu użytkownika. 
        Unikaj powtarzania tych samych gatunków i twórców. Zawsze uwzględniaj feedback użytkownika.`;
    },

    patternAnalyzer: (): string => {
      return `Jesteś zaawansowanym analitykiem danych specjalizującym się w identyfikacji wzorców preferencji użytkowników. 
        Twoje analizy są precyzyjne, oparte na danych i przydatne dla algorytmów rekomendacji.
        Potrafisz zidentyfikować zarówno oczywiste, jak i subtelne preferencje użytkowników.`;
    },

    preferenceUpdater: (): string => {
      return `Jesteś specjalistą od aktualizacji modeli preferencji użytkowników. 
        Twoja rola polega na stopniowym dostosowywaniu profilu preferencji w oparciu o nowy feedback.
        Zachowujesz równowagę między stabilnością modelu a adaptacją do nowych informacji.`;
    },
  };
};
