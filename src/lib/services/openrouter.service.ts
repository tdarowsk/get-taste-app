import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  ModelInfo,
  ResponseFormat,
} from "../../types";

/**
 * OpenRouter service for interacting with various LLM providers through OpenRouter.ai.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class OpenRouterService {
  private static apiKey: string;
  private static defaultModel = "anthropic/claude-3-opus-20240229";
  private static defaultSystemPrompt: string | undefined;
  private static readonly baseUrl = "https://openrouter.ai/api/v1";

  /**
   * Configures the OpenRouter service with API key and default parameters.
   */
  public static configure(
    apiKey: string,
    defaultModel = "anthropic/claude-3-opus-20240229",
    defaultSystemPrompt?: string
  ): void {
    if (!apiKey) {
      throw new OpenRouterConfigError("API key is required");
    }

    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
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

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
    }
  ): Promise<T> {
    const responseFormat: ResponseFormat = {
      type: "json_schema",
      json_schema: {
        name: options?.schemaName || "json_response",
        strict: options?.strict !== undefined ? options.strict : true,
        schema: jsonSchema,
      },
    };

    const response = await this.chatCompletion(userMessage, {
      ...options,
      responseFormat,
    });

    let parsedResponse: T;
    try {
      parsedResponse = JSON.parse(response.choices[0].message.content) as T;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      throw new JsonSchemaValidationError(
        "Failed to parse JSON response",
        jsonSchema,
        response.choices[0].message.content
      );
    }

    if (!this.validateJsonResponse(parsedResponse, jsonSchema)) {
      throw new JsonSchemaValidationError("Response does not match the provided schema", jsonSchema, parsedResponse);
    }

    return parsedResponse;
  }

  /**
   * Fetches the list of available models from OpenRouter API.
   */
  public static async listModels(): Promise<ModelInfo[]> {
    if (!this.apiKey) {
      throw new OpenRouterConfigError("OpenRouter service not configured. Call configure() first.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      return await this.processResponse<ModelInfo[]>(response);
    } catch (error: unknown) {
      if (error instanceof OpenRouterApiError || error instanceof OpenRouterConfigError) {
        throw error;
      }

      throw new OpenRouterApiError(`Failed to list models: ${error instanceof Error ? error.message : String(error)}`);
    }
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
      Authorization: `Bearer ${this.apiKey}`,
      "HTTP-Referer": "https://api.openrouter.ai/", // Replace with your actual domain
      "X-Title": "10xCards", // Replace with your application name
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
   * Processes the response from OpenRouter API.
   */
  private static async processResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        errorData = await response.text();
      }

      throw new OpenRouterApiError(`API request failed with status ${response.status}`, response.status, errorData);
    }

    return (await response.json()) as T;
  }

  /**
   * Validates the JSON response against the provided schema.
   * This is a simple implementation and could be expanded with a proper JSON schema validator.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static validateJsonResponse(response: unknown, schema: object): boolean {
    // Simple validation - in a real implementation, use a proper JSON schema validator
    try {
      // Basic validation - check if response is an object
      if (typeof response !== "object" || response === null) {
        return false;
      }

      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return false;
    }
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
 * Error for configuration issues.
 */
export class OpenRouterConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterConfigError";
  }
}

/**
 * Error for JSON schema validation failures.
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
