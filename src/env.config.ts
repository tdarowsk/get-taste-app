/**
 * Environment configuration
 * This file provides access to environment variables with fallbacks for development
 */

// TMDB API Key for film recommendations
export const TMDB_API_KEY = import.meta.env.TMDB_API_KEY || process.env.TMDB_API_KEY || "";

// OpenRouter API Key for AI completions
export const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "";

// Supabase configuration (from environment)
export const SUPABASE_URL = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || "http://127.0.0.1:54321";
export const SUPABASE_KEY = import.meta.env.SUPABASE_KEY || process.env.SUPABASE_KEY || "";
