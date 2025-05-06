/**
 * Environment configuration
 * This file provides access to environment variables with fallbacks for development
 */

// Helper to safely access process.env in both Node.js and browser environments
const getProcessEnv = (key: string): string | undefined => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
};

// TMDB API Key for film recommendations
export const TMDB_API_KEY = import.meta.env.TMDB_API_KEY || getProcessEnv("TMDB_API_KEY") || "";

// OMDB API Key for film details (posters, directors, etc.)
export const OMDB_API_KEY = import.meta.env.OMDB_API_KEY || getProcessEnv("OMDB_API_KEY") || "";

// OpenRouter API Key for AI completions
export const OPENROUTER_API_KEY =
  import.meta.env.OPENROUTER_API_KEY || getProcessEnv("OPENROUTER_API_KEY") || "";
export const OPENROUTER_API_URL =
  import.meta.env.OPENROUTER_API_URL ||
  getProcessEnv("OPENROUTER_API_URL") ||
  "https://openrouter.ai/api/v1";
export const OPENROUTER_DEFAULT_MODEL =
  import.meta.env.OPENROUTER_DEFAULT_MODEL ||
  getProcessEnv("OPENROUTER_DEFAULT_MODEL") ||
  "qwen/qwen3-235b-a22b:free";

// Supabase configuration (from environment)
export const SUPABASE_URL =
  import.meta.env.SUPABASE_URL || getProcessEnv("SUPABASE_URL") || "http://127.0.0.1:54321";
// Use service role key for admin operations - this must be the service role key to bypass RLS
export const SUPABASE_KEY =
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
  getProcessEnv("SUPABASE_SERVICE_ROLE_KEY") ||
  import.meta.env.SUPABASE_KEY ||
  getProcessEnv("SUPABASE_KEY") ||
  "";

// Anon key for client-side operations (less privileged)
export const SUPABASE_ANON_KEY =
  import.meta.env.SUPABASE_ANON_KEY || getProcessEnv("SUPABASE_ANON_KEY") || "";

// Log key availability for debugging
