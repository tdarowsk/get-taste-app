import { OpenRouterService } from "../../../lib/services/openrouter.service";
import type { APIRoute } from "astro";
import { z } from "zod";

// Schema for input validation
const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the input
    const validatedData = chatRequestSchema.safeParse(body);

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: validatedData.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { message, model, systemPrompt, temperature, maxTokens } = validatedData.data;

    // Call OpenRouter service
    const response = await OpenRouterService.chatCompletion(message, {
      model,
      systemPrompt,
      temperature,
      maxTokens,
    });

    // Return the API response
    return new Response(
      JSON.stringify({
        response: response.choices[0].message.content,
        model: response.model,
        usage: response.usage,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Return appropriate error response
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Export prerender as false since this is a dynamic API endpoint
export const prerender = false;
