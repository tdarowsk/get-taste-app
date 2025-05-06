# Plan implementacji systemu rekomendacji AI dla getTaste

## 1. Architektura Systemu

### Struktura komponentów

```
src/
  ├─ lib/
  │   ├─ services/
  │   │   ├─ recommendation.service.ts     // Serwis generowania rekomendacji
  │   │   ├─ feedback.service.ts           // Serwis obsługi feedbacku użytkownika 
  │   │   ├─ openrouter.service.ts         // Serwis integracji z OpenRouter.ai
  │   │   ├─ taste.service.ts              // Serwis analizy gustu użytkownika
  │   │   └─ uniqueRecommendations.service.ts  // Serwis zapewniający unikalność rekomendacji
  │   └─ utils/
  │       └─ ai-prompts.ts                 // Zoptymalizowane prompty dla modeli AI
  ├─ components/
  │   ├─ RecommendationCard.tsx            // Komponent karty rekomendacji
  │   ├─ SwipeableRecommendations.tsx      // Komponent obsługujący swipe
  │   └─ RecommendationHistory.tsx         // Komponent historii rekomendacji
  └─ pages/
      └─ api/
          └─ recommendations/
              ├─ [id].ts                   // Endpoint do konkretnej rekomendacji
              ├─ generate.ts               // Endpoint generowania rekomendacji
              └─ feedback.ts               // Endpoint dla feedbacku
```

### Przepływ danych

1. **Pobieranie preferencji** - System pobiera preferencje użytkownika z bazy danych
2. **Analiza wzorców** - Analiza historii interakcji użytkownika z rekomendacjami
3. **Generowanie rekomendacji** - Wykorzystanie OpenRouter.ai do wygenerowania dopasowanych rekomendacji
4. **Zapisywanie feedbacku** - Zapisywanie reakcji użytkownika na rekomendacje
5. **Aktualizacja modelu** - Dostosowanie modelu preferencji na podstawie feedbacku

## 2. Integracja z OpenRouter.ai

### Konfiguracja serwisu OpenRouter

```typescript
// src/lib/services/openrouter.service.ts

import { OPENROUTER_API_KEY } from "../../env.config";
import type { ChatCompletionRequest, ChatCompletionResponse } from "../../types";

export class OpenRouterService {
  private static apiKey = OPENROUTER_API_KEY;
  private static defaultModel = "anthropic/claude-3-haiku-20240307"; // Model z dobrym stosunkiem jakości do ceny
  private static readonly baseUrl = "https://openrouter.ai/api/v1";
  
  /**
   * Konfiguruje usługę OpenRouter z odpowiednimi parametrami.
   */
  public static configure(
    apiKey = OPENROUTER_API_KEY,
    defaultModel = "anthropic/claude-3-haiku-20240307",
    defaultSystemPrompt?: string
  ): void {
    // Implementacja konfiguracji...
  }
  
  /**
   * Wysyła zapytanie o rekomendacje do OpenRouter w formacie JSON.
   */
  public static async generateRecommendations<T>(
    userPreferences: Record<string, unknown>,
    userFeedbackHistory: Record<string, unknown>[],
    recommendationType: "music" | "film",
    jsonSchema: object
  ): Promise<T> {
    // Implementacja generowania rekomendacji...
    // Wykorzystanie istniejącej funkcji jsonCompletion
  }
  
  /**
   * Analizuje wzorce w danych użytkownika, aby ulepszyć przyszłe rekomendacje.
   */
  public static async analyzeUserPatterns(
    userId: string, 
    recentFeedback: Record<string, unknown>[]
  ): Promise<Record<string, unknown>> {
    // Implementacja analizy wzorców...
  }
}
```

### Zarządzanie kosztami i modelami

```typescript
// src/lib/services/openrouter.service.ts - dodatkowe funkcje

/**
 * Wybiera optymalny model na podstawie typu zadania i budżetu.
 */
private static selectOptimalModel(
  taskType: "recommendation" | "analysis",
  budget: "low" | "medium" | "high" = "low"
): string {
  // Dla analizy wzorców - prostsze modele
  if (taskType === "analysis") {
    switch (budget) {
      case "low": return "anthropic/claude-3-haiku-20240307";
      case "medium": return "anthropic/claude-3-sonnet-20240229";
      case "high": return "anthropic/claude-3-opus-20240229";
      default: return "anthropic/claude-3-haiku-20240307";
    }
  }
  
  // Dla generowania rekomendacji - odpowiednie modele
  switch (budget) {
    case "low": return "anthropic/claude-3-haiku-20240307";
    case "medium": return "anthropic/claude-3-sonnet-20240229";
    case "high": return "anthropic/claude-3-opus-20240229";
    default: return "anthropic/claude-3-haiku-20240307";
  }
}

/**
 * Śledzi koszty zapytań do API.
 */
private static trackApiCosts(
  model: string,
  promptTokens: number,
  completionTokens: number
): void {
  // Implementacja śledzenia kosztów...
}
```

## 3. Analiza Preferencji Użytkownika

### Struktura danych preferencji

```typescript
// src/lib/services/taste.service.ts

import { supabaseClient } from "../../db/supabase.client";
import { OpenRouterService } from "./openrouter.service";
import type { UserTasteDTO, TasteDTO } from "../../types";

export const TasteService = {
  /**
   * Analizuje gust użytkownika na podstawie preferencji i historii feedbacku.
   */
  async analyzeUserTaste(userId: string): Promise<UserTasteDTO> {
    // Implementacja analizy gustu użytkownika...
    
    return {
      name: "Profil Gustu",
      description: "Opis preferencji użytkownika wygenerowany przez AI",
      music: {
        genres: ["rock", "indie"],
        mood: ["energiczny", "refleksyjny"],
        style: "eksperymentalny",
        intensity: 7,
        variety: 8
      },
      film: {
        genres: ["sci-fi", "thriller"],
        mood: ["napięcie", "refleksja"],
        style: "wizualnie intensywny",
        intensity: 8,
        variety: 6
      }
    };
  },
  
  /**
   * Identyfikuje wzorce w feedbacku użytkownika.
   */
  async identifyFeedbackPatterns(userId: string): Promise<Record<string, unknown>> {
    // Implementacja identyfikacji wzorców...
  },
  
  /**
   * Łączy preferencje jawne (zadeklarowane) i ukryte (wywnioskowane z zachowania).
   */
  async mergeExplicitAndImplicitPreferences(
    userId: string,
    contentType: "music" | "film"
  ): Promise<Record<string, unknown>> {
    // Implementacja łączenia preferencji...
  }
};
```

### Mechanizm analizy feedbacku

```typescript
// src/lib/services/feedback.service.ts

import { supabaseClient } from "../../db/supabase.client";
import { OpenRouterService } from "./openrouter.service";
import type { RecommendationFeedbackType } from "../../types";

export const FeedbackService = {
  /**
   * Zapisuje feedback typu swipe i aktualizuje model preferencji.
   */
  async saveSwipeFeedback(
    userId: string,
    recommendationId: number,
    feedbackType: RecommendationFeedbackType,
    itemMetadata?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Implementacja zapisywania feedbacku...
  },
  
  /**
   * Aktualizuje algorytm rekomendacji na podstawie feedbacku użytkownika.
   */
  async updateAlgorithmWithFeedback(
    userId: string,
    feedbackMetadata: Record<string, unknown>
  ): Promise<void> {
    // Implementacja aktualizacji algorytmu...
  },
  
  /**
   * Analizuje metadane lubianej i nielubianej zawartości.
   */
  async analyzeContentMetadata(
    userId: string,
    contentType: "music" | "film"
  ): Promise<Record<string, unknown>> {
    // Implementacja analizy metadanych...
  }
};
```

## 4. Generowanie Rekomendacji

### Algorytm rekomendacji

```typescript
// src/lib/services/recommendation.service.ts

import { supabaseClient } from "../../db/supabase.client";
import { OpenRouterService } from "./openrouter.service";
import { TasteService } from "./taste.service";
import { getAiPrompts } from "../utils/ai-prompts";
import type { RecommendationDTO, RecommendationDataDetails } from "../../types";

export const RecommendationService = {
  /**
   * Generuje rekomendacje z wykorzystaniem OpenRouter.ai.
   */
  async generateRecommendations(
    userId: string,
    type: "music" | "film",
    forceRefresh = false
  ): Promise<RecommendationDTO> {
    // Implementacja generowania rekomendacji...
  },
  
  /**
   * Wywołuje OpenRouter.ai, aby wygenerować rekomendacje.
   */
  async callOpenRouterAPI(
    preferences: Record<string, unknown>,
    feedbackHistory: Record<string, unknown>[],
    type: "music" | "film"
  ): Promise<RecommendationDataDetails> {
    // Implementacja wywołania OpenRouter.ai...
    
    // Konstruowanie prompta z wykorzystaniem ai-prompts.ts
    const prompt = getAiPrompts().generateRecommendations(preferences, feedbackHistory, type);
    
    // Wywołanie API
    const result = await OpenRouterService.generateRecommendations(
      preferences,
      feedbackHistory,
      type,
      {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                type: { type: "string" },
                details: { type: "object" }
              },
              required: ["id", "name", "type"]
            }
          }
        },
        required: ["title", "description", "items"]
      }
    );
    
    return result;
  }
};
```

### Prompty AI

```typescript
// src/lib/utils/ai-prompts.ts

export const getAiPrompts = () => {
  return {
    /**
     * Prompt do generowania rekomendacji.
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
     * Prompt do analizy wzorców użytkownika.
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
        
        Zwróć analizę w formacie JSON.
      `;
    }
  };
};
```

## 5. Optymalizacja Kosztów i Wydajności

### Strategia cachowania

```typescript
// src/lib/services/uniqueRecommendations.service.ts

import { supabaseClient } from "../../db/supabase.client";
import type { RecommendationDTO } from "../../types";

export const UniqueRecommendationsService = {
  /**
   * Filtruje rekomendacje, aby wykluczyć wcześniej pokazane lub ocenione pozycje.
   */
  async filterUniqueRecommendations(
    userId: string,
    recommendations: RecommendationDTO,
    timeThreshold: number = 30 // dni
  ): Promise<RecommendationDTO> {
    // Implementacja filtrowania unikalnych rekomendacji...
  },
  
  /**
   * Sprawdza, czy użytkownik już widział daną rekomendację.
   */
  async hasUserSeenRecommendation(
    userId: string,
    itemId: string,
    timeThreshold: number = 30 // dni
  ): Promise<boolean> {
    // Implementacja sprawdzania widzianych rekomendacji...
  },
  
  /**
   * Zapisuje informację o wyświetlonych rekomendacjach.
   */
  async trackShownRecommendations(
    userId: string,
    recommendations: RecommendationDTO
  ): Promise<void> {
    // Implementacja śledzenia wyświetlonych rekomendacji...
  }
};
```

### Monitorowanie i optymalizacja kosztów

```typescript
// src/lib/services/openrouter.service.ts - dodatkowe funkcje

/**
 * Monitoruje i optymalizuje koszty zapytań do API.
 */
public static async optimizeApiCosts(
  userId: string,
  requestFrequency: Record<string, number>,
  costLimit: number
): Promise<{
  recommendedModel: string;
  maxRequestsPerMonth: number;
}> {
  // Implementacja optymalizacji kosztów...
  // Algorytm wybierający najtańszy model spełniający wymagania
  
  return {
    recommendedModel: "anthropic/claude-3-haiku-20240307",
    maxRequestsPerMonth: 500
  };
}

/**
 * Śledzi użycie tokenów i powiązane koszty.
 */
public static async trackTokenUsage(
  userId: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): Promise<void> {
  // Implementacja śledzenia użycia tokenów...
  // Zapisywanie danych o użyciu do tabeli w Supabase
}
```

## 6. Interfejs Użytkownika

### Komponent karty rekomendacji

```tsx
// src/components/RecommendationCard.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RecommendationItem } from "../types";

interface RecommendationCardProps {
  item: RecommendationItem;
  onLike: (item: RecommendationItem) => void;
  onDislike: (item: RecommendationItem) => void;
}

export const RecommendationCard = ({ item, onLike, onDislike }: RecommendationCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLike = async () => {
    setIsLoading(true);
    try {
      await onLike(item);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDislike = async () => {
    setIsLoading(true);
    try {
      await onDislike(item);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription>{item.type}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Wyświetlanie szczegółów rekomendacji */}
        <dl className="grid grid-cols-2 gap-2">
          {item.details && Object.entries(item.details).map(([key, value]) => (
            <div key={key}>
              <dt className="text-sm font-medium text-gray-500">{key}</dt>
              <dd className="text-sm text-gray-900">{
                Array.isArray(value) ? value.join(", ") : String(value)
              }</dd>
            </div>
          ))}
        </dl>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleDislike} 
          disabled={isLoading}
        >
          Nie lubię
        </Button>
        <Button 
          variant="default" 
          onClick={handleLike} 
          disabled={isLoading}
        >
          Lubię
        </Button>
      </CardFooter>
    </Card>
  );
};
```

### Komponent obsługujący Swipe

```tsx
// src/components/SwipeableRecommendations.tsx

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { RecommendationCard } from "./RecommendationCard";
import type { RecommendationDTO, RecommendationItem } from "../types";

interface SwipeableRecommendationsProps {
  recommendations: RecommendationDTO;
  onLike: (item: RecommendationItem) => Promise<void>;
  onDislike: (item: RecommendationItem) => Promise<void>;
  onEmpty: () => void;
}

export const SwipeableRecommendations = ({ 
  recommendations, 
  onLike, 
  onDislike, 
  onEmpty 
}: SwipeableRecommendationsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items] = useState(recommendations.data?.items || []);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleDragEnd = async (event: any, info: any) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      await handleLike();
    } else if (info.offset.x < -threshold) {
      await handleDislike();
    }
  };
  
  const handleLike = async () => {
    if (currentIndex < items.length) {
      await onLike(items[currentIndex]);
      moveToNextCard();
    }
  };
  
  const handleDislike = async () => {
    if (currentIndex < items.length) {
      await onDislike(items[currentIndex]);
      moveToNextCard();
    }
  };
  
  const moveToNextCard = () => {
    x.set(0);
    
    if (currentIndex >= items.length - 1) {
      onEmpty();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  if (items.length === 0 || currentIndex >= items.length) {
    return (
      <div className="flex justify-center items-center h-64 border rounded-lg">
        <p className="text-gray-500">Brak rekomendacji</p>
      </div>
    );
  }
  
  return (
    <div className="relative h-96 w-full max-w-sm mx-auto">
      <motion.div
        ref={cardRef}
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        className="absolute w-full top-0 left-0"
      >
        <RecommendationCard
          item={items[currentIndex]}
          onLike={handleLike}
          onDislike={handleDislike}
        />
      </motion.div>
    </div>
  );
};
```

### Endpoint do generowania rekomendacji

```typescript
// src/pages/api/recommendations/generate.ts

import type { APIRoute } from "astro";
import { supabaseClient } from "../../../db/supabase.client";
import { RecommendationService } from "../../../lib/services/recommendation.service";
import { UniqueRecommendationsService } from "../../../lib/services/uniqueRecommendations.service";
import { OPENROUTER_API_KEY } from "../../../env.config";
import { OpenRouterService } from "../../../lib/services/openrouter.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    
    // Autentykacja użytkownika
    const { user, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Nieautoryzowany dostęp" }),
        { status: 401 }
      );
    }
    
    // Pobierz parametry z żądania
    const body = await request.json();
    const { type, force_refresh } = body;
    
    if (type !== "music" && type !== "film") {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy typ rekomendacji" }),
        { status: 400 }
      );
    }
    
    // Konfiguracja OpenRouter (jeśli nie jest jeszcze skonfigurowany)
    if (OPENROUTER_API_KEY) {
      OpenRouterService.configure(OPENROUTER_API_KEY);
    }
    
    // Generowanie rekomendacji
    const recommendations = await RecommendationService.generateRecommendations(
      user.id,
      type,
      force_refresh || false
    );
    
    // Filtrowanie unikalnych rekomendacji
    const uniqueRecommendations = await UniqueRecommendationsService.filterUniqueRecommendations(
      user.id,
      recommendations
    );
    
    // Śledzenie wyświetlonych rekomendacji
    await UniqueRecommendationsService.trackShownRecommendations(
      user.id,
      uniqueRecommendations
    );
    
    return new Response(
      JSON.stringify(uniqueRecommendations),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating recommendations:", error);
    
    return new Response(
      JSON.stringify({ error: "Błąd podczas generowania rekomendacji" }),
      { status: 500 }
    );
  }
};
```

## 7. Testy i Monitorowanie

### Testy jednostkowe

```typescript
// src/lib/services/recommendation.service.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecommendationService } from "./recommendation.service";
import { OpenRouterService } from "./openrouter.service";
import { supabaseClient } from "../../db/supabase.client";

// Mock supabaseClient i OpenRouterService
vi.mock("../../db/supabase.client", () => ({
  supabaseClient: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis()
  }
}));

vi.mock("./openrouter.service", () => ({
  OpenRouterService: {
    configure: vi.fn(),
    generateRecommendations: vi.fn(),
    jsonCompletion: vi.fn()
  }
}));

describe("RecommendationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it("powinien generować rekomendacje dla użytkownika", async () => {
    // Konfiguracja mocków
    
    // Test funkcjonalności
    
    // Weryfikacja wyników
  });
  
  it("powinien zwrócić istniejące rekomendacje jeśli force_refresh jest false", async () => {
    // Konfiguracja mocków
    
    // Test funkcjonalności
    
    // Weryfikacja wyników
  });
  
  it("powinien wywołać OpenRouter z odpowiednimi parametrami", async () => {
    // Konfiguracja mocków
    
    // Test funkcjonalności
    
    // Weryfikacja wywołania OpenRouter
  });
});
```

## 8. Kroki wdrożenia

1. **Przygotowanie** - Skonfiguruj klucze API i zmienne środowiskowe
2. **Implementacja usług AI** - Zaimplementuj serwisy OpenRouter, rekomendacji i feedbacku
3. **Integracja UI** - Dodaj komponenty React do interfejsu użytkownika
4. **Optymalizacja** - Wdrożenie strategii cachowania i zarządzania kosztami
5. **Testowanie** - Przetestuj przepływ rekomendacji i interakcji użytkownika
6. **Monitorowanie** - Skonfiguruj monitorowanie wydajności i kosztów
7. **Iteracyjne ulepszenia** - Dostosuj modele i prompty na podstawie danych użytkowania

## 9. Planowane rozszerzenia

1. **Automatyczna analiza trendów** - Identyfikacja trendów w preferencjach użytkowników
2. **Wyjaśnianie rekomendacji** - Dodanie wyjaśnień, dlaczego dana pozycja została zarekomendowana
3. **Segmentacja użytkowników** - Grupowanie użytkowników o podobnych gustach
4. **Rekomendacje współpracujące** - Wykorzystanie danych społecznościowych do ulepszenia rekomendacji
5. **Wskaźniki zaufania** - Dodanie oceny pewności dla każdej rekomendacji 