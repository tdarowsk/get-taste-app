# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter service provides an abstraction layer for interacting with the OpenRouter API, which allows access to various large language models (LLMs) from providers like OpenAI, Anthropic, Google, and others. This service encapsulates the complexity of API calls, error handling, and response parsing while providing a clean interface for the application to use LLM capabilities.

## 2. Constructor

The service will be implemented as a class with static methods, following the pattern established in other services within the application. No constructor is needed as we'll use static methods for all operations.

## 3. Public Methods and Fields

### 3.1 Configuration

```typescript
/**
 * Configures the OpenRouter service with API key and default parameters.
 * Should be called once at application startup.
 *
 * @param apiKey - OpenRouter API key
 * @param defaultModel - Default model to use if not specified
 * @param defaultSystemPrompt - Default system prompt to use if not specified
 * @returns void
 * @throws Error if API key is invalid or missing
 */
public static configure(
  apiKey: string,
  defaultModel: string = "anthropic/claude-3-opus-20240229",
  defaultSystemPrompt?: string
): void
```

### 3.2 Chat Completion

```typescript
/**
 * Sends a chat completion request to OpenRouter API.
 *
 * @param userMessage - The user's message or query
 * @param options - Optional parameters (model, systemPrompt, responseFormat, etc.)
 * @returns The LLM response
 * @throws Error if the request fails or if the service is not configured
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
): Promise<ChatCompletionResponse>
```

### 3.3 JSON Completion

```typescript
/**
 * Sends a chat completion request to OpenRouter API with JSON response format.
 *
 * @param userMessage - The user's message or query
 * @param jsonSchema - The JSON schema that defines the response structure
 * @param options - Optional parameters (model, systemPrompt, etc.)
 * @returns The structured JSON response matching the provided schema
 * @throws Error if the request fails, if the service is not configured, or if the response doesn't match the schema
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
  }
): Promise<T>
```

### 3.4 Model List

```typescript
/**
 * Fetches the list of available models from OpenRouter API.
 *
 * @returns Array of available models with details
 * @throws Error if the request fails or if the service is not configured
 */
public static async listModels(): Promise<ModelInfo[]>
```

## 4. Private Methods and Fields

### 4.1 Configuration Storage

```typescript
/** OpenRouter API key */
private static apiKey: string;

/** Default model to use */
private static defaultModel: string;

/** Default system prompt */
private static defaultSystemPrompt: string | undefined;

/** Base URL for OpenRouter API */
private static readonly baseUrl = 'https://openrouter.ai/api/v1';
```

### 4.2 Request Construction

```typescript
/**
 * Constructs headers for OpenRouter API requests.
 *
 * @returns Headers object with API key and other required headers
 * @throws Error if the service is not configured
 */
private static getHeaders(): Record<string, string>

/**
 * Constructs the request body for chat completion.
 *
 * @param userMessage - The user's message
 * @param options - Optional parameters
 * @returns Request body object
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
  }
): ChatCompletionRequest
```

### 4.3 Response Handling

```typescript
/**
 * Processes the response from OpenRouter API.
 *
 * @param response - Fetch response object
 * @returns Processed response data
 * @throws Error if the response indicates a failure
 */
private static async processResponse<T>(response: Response): Promise<T>

/**
 * Validates the JSON response against the provided schema.
 *
 * @param response - The JSON response from the LLM
 * @param schema - The expected schema
 * @returns Boolean indicating if the response matches the schema
 */
private static validateJsonResponse(response: any, schema: object): boolean
```

## 5. Error Handling

The service will implement a comprehensive error handling strategy:

### 5.1 Error Types

```typescript
/**
 * Custom error for OpenRouter API related issues.
 */
export class OpenRouterApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
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
    public response: any
  ) {
    super(message);
    this.name = "JsonSchemaValidationError";
  }
}
```

### 5.2 Error Handling Implementation

The service will handle errors using a structured approach:

1. All API calls will be wrapped in try/catch blocks
2. Early validation of parameters and configurations
3. Proper error propagation with clear error messages
4. HTTP status code interpretation for better error diagnosis
5. Rate limit handling with exponential backoff for retries

## 6. Security Considerations

### 6.1 API Key Management

The API key should never be exposed to the client. All OpenRouter API calls should be made from the server side. The service will follow these practices:

1. Store API key in server-side environment variables
2. Never log the full API key
3. Implement API key rotation mechanism
4. Use different API keys for different environments (dev, staging, production)

### 6.2 User Input Sanitization

1. Sanitize user input before sending to OpenRouter API
2. Implement input length limitations to prevent token abuse
3. Detect and block potentially harmful prompts

### 6.3 Response Sanitization

1. Validate responses before returning to clients
2. Implement content filtering for inappropriate responses
3. Sanitize JSON responses to prevent injection attacks

## 7. Implementation Plan

### Step 1: Set Up Types

Create the necessary types for the OpenRouter service in `src/types.ts`:

```typescript
/* =========================
   OpenRouter API Integration
   ========================= */

/** Response format type for structured LLM responses */
export interface ResponseFormat {
  type: "json_schema";
  schema: object;
}

/** Chat message structure */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Chat completion request structure */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

/** Chat completion response structure */
export interface ChatCompletionResponse {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Model information structure */
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  capabilities: string[];
}
```

### Step 2: Implement the Service

Create the OpenRouter service file at `src/lib/services/openrouter.service.ts`:

```typescript
import type { ChatCompletionRequest, ChatCompletionResponse, ModelInfo, ResponseFormat } from "../../types";

/**
 * OpenRouter service for interacting with various LLM providers through OpenRouter.ai.
 */
export class OpenRouterService {
  private static apiKey: string;
  private static defaultModel: string = "anthropic/claude-3-opus-20240229";
  private static defaultSystemPrompt: string | undefined;
  private static readonly baseUrl = "https://openrouter.ai/api/v1";

  /**
   * Configures the OpenRouter service with API key and default parameters.
   */
  public static configure(
    apiKey: string,
    defaultModel: string = "anthropic/claude-3-opus-20240229",
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
    } catch (error) {
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
    }
  ): Promise<T> {
    const responseFormat: ResponseFormat = {
      type: "json_schema",
      schema: jsonSchema,
    };

    const response = await this.chatCompletion(userMessage, {
      ...options,
      responseFormat,
    });

    let parsedResponse: T;
    try {
      parsedResponse = JSON.parse(response.choices[0].message.content) as T;
    } catch (error) {
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
    } catch (error) {
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
    const messages = [];

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
      } catch (e) {
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
  private static validateJsonResponse(response: any, schema: object): boolean {
    // Simple validation - in a real implementation, use a proper JSON schema validator
    try {
      // Basic validation - check if response is an object
      if (typeof response !== "object" || response === null) {
        return false;
      }

      return true;
    } catch (error) {
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
    public response?: any
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
    public response: any
  ) {
    super(message);
    this.name = "JsonSchemaValidationError";
  }
}
```

### Step 3: Set Up Environment Variables

Add the required environment variables in your environment configuration:

```
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3-opus-20240229
OPENROUTER_DEFAULT_SYSTEM_PROMPT=You are a helpful assistant...
```

### Step 4: Initialize the Service

Initialize the service in your application startup code (e.g., in `src/middleware/index.ts`):

```typescript
import { OpenRouterService } from "../lib/services/openrouter.service";

// Initialize OpenRouter service
OpenRouterService.configure(
  import.meta.env.OPENROUTER_API_KEY,
  import.meta.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3-opus-20240229",
  import.meta.env.OPENROUTER_DEFAULT_SYSTEM_PROMPT
);
```

### Step 5: Usage Examples

#### Basic Chat Completion

```typescript
import { OpenRouterService } from "../lib/services/openrouter.service";

const response = await OpenRouterService.chatCompletion("Explain quantum computing in simple terms");


```

#### JSON Structured Response

```typescript
import { OpenRouterService } from "../lib/services/openrouter.service";

const schema = {
  type: "object",
  properties: {
    explanation: {
      type: "string",
      description: "Simple explanation of quantum computing",
    },
    keyPoints: {
      type: "array",
      items: {
        type: "string",
      },
      description: "Key points about quantum computing",
    },
  },
  required: ["explanation", "keyPoints"],
};

const response = await OpenRouterService.jsonCompletion<{
  explanation: string;
  keyPoints: string[];
}>("Explain quantum computing in simple terms", schema, {
  systemPrompt: "You are a science educator specializing in explaining complex topics in simple terms.",
});



```

#### Model List

```typescript
import { OpenRouterService } from "../lib/services/openrouter.service";

const models = await OpenRouterService.listModels();

```

### Step 6: Implement Error Handling

Example of using the service with proper error handling:

```typescript
import {
  OpenRouterService,
  OpenRouterApiError,
  OpenRouterConfigError,
  JsonSchemaValidationError,
} from "../lib/services/openrouter.service";

try {
  const response = await OpenRouterService.chatCompletion("Explain quantum computing in simple terms");

  
} catch (error) {
  if (error instanceof OpenRouterConfigError) {
    console.error("Configuration error:", error.message);
    // Handle configuration error (e.g., missing API key)
  } else if (error instanceof OpenRouterApiError) {
    console.error(`API error (${error.statusCode}):`, error.message);
    // Handle API error (e.g., rate limit, authentication failure)
  } else if (error instanceof JsonSchemaValidationError) {
    console.error("Schema validation error:", error.message);
    console.error("Expected schema:", error.schema);
    console.error("Received response:", error.response);
    // Handle schema validation error
  } else {
    console.error("Unexpected error:", error);
    // Handle unexpected errors
  }
}
```

```

```
