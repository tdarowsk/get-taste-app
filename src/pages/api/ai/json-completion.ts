import { OpenRouterService } from "../../../lib/services/openrouter.service";
import type { APIRoute } from "astro";
import { z } from "zod";

// Schema for input validation
const jsonCompletionRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  schema: z.record(z.any()),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  schemaName: z.string().optional(),
  strict: z.boolean().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the input
    const validatedData = jsonCompletionRequestSchema.safeParse(body);

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

    const { message, schema, model, systemPrompt, temperature, maxTokens, schemaName, strict } = validatedData.data;

    // Call OpenRouter service
    const response = await OpenRouterService.jsonCompletion(message, schema, {
      model,
      systemPrompt,
      temperature,
      maxTokens,
      schemaName,
      strict,
    });

    // Return the API response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in AI JSON completion endpoint:", error);

    // Return appropriate error response
    return new Response(
      JSON.stringify({
        error: "Failed to process JSON completion request",
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
