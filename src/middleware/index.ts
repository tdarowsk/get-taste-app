import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";
import { OpenRouterService } from "../lib/services/openrouter.service";

// Initialize OpenRouter service
const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;
const OPENROUTER_DEFAULT_MODEL = import.meta.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3-opus-20240229";
const OPENROUTER_DEFAULT_SYSTEM_PROMPT = import.meta.env.OPENROUTER_DEFAULT_SYSTEM_PROMPT;

if (OPENROUTER_API_KEY) {
  try {
    OpenRouterService.configure(OPENROUTER_API_KEY, OPENROUTER_DEFAULT_MODEL, OPENROUTER_DEFAULT_SYSTEM_PROMPT);
    console.log("OpenRouter service configured successfully");
  } catch (error) {
    console.error("Failed to configure OpenRouter service:", error);
  }
} else {
  console.warn("OPENROUTER_API_KEY not provided. OpenRouter service will not be available.");
}

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
