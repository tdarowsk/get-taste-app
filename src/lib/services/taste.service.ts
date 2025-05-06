import type { TasteDTO, UserTasteDTO } from "../../types";
import { getUserPreferences } from "./preferences.service";

/**
 * Serwis odpowiedzialny za analizę gustu użytkownika.
 * Analizuje preferencje i historię rekomendacji, aby stworzyć profil gustu.
 */
export const TasteService = {
  /**
   * Pobiera i analizuje gust użytkownika na podstawie jego preferencji i historii.
   *
   * @param userId - UUID użytkownika
   * @returns Obiekt zawierający analizę gustu użytkownika
   * @throws Error w przypadku błędu
   */
  async getUserTaste(userId: string): Promise<UserTasteDTO> {
    try {
      // Pobierz preferencje użytkownika
      const preferences = await getUserPreferences(userId);

      // Analizuj gust muzyczny
      let musicTaste: TasteDTO | undefined;
      if (preferences.music) {
        musicTaste = this.analyzeMusicTaste(preferences.music.genres, preferences.music.artists);
      }

      // Analizuj gust filmowy
      let filmTaste: TasteDTO | undefined;
      if (preferences.film) {
        filmTaste = this.analyzeFilmTaste(
          preferences.film.genres,
          preferences.film.director,
          preferences.film.cast
        );
      }

      // Wygeneruj nazwę i opis gustu
      const name = this.generateTasteName(musicTaste, filmTaste);
      const description = this.generateTasteDescription(musicTaste, filmTaste);

      return {
        name,
        description,
        music: musicTaste,
        film: filmTaste,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Analizuje gust muzyczny użytkownika.
   *
   * @param genres - Preferowane gatunki muzyczne
   * @param artists - Preferowani artyści
   * @returns Analiza gustu muzycznego
   */
  analyzeMusicTaste(genres: string[], artists: string[]): TasteDTO {
    // Określ nastroje na podstawie gatunków
    const mood = this.determineMusicMood(genres);

    // Określ styl na podstawie gatunków i artystów
    const style = this.determineMusicStyle(genres, artists);

    // Oblicz intensywność (1-10) na podstawie gatunków
    const intensity = this.calculateMusicIntensity(genres);

    // Oblicz różnorodność (1-10) na podstawie ilości różnych gatunków i artystów
    const variety = this.calculateMusicVariety(genres, artists);

    return {
      genres: [...genres].sort(),
      mood,
      style,
      intensity,
      variety,
    };
  },

  /**
   * Analizuje gust filmowy użytkownika.
   *
   * @param genres - Preferowane gatunki filmowe
   * @param director - Preferowany reżyser
   * @param cast - Preferowana obsada
   * @returns Analiza gustu filmowego
   */
  analyzeFilmTaste(genres: string[], director: string | null, cast: string[]): TasteDTO {
    // Określ nastroje na podstawie gatunków
    const mood = this.determineFilmMood(genres);

    // Określ styl na podstawie gatunków i reżysera
    const style = this.determineFilmStyle(genres, director);

    // Oblicz intensywność (1-10) na podstawie gatunków
    const intensity = this.calculateFilmIntensity(genres);

    // Oblicz różnorodność (1-10) na podstawie ilości różnych gatunków
    const variety = this.calculateFilmVariety(genres, cast);

    return {
      genres: [...genres].sort(),
      mood,
      style,
      intensity,
      variety,
    };
  },

  /**
   * Określa nastroje muzyczne na podstawie gatunków.
   */
  determineMusicMood(genres: string[]): string[] {
    const moodMap: Record<string, string[]> = {
      rock: ["energiczny", "buntowniczy"],
      pop: ["pogodny", "lekki"],
      jazz: ["wyrafinowany", "kontemplacyjny"],
      classical: ["subtelny", "emocjonalny"],
      metal: ["intensywny", "mroczny"],
      electronic: ["rytmiczny", "nowoczesny"],
      "hip-hop": ["rytmiczny", "miejski"],
      reggae: ["relaksacyjny", "beztroski"],
      blues: ["melancholijny", "głęboki"],
      country: ["opowiadający", "wiejski"],
      indie: ["refleksyjny", "alternatywny"],
    };

    // Zbierz wszystkie możliwe nastroje dla podanych gatunków
    const moods = new Set<string>();
    genres.forEach((genre) => {
      const genreMoods = moodMap[genre.toLowerCase()] || ["uniwersalny"];
      genreMoods.forEach((mood) => moods.add(mood));
    });

    // Jeśli nie znaleziono żadnych nastrojów, zwróć domyślne
    if (moods.size === 0) {
      return ["uniwersalny", "zróżnicowany"];
    }

    return Array.from(moods).slice(0, 3); // Zwróć maksymalnie 3 nastroje
  },

  /**
   * Określa nastroje filmowe na podstawie gatunków.
   */
  determineFilmMood(genres: string[]): string[] {
    const moodMap: Record<string, string[]> = {
      drama: ["emocjonalny", "refleksyjny"],
      comedy: ["zabawny", "beztroski"],
      action: ["dynamiczny", "adrenalina"],
      thriller: ["napięcie", "niepewność"],
      horror: ["przerażający", "niepokojący"],
      "sci-fi": ["wizjonerski", "futurystyczny"],
      romance: ["romantyczny", "uczuciowy"],
      fantasy: ["magiczny", "wyobrażeniowy"],
      documentary: ["informacyjny", "analityczny"],
      animation: ["kreatywny", "barwny"],
    };

    // Zbierz wszystkie możliwe nastroje dla podanych gatunków
    const moods = new Set<string>();
    genres.forEach((genre) => {
      const genreMoods = moodMap[genre.toLowerCase()] || ["uniwersalny"];
      genreMoods.forEach((mood) => moods.add(mood));
    });

    // Jeśli nie znaleziono żadnych nastrojów, zwróć domyślne
    if (moods.size === 0) {
      return ["uniwersalny", "zróżnicowany"];
    }

    return Array.from(moods).slice(0, 3); // Zwróć maksymalnie 3 nastroje
  },

  /**
   * Określa styl muzyczny na podstawie gatunków i artystów.
   */
  determineMusicStyle(genres: string[], artists: string[]): string {
    if (genres.includes("rock") && genres.includes("metal")) {
      return "ciężkie brzmienia";
    } else if (genres.includes("jazz") || genres.includes("classical")) {
      return "wyrafinowana klasyka";
    } else if (genres.includes("electronic") || genres.includes("pop")) {
      return "nowoczesne hity";
    } else if (genres.includes("hip-hop") || genres.includes("rap")) {
      return "dynamiczne rytmy";
    } else if (genres.includes("indie") || genres.includes("alternative")) {
      return "alternatywne odkrycia";
    } else if (artists.length > genres.length) {
      return "zdefiniowany przez artystów";
    } else {
      return "eklektyczna mieszanka";
    }
  },

  /**
   * Określa styl filmowy na podstawie gatunków i reżysera.
   */
  determineFilmStyle(genres: string[], director: string | null): string {
    if (genres.includes("action") && genres.includes("thriller")) {
      return "energetyczne napięcie";
    } else if (
      genres.includes("drama") &&
      (genres.includes("romance") || genres.includes("comedy"))
    ) {
      return "emocjonalne historie";
    } else if (genres.includes("horror") || genres.includes("thriller")) {
      return "mroczne opowieści";
    } else if (genres.includes("sci-fi") || genres.includes("fantasy")) {
      return "kreatywne światy";
    } else if (director) {
      return "wizjonerskie kino";
    } else {
      return "różnorodne doświadczenia";
    }
  },

  /**
   * Oblicza intensywność muzyczną na podstawie gatunków (1-10).
   */
  calculateMusicIntensity(genres: string[]): number {
    const intensityMap: Record<string, number> = {
      metal: 9,
      rock: 7,
      electronic: 6,
      "hip-hop": 6,
      pop: 4,
      jazz: 3,
      classical: 2,
      ambient: 1,
    };

    let totalIntensity = 0;
    let matchedGenres = 0;

    genres.forEach((genre) => {
      const intensity = intensityMap[genre.toLowerCase()];
      if (intensity !== undefined) {
        totalIntensity += intensity;
        matchedGenres++;
      }
    });

    // Jeśli nie znaleziono żadnych gatunków, zwróć wartość środkową
    if (matchedGenres === 0) {
      return 5;
    }

    return Math.round(totalIntensity / matchedGenres);
  },

  /**
   * Oblicza intensywność filmową na podstawie gatunków (1-10).
   */
  calculateFilmIntensity(genres: string[]): number {
    const intensityMap: Record<string, number> = {
      action: 9,
      horror: 8,
      thriller: 7,
      "sci-fi": 6,
      drama: 5,
      comedy: 4,
      romance: 3,
      documentary: 2,
    };

    let totalIntensity = 0;
    let matchedGenres = 0;

    genres.forEach((genre) => {
      const intensity = intensityMap[genre.toLowerCase()];
      if (intensity !== undefined) {
        totalIntensity += intensity;
        matchedGenres++;
      }
    });

    // Jeśli nie znaleziono żadnych gatunków, zwróć wartość środkową
    if (matchedGenres === 0) {
      return 5;
    }

    return Math.round(totalIntensity / matchedGenres);
  },

  /**
   * Oblicza różnorodność muzyczną (1-10).
   */
  calculateMusicVariety(genres: string[], artists: string[]): number {
    // Im więcej gatunków i artystów, tym większa różnorodność
    const uniqueGenres = new Set(genres.map((g) => g.toLowerCase()));
    const uniqueArtists = new Set(artists.map((a) => a.toLowerCase()));

    // Maksymalna wartość dla każdej kategorii to 5
    const genreVariety = Math.min(5, uniqueGenres.size);
    const artistVariety = Math.min(5, uniqueArtists.size);

    return genreVariety + artistVariety;
  },

  /**
   * Oblicza różnorodność filmową (1-10).
   */
  calculateFilmVariety(genres: string[], cast: string[]): number {
    // Im więcej gatunków i aktorów, tym większa różnorodność
    const uniqueGenres = new Set(genres.map((g) => g.toLowerCase()));
    const uniqueCast = new Set(cast.map((c) => c.toLowerCase()));

    // Maksymalna wartość dla każdej kategorii to 5
    const genreVariety = Math.min(5, uniqueGenres.size);
    const castVariety = Math.min(5, uniqueCast.size);

    return genreVariety + castVariety;
  },

  /**
   * Generuje nazwę profilu gustu na podstawie analizy.
   */
  generateTasteName(musicTaste?: TasteDTO, filmTaste?: TasteDTO): string {
    if (musicTaste && filmTaste) {
      // Połącz style muzyczne i filmowe
      if (musicTaste.intensity > 7 && filmTaste.intensity > 7) {
        return "Intensywny Pasjonat";
      } else if (musicTaste.variety > 7 && filmTaste.variety > 7) {
        return "Wszechstronny Odkrywca";
      } else if (musicTaste.intensity < 4 && filmTaste.intensity < 4) {
        return "Kontemplacyjny Znawca";
      } else {
        return "Zbalansowany Entuzjasta";
      }
    } else if (musicTaste) {
      // Tylko muzyczny gust
      if (musicTaste.intensity > 7) {
        return "Muzyczny Energetyk";
      } else if (musicTaste.variety > 7) {
        return "Muzyczny Odkrywca";
      } else if (musicTaste.intensity < 4) {
        return "Muzyczny Meloman";
      } else {
        return "Muzyczny Entuzjasta";
      }
    } else if (filmTaste) {
      // Tylko filmowy gust
      if (filmTaste.intensity > 7) {
        return "Filmowy Poszukiwacz Wrażeń";
      } else if (filmTaste.variety > 7) {
        return "Filmowy Koneser";
      } else if (filmTaste.intensity < 4) {
        return "Filmowy Esteta";
      } else {
        return "Filmowy Entuzjasta";
      }
    } else {
      return "Gust w Trakcie Odkrywania";
    }
  },

  /**
   * Generuje opis gustu użytkownika.
   */
  generateTasteDescription(musicTaste?: TasteDTO, filmTaste?: TasteDTO): string {
    let description = "Twój gust charakteryzuje się ";

    if (musicTaste && filmTaste) {
      if (musicTaste.intensity > 7 && filmTaste.intensity > 7) {
        description += "zamiłowaniem do intensywnych doświadczeń zarówno w muzyce, jak i filmie. ";
      } else if (musicTaste.variety > 7 && filmTaste.variety > 7) {
        description +=
          "szerokim spektrum zainteresowań w różnorodnych gatunkach muzycznych i filmowych. ";
      } else if (musicTaste.intensity < 4 && filmTaste.intensity < 4) {
        description += "zamiłowaniem do subtelnych i refleksyjnych utworów oraz filmów. ";
      } else {
        description += "zbalansowanym podejściem do różnych form sztuki. ";
      }

      description += `Preferujesz muzykę określaną jako "${musicTaste.style}" oraz filmy w stylu "${filmTaste.style}".`;
    } else if (musicTaste) {
      description += `zamiłowaniem do muzyki w stylu "${musicTaste.style}". `;
      description += `Najbardziej cenisz sobie utwory o ${musicTaste.mood.join(" i ")} charakterze.`;
    } else if (filmTaste) {
      description += `zamiłowaniem do filmów w stylu "${filmTaste.style}". `;
      description += `Najbardziej cenisz sobie produkcje o ${filmTaste.mood.join(" i ")} charakterze.`;
    } else {
      description =
        "Twój gust jest obecnie w trakcie formowania się. Dodaj więcej preferencji, aby otrzymać dokładniejszą analizę.";
    }

    return description;
  },
};
