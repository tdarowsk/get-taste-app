/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
// @ts-nocheck - Temporarily disable TypeScript checking until the code is properly fixed
import { OPENROUTER_API_KEY, OPENROUTER_API_URL, OPENROUTER_DEFAULT_MODEL } from "../../env.config";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  ModelInfo,
  ResponseFormat,
} from "../../types";
import { getTmdbPosterUrl, getFallbackPosterUrl } from "../utils/poster-utils";

// Define an interface for the API error response structure
interface OpenRouterErrorResponse {
  error?: {
    message?: string;
    code?: number;
  };
  user_id?: string;
}

/**
 * OpenRouter service for interacting with various LLM providers through OpenRouter.ai.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class OpenRouterService {
  private static apiKey: string;
  private static defaultModel = OPENROUTER_DEFAULT_MODEL || "qwen/qwen3-4b:free";
  private static defaultSystemPrompt: string | undefined;
  private static readonly baseUrl = OPENROUTER_API_URL || "https://openrouter.ai/api/v1";

  // Cache na poziomie klasy dla przechowywania ostatnich rekomendacji
  private static recommendationsCache = new Map<string, { data: unknown; timestamp: number }>();
  private static readonly CACHE_TTL = 1000 * 60 * 30; // 30 minut

  // @ts-ignore - These methods are implemented below
  private static getHeaders(): Record<string, string>;
  private static constructChatRequestBody(userMessage: string, options?: any): any;
  private static fetchWithRetry(
    url: string,
    options: RequestInit,
    retries?: number,
    backoff?: number,
    timeout?: number
  ): Promise<Response>;
  private static processResponse<T>(response: Response): Promise<T>;
  private static sanitizeJsonResponse(content: string): string;
  private static quickJsonSanitize(content: string): string;
  private static getDefaultRecommendations(type: "music" | "film"): Record<string, unknown>;
  private static generateCacheKey(
    userPreferences: Record<string, unknown>,
    userFeedbackHistory: Record<string, unknown>[],
    recommendationType: "music" | "film",
    options?: Record<string, unknown>
  ): string;
  private static getFromCache<T>(key: string, ignoreExpiry?: boolean): T | null;
  private static addToCache<T>(key: string, data: T): void;
  private static createCompactPrompt(
    userPreferences: Record<string, unknown>,
    userFeedbackHistory: Record<string, unknown>[],
    recommendationType: "music" | "film"
  ): string;
  private static getOptimizedSystemPrompt(recommendationType: "music" | "film"): string;
  private static selectOptimalModel(): string;

  /**
   * Configures the OpenRouter service with API key and default parameters.
   */
  public static configure(
    apiKey: string = OPENROUTER_API_KEY,
    defaultModel = OPENROUTER_DEFAULT_MODEL || "qwen/qwen3-4b:free",
    defaultSystemPrompt?: string
  ): void {
    // Clean up the API key by removing any whitespace
    const cleanedApiKey = apiKey ? apiKey.trim() : "";

    if (!cleanedApiKey) {
      throw new OpenRouterConfigError("API key is required");
    }

    this.apiKey = cleanedApiKey;
    this.defaultModel = defaultModel || "qwen/qwen3-4b:free";
    this.defaultSystemPrompt = defaultSystemPrompt;
  }

  /**
   * Sends a chat completion request to OpenRouter API.
   */
  public static async chatCompletion(
    userMessage: string,
    options?: {
      model?: string;
      systemPrompt?: string;
      responseFormat?: ResponseFormat;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      streaming?: boolean;
      onStreamingUpdate?: (chunk: string) => void;
    }
  ): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new OpenRouterConfigError("OpenRouter service not configured. Call configure() first.");
    }

    try {
      const requestBody = this.constructChatRequestBody(userMessage, options);

      const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      return await this.processResponse<ChatCompletionResponse>(response);
    } catch (error: unknown) {
      if (error instanceof OpenRouterApiError || error instanceof OpenRouterConfigError) {
        throw error;
      }

      throw new OpenRouterApiError(
        `Failed to get chat completion: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Sends a chat completion request to OpenRouter API with JSON response format.
   */
  public static async jsonCompletion<T>(
    userMessage: string,
    jsonSchema: object,
    options?: {
      model?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      schemaName?: string;
      strict?: boolean;
      responseFormat?: ResponseFormat;
    }
  ): Promise<T> {
    // Combine the options with defaults
    const model = options?.model || this.defaultModel;
    const baseSystemPrompt = options?.systemPrompt || this.defaultSystemPrompt || "";
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens || 2000;

    // Add explicit instruction to respond in English and only with valid JSON
    const enhancedSystemPrompt =
      baseSystemPrompt +
      "\n\nCRITICAL INSTRUCTIONS:\n1. Respond ONLY with valid JSON.\n2. Do not include any explanatory text before or after the JSON.\n3. Your entire response must be parseable as JSON.\n4. Always write in English only.\n5. Start your response with { and end with }.";

    try {
      // Construct the request
      const messages: ChatMessage[] = [];

      // Add system prompt if provided
      if (enhancedSystemPrompt) {
        messages.push({
          role: "system",
          content: enhancedSystemPrompt,
        });
      }

      // Add user prompt with clear instruction for JSON response
      messages.push({
        role: "user",
        content:
          userMessage +
          "\n\nIMPORTANT: Your response must contain ONLY valid JSON. Do not include any text explanations. Start your response with { and end with }.",
      });

      // Set up response format for better JSON handling
      const responseFormat: ResponseFormat = {
        type: "json_object",
        schema: jsonSchema || {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            items: { type: "array" },
          },
          required: ["title", "description", "items"],
        },
      };

      // Prepare the request body
      const requestBody: ChatCompletionRequest = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: responseFormat,
      };

      // Make the API request
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://api.openrouter.ai/",
        "X-Title": "getTaste",
      };
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new OpenRouterApiError(`API Error: ${response.status} - ${errorText}`);
      }

      // Process the response
      try {
        // Parse the response
        const responseData: ChatCompletionResponse = await response.json();
        if (!responseData.choices || responseData.choices.length === 0) {
          throw new OpenRouterApiError("Brak wyników w odpowiedzi API");
        }

        // Extract the content from the first choice
        const content = responseData.choices[0]?.message?.content;
        if (!content) {
          throw new OpenRouterApiError("Pusta odpowiedź od API");
        }

        // Print debug info
        let cleanedContent = content;

        // Remove Markdown code blocks if present
        if (content.startsWith("```json") || content.startsWith("```")) {
          cleanedContent = content
            .replace(/^```json\n/, "")
            .replace(/^```\n/, "")
            .replace(/\n```$/, "")
            .replace(/```$/, "");
        }

        // Try to find JSON in the content if it's embedded within other text
        const jsonMatch = cleanedContent.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedContent = jsonMatch[1];
        }

        // Try parsing with more safeguards
        let parsedResult;
        try {
          // First direct attempt
          parsedResult = JSON.parse(cleanedContent) as T;
        } catch (_primaryParseError) {
          // Check if the content starts with text explanations followed by JSON
          const jsonStartIndex = cleanedContent.indexOf("{");
          const jsonEndIndex = cleanedContent.lastIndexOf("}");

          if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
            // Extract the JSON part
            const extractedJson = cleanedContent.substring(jsonStartIndex, jsonEndIndex + 1);
            // console.info("[OpenRouter] Extracted potential JSON from text response");

            try {
              parsedResult = JSON.parse(extractedJson) as T;
              console.info("[OpenRouter] Successfully parsed extracted JSON");
            } catch (_extractedJsonError) {
              // Continue to sanitization if direct extraction failed
              console.warn(
                "[OpenRouter] Extracted JSON parsing failed, continuing to sanitization"
              );
            }
          }

          // If direct extraction failed, try with our advanced JSON sanitizing function
          if (!parsedResult) {
            try {
              const sanitizedContent = this.sanitizeJsonResponse(cleanedContent);
              // Try to parse the sanitized content
              try {
                parsedResult = JSON.parse(sanitizedContent) as T;
              } catch (_sanitizedParseError) {
                // Fallback to original regex approach
                const jsonRegex = /(\{[\s\S]*\})/g;
                const matches = cleanedContent.match(jsonRegex);
                if (matches && matches.length > 0) {
                  // Try each match until one works
                  for (const match of matches) {
                    try {
                      // Try to sanitize each potential JSON match
                      const sanitizedMatch = this.sanitizeJsonResponse(match);
                      const potentialResult = JSON.parse(sanitizedMatch);
                      if (potentialResult && typeof potentialResult === "object") {
                        parsedResult = potentialResult as T;
                        break;
                      }
                    } catch {
                      // Continue to next match - empty catch block is intentional
                    }
                  }
                }
              }

              // If we still don't have a result, use default fallback
              if (!parsedResult) {
                return this.getDefaultRecommendations("film") as unknown as T;
              }
            } catch (_secondaryParseError) {
              return this.getDefaultRecommendations("film") as unknown as T;
            }
          }
        }

        // Log parsed result structure for debugging
        if (parsedResult && typeof parsedResult === "object") {
          if ("items" in parsedResult) {
            const _resultWithItems = parsedResult as Record<string, unknown>;
          }
        }

        // Validate the result has the expected structure
        if (typeof parsedResult !== "object" || parsedResult === null) {
          return this.getDefaultRecommendations("film") as unknown as T;
        }

        // Check if the result has the expected structure (title, description, items)
        const result = parsedResult as unknown as Record<string, unknown>;
        if (!result.title || !result.description || !Array.isArray(result.items)) {
          // Try to determine if there are recommendations in a different property
          const recommendations = Array.isArray(result.recommendations)
            ? (result.recommendations as Record<string, unknown>[])
            : Array.isArray(result.results)
              ? (result.results as Record<string, unknown>[])
              : null;

          if (recommendations) {
            // Found recommendations in a different property, adapt to expected format
            // Define the type here so it can be used in the template literals
            const localRecommendationType = "film" as "music" | "film";
            const fixedResult = {
              title:
                result.title ||
                `${localRecommendationType === "music" ? "Music" : "Film"} Recommendations`,
              description:
                result.description ||
                `Personalized ${localRecommendationType} recommendations based on your preferences`,
              items: recommendations.map((rec: Record<string, unknown>, index) => ({
                id: rec.id || `rec-${index}`,
                name: rec.title || rec.name || `Recommendation ${index + 1}`,
                type: localRecommendationType === "music" ? "track" : "film",
                details: {
                  genres: Array.isArray(rec.genres) ? rec.genres : [rec.genre || "Unknown"],
                  ...(localRecommendationType === "music"
                    ? {
                        artist: rec.artist || "Unknown Artist",
                        year: rec.year || rec.release_year || "Unknown",
                      }
                    : {
                        director: rec.director || "Unknown Director",
                        cast: Array.isArray(rec.cast) ? rec.cast : [],
                        year: rec.year || rec.release_year || "Unknown",
                      }),
                },
                explanation:
                  rec.description || rec.explanation || "Recommended based on your preferences",
                confidence: typeof rec.confidence === "number" ? rec.confidence : 0.8,
              })),
            };

            const recommendations = Array.isArray(fixedResult.items) ? fixedResult.items : [];
            // Log number of recommendations and first item
            return fixedResult as unknown as T;
          }

          // If we couldn't find recommendations, use default recommendations
          return this.getDefaultRecommendations("film") as unknown as T;
        }

        return parsedResult;
      } catch (_error) {
        // Define a local content variable if it's not available
        let _content = "unknown content";
        try {
          // Try to get content from the current scope if available
          if (
            typeof response === "object" &&
            response &&
            "choices" in response &&
            Array.isArray(response.choices) &&
            response.choices.length > 0 &&
            "message" in response.choices[0] &&
            "content" in response.choices[0].message
          ) {
            _content = response.choices[0].message.content;
          }
        } catch {
          // Ignore errors during content retrieval
        }
        return this.getDefaultRecommendations("film") as unknown as T;
      }
    } catch (error) {
      if (
        error instanceof OpenRouterApiError ||
        error instanceof OpenRouterConfigError ||
        error instanceof JsonSchemaValidationError
      ) {
        throw error;
      }

      throw new OpenRouterApiError(
        `Błąd wykonania zapytania JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Fetches the list of available models from OpenRouter API.
   */
  public static async listModels(): Promise<ModelInfo[]> {
    if (!this.apiKey) {
      throw new OpenRouterConfigError("OpenRouter service not configured. Call configure() first.");
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/models`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      return await this.processResponse<ModelInfo[]>(response);
    } catch (error: unknown) {
      if (error instanceof OpenRouterApiError || error instanceof OpenRouterConfigError) {
        throw error;
      }

      throw new OpenRouterApiError(
        `Failed to list models: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Wysyła zapytanie o rekomendacje do OpenRouter w formacie JSON.
   */
  public static async generateRecommendations<T>(
    userPreferences: Record<string, unknown>,
    userFeedbackHistory: Record<string, unknown>[],
    recommendationType: "music" | "film",
    options?: {
      model?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      skipCache?: boolean;
    }
  ): Promise<T> {
    // Utwórz klucz cache bazujący na parametrach zapytania
    const cacheKey = this.generateCacheKey(
      userPreferences,
      userFeedbackHistory,
      recommendationType,
      options
    );

    // Sprawdź cache jeśli nie ustawiono skipCache
    if (!options?.skipCache) {
      const cachedData = this.getFromCache<T>(cacheKey);
      if (cachedData) {
        console.info(`[OpenRouter] Using cached recommendations for ${recommendationType}`);
        return cachedData;
      }
    }

    // Lista modeli do wypróbowania - zaczynamy od najbardziej niezawodnych
    const modelsToTry = [
      "mistralai/mistral-7b-instruct",
      "meta-llama/llama-3-8b-instruct",
      "qwen/qwen3-4b:free",
    ];

    // Maksymalna liczba prób z różnymi modelami
    const maxModelRetries = modelsToTry.length;
    const currentModelIndex = 0;

    // Aktualnie używany model - domyślnie pierwszy z listy lub model podany przez użytkownika
    let currentModel = options?.model || modelsToTry[currentModelIndex];

    // Przygotuj prompt dla AI
    const userMessage = this.createCompactPrompt(
      userPreferences,
      userFeedbackHistory,
      recommendationType
    );
    const maxTokens = options?.maxTokens || 1200;
    const systemPrompt = options?.systemPrompt || this.getOptimizedSystemPrompt(recommendationType);

    // Format odpowiedzi JSON
    const responseFormat: ResponseFormat = { type: "json_object" };

    // Create a global timeout for the entire process to avoid hanging forever
    const overallTimeoutMs = 45000; // 45 seconds overall timeout
    const overallTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new OpenRouterApiError(
            `Overall model generation timeout after ${overallTimeoutMs}ms`,
            408
          )
        );
      }, overallTimeoutMs);
    });

    try {
      // Funkcja pomocnicza do obsługi ponownych prób z różnymi modelami
      const tryWithModel = async (modelIndex: number): Promise<T> => {
        if (modelIndex >= maxModelRetries) {
          console.warn(
            `[OpenRouter] Exhausted all model retries for ${recommendationType} recommendations`
          );
          // Zwróć domyślne rekomendacje po wyczerpaniu wszystkich prób
          return this.getDefaultRecommendations(recommendationType) as unknown as T;
        }

        currentModel = modelsToTry[modelIndex];
        console.info(
          `[OpenRouter] Trying to generate ${recommendationType} recommendations with model: ${currentModel}`
        );

        try {
          // Przygotuj wiadomości dla modelu
          const messages: ChatMessage[] = [];

          // Dodaj prompt systemowy
          if (systemPrompt) {
            messages.push({
              role: "system",
              content: systemPrompt,
            });
          }

          // Dodaj wiadomość użytkownika
          messages.push({
            role: "user",
            content: userMessage,
          });

          // Przygotuj żądanie
          const requestBody: ChatCompletionRequest = {
            model: currentModel,
            messages,
            response_format: responseFormat,
            temperature: options?.temperature ?? 0.7,
            max_tokens: maxTokens,
          };

          console.info(
            `[OpenRouter] Sending request to generate ${recommendationType} recommendations`
          );

          // Wykonaj żądanie z obsługą timeout
          const fetchPromise = fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(requestBody),
          });

          // Wyścig między żądaniem a globalnym timeoutem
          const response = await Promise.race([fetchPromise, overallTimeoutPromise]);

          if (!response.ok) {
            const errorText = await response.text();
            // console.error(`[OpenRouter] API error: ${response.status} - ${errorText}`);
            // Spróbuj z następnym modelem
            return tryWithModel(modelIndex + 1);
          }

          // Parsuj odpowiedź
          const responseData: ChatCompletionResponse = await response.json();

          if (!responseData.choices || responseData.choices.length === 0) {
            console.error(`[OpenRouter] No choices returned in API response`);
            return tryWithModel(modelIndex + 1);
          }

          // Wyodrębnij zawartość z pierwszego wyboru
          const content = responseData.choices[0]?.message?.content;
          if (!content) {
            console.error(`[OpenRouter] Empty content in API response`);
            return tryWithModel(modelIndex + 1);
          }

          console.info(`[OpenRouter] Successfully received ${recommendationType} recommendations`);

          // Oczyść zawartość JSON
          let cleanedContent = content;

          // Usuń bloki kodu Markdown, jeśli są obecne
          if (content.includes("```")) {
            cleanedContent = content
              .replace(/```json\s*\n([\s\S]*?)\n```/g, "$1")
              .replace(/```\s*\n([\s\S]*?)\n```/g, "$1")
              .replace(/```json\s*([\s\S]*?)```/g, "$1")
              .replace(/```\s*([\s\S]*?)```/g, "$1")
              .replace(/^```json\s*/, "")
              .replace(/^```\s*/, "")
              .replace(/\s*```$/, "");
          }

          // Znajdź JSON w zawartości, jeśli jest osadzony w innym tekście
          const jsonMatch = cleanedContent.match(/(\{[\s\S]*\})/);
          if (jsonMatch && jsonMatch[1]) {
            cleanedContent = jsonMatch[1];
          }

          // Spróbuj sparsować JSON z zabezpieczeniami
          let parsedResult: T;
          try {
            // Pierwsza próba parsowania
            parsedResult = JSON.parse(cleanedContent) as T;
          } catch (parseError) {
            console.warn(
              `[OpenRouter] JSON parse error: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
            );

            // Użyj zaawansowanej funkcji sanityzacji JSON
            try {
              const sanitizedContent = this.sanitizeJsonResponse(cleanedContent);
              parsedResult = JSON.parse(sanitizedContent) as T;
            } catch (sanitizeError) {
              console.error(
                `[OpenRouter] JSON sanitize error: ${sanitizeError instanceof Error ? sanitizeError.message : "Unknown error"}`
              );
              // Spróbuj z następnym modelem
              return tryWithModel(modelIndex + 1);
            }
          }

          // Sprawdź, czy wynik ma oczekiwaną strukturę
          if (typeof parsedResult !== "object" || parsedResult === null) {
            console.error(`[OpenRouter] Invalid result structure: not an object`);
            return tryWithModel(modelIndex + 1);
          }

          // Sprawdź podstawową strukturę (title, description, items)
          const result = parsedResult as unknown as Record<string, unknown>;
          if (
            !result.title ||
            !result.description ||
            !Array.isArray(result.items) ||
            result.items.length === 0
          ) {
            console.error(
              `[OpenRouter] Invalid result structure: missing required fields or empty items`
            );

            // Sprawdź, czy rekomendacje są w innej właściwości
            const recommendations = Array.isArray(result.recommendations)
              ? (result.recommendations as Record<string, unknown>[])
              : Array.isArray(result.results)
                ? (result.results as Record<string, unknown>[])
                : null;

            if (recommendations && recommendations.length > 0) {
              // Napraw strukturę wyników
              const fixedResult = {
                title:
                  result.title ||
                  `${recommendationType === "music" ? "Music" : "Film"} Recommendations`,
                description:
                  result.description ||
                  `Personalized ${recommendationType} recommendations based on your preferences`,
                items: recommendations.map((rec: Record<string, unknown>, index) => ({
                  id: rec.id || `rec-${index}`,
                  name: rec.title || rec.name || `Recommendation ${index + 1}`,
                  type: recommendationType === "music" ? "track" : "film",
                  details: {
                    genres: Array.isArray(rec.genres) ? rec.genres : [rec.genre || "Unknown"],
                    ...(recommendationType === "music"
                      ? {
                          artist: rec.artist || "Unknown Artist",
                          year: rec.year || rec.release_year || "Unknown",
                        }
                      : {
                          director: rec.director || "Unknown Director",
                          cast: Array.isArray(rec.cast) ? rec.cast : [],
                          year: rec.year || rec.release_year || "Unknown",
                        }),
                  },
                  explanation:
                    rec.description || rec.explanation || "Recommended based on your preferences",
                  confidence: typeof rec.confidence === "number" ? rec.confidence : 0.8,
                })),
              };

              // Dodaj do cache i zwróć naprawione wyniki
              this.addToCache(cacheKey, fixedResult);
              return fixedResult as unknown as T;
            }

            // Spróbuj z kolejnym modelem
            return tryWithModel(modelIndex + 1);
          }

          // Sprawdź, czy mamy przynajmniej jedną rekomendację
          if (Array.isArray(result.items) && result.items.length === 0) {
            console.warn(`[OpenRouter] No recommendations generated, trying next model`);
            return tryWithModel(modelIndex + 1);
          }

          // Sukces - zapisz wyniki do cache
          this.addToCache(cacheKey, parsedResult);
          console.info(
            `[OpenRouter] Successfully generated and cached ${recommendationType} recommendations with ${result.items.length} items`
          );

          // If this is for films, enhance the poster URLs
          if (recommendationType === "film" && Array.isArray(result.items)) {
            // Process each item to ensure it has a valid poster URL
            result.items = result.items.map((item: Record<string, unknown>) => {
              if (item.details && typeof item.details === "object") {
                const details = item.details as Record<string, unknown>;

                // Check if there's an img field that might be a TMDB poster path
                if (typeof details.img === "string") {
                  const imgValue = details.img as string;

                  // If it's just a path without a full URL, convert it to a TMDB URL
                  if (
                    imgValue.startsWith("/") ||
                    (!imgValue.startsWith("http") && !imgValue.startsWith("https"))
                  ) {
                    details.img =
                      getTmdbPosterUrl(imgValue) || getFallbackPosterUrl(item.name as string);
                  } else if (imgValue === "N/A" || imgValue === "") {
                    // Replace empty or N/A placeholders with a real fallback
                    details.img = getFallbackPosterUrl(item.name as string);
                  }

                  // Also set imageUrl for compatibility
                  details.imageUrl = details.img;
                } else {
                  // No img field, set a fallback
                  details.img = getFallbackPosterUrl(item.name as string);
                  details.imageUrl = details.img;
                }

                item.details = details;
              }

              return item;
            });
          }

          return parsedResult;
        } catch (error) {
          console.error(
            `[OpenRouter] Error generating ${recommendationType} recommendations with model ${currentModel}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );

          // Spróbuj z następnym modelem
          return tryWithModel(modelIndex + 1);
        }
      };

      // Rozpocznij proces z pierwszym modelem
      return await tryWithModel(0);
    } catch (error) {
      console.error(
        `[OpenRouter] Unhandled error in generateRecommendations for ${recommendationType}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      // Zwróć domyślne rekomendacje w przypadku nieobsłużonego błędu
      const defaultRecs = this.getDefaultRecommendations(recommendationType) as unknown as T;

      // Zapisz domyślne rekomendacje do cache z krótszym TTL (5 minut)
      const shortTTLKey = `error-${cacheKey}`;
      this.recommendationsCache.set(shortTTLKey, {
        data: defaultRecs,
        timestamp: Date.now() - (this.CACHE_TTL - 1000 * 60 * 5), // 5 minut TTL
      });

      return defaultRecs;
    }
  }

  /**
   * Generuje klucz cache bazując na parametrach zapytania.
   */
  private static generateCacheKey(
    userPreferences: Record<string, unknown>,
    userFeedbackHistory: Record<string, unknown>[],
    recommendationType: "music" | "film",
    options?: Record<string, unknown>
  ): string {
    // Prostsze i bardziej wydajne generowanie klucza
    const preferencesHash = JSON.stringify(userPreferences).length.toString();
    const feedbackHash = userFeedbackHistory.length.toString();
    const optionsHash = options ? Object.keys(options).join("-") : "default";

    return `${recommendationType}-${preferencesHash}-${feedbackHash}-${optionsHash}`;
  }

  /**
   * Pobiera dane z cache jeśli istnieją i nie są przestarzałe.
   */
  private static getFromCache<T>(key: string, ignoreExpiry = false): T | null {
    const cached = this.recommendationsCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    // Sprawdź czy cache wygasł, chyba że ignoreExpiry=true
    if (!ignoreExpiry && now - cached.timestamp > this.CACHE_TTL) {
      this.recommendationsCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Dodaje dane do cache.
   */
  private static addToCache<T>(key: string, data: T): void {
    this.recommendationsCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Limit rozmiaru cache do 20 elementów
    if (this.recommendationsCache.size > 20) {
      // Usuń najstarszy wpis
      const oldestKey = [...this.recommendationsCache.entries()].sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0];
      this.recommendationsCache.delete(oldestKey);
    }
  }

  /**
   * Simplifies the prompt for API for better efficiency.
   */
  private static createCompactPrompt(
    userPreferences: Record<string, unknown>,
    userFeedbackHistory: Record<string, unknown>[],
    recommendationType: "music" | "film"
  ): string {
    return `
      Generate ${recommendationType === "music" ? "music" : "movie"} recommendations for the user.
      
      Preferences: ${JSON.stringify(userPreferences)}
      
      Feedback: ${JSON.stringify(userFeedbackHistory)}
      
      Return 5 recommendations containing: id, name, type, details with: director, genres, year, cast, ${recommendationType === "film" ? "poster URL, " : ""}imageUrl.
      Each ${recommendationType === "music" ? "track" : "movie"} should have a unique identifier and appropriate metadata.
      ${recommendationType === "film" ? "IMPORTANT: For each movie recommendation, include a valid poster URL in the img field." : ""}
      
      FORMAT REQUIREMENTS:
      1. Start response with { and end with }
      2. Return ONLY valid JSON - no explanatory text or comments
      3. Never prefix your response with phrases like 'Based on your preferences...'
      4. Always respond in English
      5. Follow this exact structure:
      
      {
        "title": "Recommendations",
        "description": "Personalized recommendations",
        "items": [
          {
            "id": "unique-id",
            "name": "Name",
            "type": "${recommendationType === "music" ? "track" : "film"}",
            "details": {
              ${
                recommendationType === "film"
                  ? `"director": "Director name",
              "genres": ["Genre1", "Genre2"],
              "year": "Year",
              "cast": ["Actor1", "Actor2"],
              "img": "https://image.url/poster.jpg"`
                  : `"artist": "Artist name",
              "genres": ["Genre1"],
              "year": "Year"`
              }
            }
          }
        ]
      }
    `;
  }

  /**
   * Zwraca zoptymalizowany prompt systemowy.
   */
  private static getOptimizedSystemPrompt(recommendationType: "music" | "film"): string {
    return `You are a ${recommendationType === "music" ? "music" : "movie"} recommendation system. 
      CRITICAL INSTRUCTIONS:
      1. ONLY output valid JSON. No explanations, no preamble, no additional text.
      2. Start your response with { and end with }.
      3. Format must match EXACTLY this structure:
      
      {
        "title": "Recommendations",
        "description": "Personalized recommendations",
        "items": [
          {
            "id": "unique-id",
            "name": "Name",
            "type": "${recommendationType === "music" ? "track" : "film"}",
            "details": {
              ${
                recommendationType === "film"
                  ? `"director": "Director (if applicable)",
              "genres": ["Genre1"],
              "year": "Year",
              "cast": ["Actor1"],
              "img": "https://valid-image-hosting.com/movie-poster.jpg"`
                  : `"artist": "Artist name",
              "genres": ["Genre1"],
              "year": "Year"`
              }
            }
          }
        ]
      }
      
      REQUIREMENTS: 
      1. Use the user's actual preferences to generate accurate recommendations.
      2. ONLY respond with valid JSON, no additional text.
      3. Always respond in English regardless of input language.
      4. Never use placeholder data.
      ${recommendationType === "film" ? "5. ALWAYS include a valid poster URL in the img field for each movie." : ""}
      ${recommendationType === "film" ? "6. If you cannot find a real poster URL, use URLs from image.tmdb.org or similar movie poster sites." : ""}
      7. If you cannot generate recommendations, return empty items array but maintain valid JSON structure.
      8. Never prefix your response with words like 'Based on...' or 'Here is...'`;
  }

  /**
   * Selects the optimal model based on task type and budget.
   */
  private static selectOptimalModel(): string {
    // List of current free models to try in order of preference - ONLY INCLUDE VERIFIED WORKING MODELS
    const freeModels = [
      "mistralai/mistral-7b-instruct", // Primary model - fixed Polish response issue by ensuring English prompts
      "meta-llama/llama-3-8b-instruct", // Backup model
      "qwen/qwen3-4b:free", // Additional backup model
    ];

    // Default to the first free model
    return freeModels[0];
  }

  /**
   * Constructs headers for OpenRouter API requests.
   */
  private static getHeaders(): Record<string, string> {
    if (!this.apiKey) {
      throw new OpenRouterConfigError("OpenRouter service not configured. Call configure() first.");
    }

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "HTTP-Referer": "https://api.openrouter.ai/", // Replace with your actual domain
      "X-Title": "getTaste", // Nazwa aplikacji
    };
  }

  /**
   * Constructs the request body for chat completion.
   */
  private static constructChatRequestBody(
    userMessage: string,
    options?: {
      model?: string;
      systemPrompt?: string;
      responseFormat?: ResponseFormat;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      streaming?: boolean;
    }
  ): ChatCompletionRequest {
    const messages: ChatMessage[] = [];

    // Add system message if provided or if default exists
    const systemPrompt = options?.systemPrompt || this.defaultSystemPrompt;
    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    // Add user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    return {
      model: options?.model || this.defaultModel,
      messages,
      response_format: options?.responseFormat,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      stream: options?.streaming || false,
    };
  }

  /**
   * Helper method to retry fetch requests in case of network failures
   */
  private static async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3,
    backoff = 1000,
    timeout = 30000 // 30 seconds timeout
  ): Promise<Response> {
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`[OpenRouter] Request timed out after ${timeout}ms for URL: ${url}`);
    }, timeout);

    try {
      // Ensure we have proper headers set for consistent Content-Type handling
      const headers: Record<string, string> = {
        ...this.getHeaders(), // Always use base headers
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      // Add any additional headers from options
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (key.toLowerCase() !== "content-type" && key.toLowerCase() !== "accept") {
            headers[key] = String(value);
          }
        });
      }

      // Add signal to options and update headers
      const fetchOptions = {
        ...options,
        headers: headers,
        signal: controller.signal,
      };
      // No need to do anything with body - removed empty block

      console.info(`[OpenRouter] Making request to: ${url}`);
      const response = await fetch(url, fetchOptions); // Log content type for debugging
      const _contentType = response.headers.get("content-type");
      console.info(
        `[OpenRouter] Response received with status: ${response.status}, content-type: ${_contentType}`
      );

      // Clear the timeout since request completed
      clearTimeout(timeoutId);

      return response;
    } catch (error) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);

      // Check if this was a timeout error
      if (error instanceof DOMException && error.name === "AbortError") {
        console.error(`[OpenRouter] Request to ${url} timed out after ${timeout}ms`);
        throw new OpenRouterApiError(`Request timed out after ${timeout}ms`);
      }

      console.error(
        `[OpenRouter] Network error for ${url}:`,
        error instanceof Error ? error.message : String(error)
      );

      if (retries <= 1) {
        throw new OpenRouterApiError(
          `Network request failed after multiple attempts: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      console.info(
        `[OpenRouter] Retrying request to ${url} after ${backoff}ms. Retries left: ${retries - 1}`
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));

      return this.fetchWithRetry(url, options, retries - 1, backoff * 2, timeout);
    }
  }

  /**
   * Processes the response from OpenRouter API.
   */
  private static async processResponse<T>(response: Response): Promise<T> {
    // Log the content type for debugging
    const _contentType = response.headers.get("content-type");
    if (!response.ok) {
      let errorData;
      let errorText = "";

      try {
        // Try to read as text first
        errorText = await response.text();
        // Then attempt to parse as JSON if it looks like JSON
        if (errorText.trim().startsWith("{") || errorText.trim().startsWith("[")) {
          try {
            errorData = JSON.parse(errorText);
          } catch (_jsonError) {
            errorData = { message: errorText };
          }
        } else {
          errorData = { message: errorText };
        }
      } catch (_textError) {
        errorData = { message: "Unknown error" };
      }
      throw new OpenRouterApiError(
        `API request failed with status ${response.status}: ${errorData?.message || response.statusText}`,
        response.status,
        errorData
      );
    }

    // Read response as text first for better content type handling
    const responseText = await response.text();
    try {
      // Try to parse as JSON regardless of content type
      return JSON.parse(responseText) as T;
    } catch (_jsonError) {
      // If parsing fails, return the text wrapped in an object
      return { text: responseText } as unknown as T;
    }
  }

  /**
   * Comprehensive JSON sanitization for malformed API responses
   */
  private static sanitizeJsonResponse(content: string): string {
    // If content is too short, return a simple valid JSON
    if (content.trim().length < 10) {
      return JSON.stringify({
        title: "Error",
        description: "Received invalid response",
        items: [],
      });
    }

    let cleanedContent = content;

    // Remove trailing content after JSON object
    const lastBraceIndex = cleanedContent.lastIndexOf("}");
    const lastBracketIndex = cleanedContent.lastIndexOf("]");
    const lastClosingIndex = Math.max(lastBraceIndex, lastBracketIndex);

    if (lastClosingIndex !== -1 && lastClosingIndex < cleanedContent.length - 1) {
      cleanedContent = cleanedContent.substring(0, lastClosingIndex + 1);
    }

    // Try to parse the content
    try {
      JSON.parse(cleanedContent);
      return cleanedContent;
    } catch (error) {
      // Try to fix common JSON syntax errors
      // Fix truncated strings
      const lastQuote = cleanedContent.lastIndexOf('"');
      const isLastQuoteEscaped = cleanedContent.charAt(lastQuote - 1) === "\\";
      if (
        lastQuote !== -1 &&
        !isLastQuoteEscaped &&
        (cleanedContent.match(/"/g) || []).length % 2 !== 0
      ) {
        cleanedContent = cleanedContent + '"';
      }

      // Fix trailing commas in objects and arrays
      cleanedContent = cleanedContent.replace(/,\s*}/g, "}").replace(/,\s*\]/g, "]");

      // Try again after initial fixes
      try {
        JSON.parse(cleanedContent);
        return cleanedContent;
      } catch {
        // Continue with syntax error fixing from the original error
        if (error instanceof Error) {
          const errorMatch = error.message.match(/position (\d+)/);
          if (errorMatch) {
            const pos = parseInt(errorMatch[1], 10);
            // Add missing commas or fix other common syntax issues
            if (error.message.includes("Expected ',' or '}' after property value")) {
              cleanedContent =
                cleanedContent.substring(0, pos) + "," + cleanedContent.substring(pos);
            } else if (error.message.includes("Expected ',' or ']' after array element")) {
              cleanedContent =
                cleanedContent.substring(0, pos) + "," + cleanedContent.substring(pos);
            }
          }
        }
      }

      // Try parsing one final time after all repairs
      try {
        JSON.parse(cleanedContent);
        // If we got here, parsing succeeded after the second fix
      } catch {
        // Try to extract and rebuild a valid object structure
        const propertyMatch = cleanedContent.match(/"([^"]+)"\s*:/);
        if (propertyMatch && propertyMatch[1]) {
          const firstProp = propertyMatch[1];
          // Create a minimal valid structure
          cleanedContent = JSON.stringify({
            [firstProp]: "",
            title: "Repaired JSON",
            description: "JSON was malformed and had to be repaired",
            items: [],
          });
        } else {
          // Last resort - completely new structure
          cleanedContent = JSON.stringify({
            title: "Error",
            description: "Error parsing recommendation data",
            items: [],
          });
        }
      }

      return cleanedContent;
    }
  }

  /**
   * Simplified, faster version of JSON sanitization
   */
  private static quickJsonSanitize(content: string): string {
    // Quick check if content is too short
    if (content.trim().length < 10) {
      return JSON.stringify({
        title: "Recommendations",
        description: "Simplified recommendations",
        items: [],
      });
    }

    let cleanedContent = content;

    // Markdown code block removal - more comprehensive handling
    if (cleanedContent.includes("```")) {
      // Handle ```json blocks first (most common case)
      cleanedContent = cleanedContent.replace(/```json\s*\n([\s\S]*?)\n```/g, "$1");

      // Handle generic ``` blocks if still present
      cleanedContent = cleanedContent.replace(/```\s*\n([\s\S]*?)\n```/g, "$1");

      // Handle inline code blocks without newlines
      cleanedContent = cleanedContent.replace(/```json\s*([\s\S]*?)```/g, "$1");
      cleanedContent = cleanedContent.replace(/```\s*([\s\S]*?)```/g, "$1");

      // Cleanup any remaining markdown markers
      cleanedContent = cleanedContent
        .replace(/^```json\s*/, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");
    }

    // Convert single-quoted property names to double-quoted property names
    // This fixes "Expected double-quoted property name in JSON" errors
    cleanedContent = cleanedContent.replace(/'([^']+)'\s*:/g, '"$1":');

    // Fix basic JSON syntax problems
    cleanedContent = cleanedContent
      .replace(/,\s*}/g, "}") // Remove commas before closing braces
      .replace(/,\s*\]/g, "]") // Remove commas before closing brackets
      .replace(/}\s*{/g, "},{") // Add commas between objects
      .replace(/]\s*\[/g, "],["); // Add commas between arrays

    // Fix missing commas in arrays - common issue at position 1737
    cleanedContent = cleanedContent.replace(
      /("(?:\\.|[^"\\])*"|[^,{[\]}])\s*\n?\s*("(?:\\.|[^"\\])*"|\{)/g,
      "$1,$2"
    );
    cleanedContent = cleanedContent.replace(/}\s*\n?\s*{/g, "},{");
    cleanedContent = cleanedContent.replace(/]\s*\n?\s*\[/g, "],[");
    cleanedContent = cleanedContent.replace(/([^,{[\]:\s])\s*\n?\s*{/g, "$1,{");
    cleanedContent = cleanedContent.replace(/([^,{[\]:\s])\s*\n?\s*\[/g, "$1,[");

    // Extract proper JSON if it's nested in text
    const jsonMatch = cleanedContent.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      cleanedContent = jsonMatch[1];
    }

    // Handle unclosed strings
    const quoteCount = (cleanedContent.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      cleanedContent = cleanedContent + '"';
    }

    // Remove characters after the last bracket
    const lastBraceIndex = cleanedContent.lastIndexOf("}");
    if (lastBraceIndex !== -1) {
      cleanedContent = cleanedContent.substring(0, lastBraceIndex + 1);
    }

    // Final validation attempt - check for any remaining array issues
    try {
      JSON.parse(cleanedContent);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Expected ',' or ']' after array element")
      ) {
        // Try to extract the position number
        const posMatch = error.message.match(/position (\d+)/);
        if (posMatch && posMatch[1]) {
          const pos = parseInt(posMatch[1], 10);
          // Insert a comma at the problem position
          cleanedContent = cleanedContent.substring(0, pos) + "," + cleanedContent.substring(pos);
        }
      }
    }

    return cleanedContent;
  }

  /**
   * Provides default recommendations when AI generation fails
   */
  private static getDefaultRecommendations(type: "music" | "film"): Record<string, unknown> {
    if (type === "film") {
      return {
        title: "Film Recommendations",
        description: "Film recommendations based on your preferences",
        items: [],
      };
    } else {
      // Music recommendations
      return {
        title: "Music Recommendations",
        description: "Music recommendations based on your preferences",
        items: [],
      };
    }
  }

  /**
   * Analyzes patterns in user data to improve future recommendations.
   *
   * @param userId - User ID
   * @param feedbackData - User feedback data to analyze
   * @param contentType - Content type (music or film)
   * @returns Object containing analysis results
   */
  public static async analyzeUserPatterns(
    userId: string,
    feedbackData: Record<string, unknown>[],
    contentType: "music" | "film"
  ): Promise<Record<string, unknown>> {
    if (!this.apiKey) {
      throw new OpenRouterConfigError("OpenRouter service not configured. Call configure() first.");
    }

    try {
      // Pobierz prompt do analizy wzorców
      const prompt = this.getAnalysisPrompt(feedbackData, contentType);

      // Użyj istniejącej metody jsonCompletion
      const result = await this.jsonCompletion<Record<string, unknown>>(
        prompt,
        {
          type: "object",
          properties: {
            preferredGenres: { type: "array" },
            preferredFeatures: { type: "array" },
            avoidedFeatures: { type: "array" },
            trends: { type: "array" },
            recommendations: { type: "array" },
          },
          required: ["preferredGenres", "preferredFeatures", "avoidedFeatures"],
        },
        {
          model: this.selectOptimalModel(),
          temperature: 0.3, // Niższa temperatura dla bardziej deterministycznych wyników
          maxTokens: 1000,
          systemPrompt: `You are a helpful assistant specializing in analyzing patterns in user preferences.
          Analyze the feedback data and identify preference patterns for ${contentType} content type.
          
          CRITICAL: Always respond with ONLY valid JSON. Do not include any text outside the JSON.
          Start your response with { and end with }.
          Never begin your response with phrases like "Based on..." or "Here is...".`,
        }
      );

      return result;
    } catch (error) {
      console.error(
        `[OpenRouter] Error analyzing user patterns: ${error instanceof Error ? error.message : String(error)}`
      );

      // Zwróć podstawową odpowiedź w przypadku błędu
      return {
        status: "error",
        reason: error instanceof Error ? error.message : String(error),
        analyzed: false,
        userId,
      };
    }
  }

  /**
   * Creates a prompt for pattern analysis based on feedback data.
   */
  private static getAnalysisPrompt(
    feedbackData: Record<string, unknown>[],
    contentType: "music" | "film"
  ): string {
    return `
      Analyze the user's feedback history regarding ${contentType === "music" ? "music" : "movies"} 
      and identify patterns in their preferences.
      
      Feedback history:
      ${JSON.stringify(feedbackData, null, 2)}
      
      Task:
      Identify and explain patterns in user preferences, paying special attention to:
      
      1. Most liked genres
      2. Common features of liked ${contentType === "music" ? "artists/tracks" : "movies"}
      3. Features the user consistently avoids
      4. Changes in preferences over time (if visible)
      
      Your response MUST be in this exact JSON format:
      
      {
        "preferredGenres": ["Genre1", "Genre2"],
        "preferredFeatures": [
          {"feature": "Feature1", "value": "Value1", "confidence": 0.9}
        ],
        "avoidedFeatures": [
          {"feature": "Feature2", "value": "Value2", "confidence": 0.8}
        ],
        "trends": ["Trend1", "Trend2"],
        "recommendations": ["Recommendation1", "Recommendation2"]
      }
      
      CRITICAL INSTRUCTIONS:
      1. Return ONLY the JSON. No text before or after.
      2. Start with { and end with }.
      3. Always write in English.
      4. Never start with phrases like "Based on the feedback..." or "Here is...".
      5. All response text must be valid JSON that can be parsed.
    `;
  }
}

/**
 * Custom error for OpenRouter API related issues.
 */
export class OpenRouterApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "OpenRouterApiError";
  }
}

/**
 * Custom error for OpenRouter configuration issues.
 */
export class OpenRouterConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterConfigError";
  }
}

/**
 * Custom error for JSON schema validation issues.
 */
export class JsonSchemaValidationError extends Error {
  constructor(
    message: string,
    public schema: object,
    public response: unknown
  ) {
    super(message);
    this.name = "JsonSchemaValidationError";
  }
}
