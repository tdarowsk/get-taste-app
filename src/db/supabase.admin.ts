import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../env.config";
import type { Database } from "./database.types";

/**
 * Helper function to recursively convert Symbol values to strings in an object
 */
function convertSymbolsToStrings(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Symbol directly
  if (typeof obj === "symbol") {
    return String(obj);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(convertSymbolsToStrings);
  }

  // Handle objects
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertSymbolsToStrings((obj as Record<string, unknown>)[key]);
      }
    }
    return result;
  }

  // Return other values unchanged
  return obj;
}

/**
 * Creates a Supabase admin client with the service role key
 * This client should ONLY be used on the server-side to bypass RLS
 * The key MUST be the service_role key, not the anon key
 */
let adminClient = null;

// Only create the client on the server
if (typeof window === "undefined") {
  try {
    // For service_role key to work correctly, we need to include auth.autoRefreshToken: false
    adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      // Disable retries on 4xx responses, as retry won't help with auth issues
      global: {
        // Force specific headers for all Supabase requests
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        fetch: (url, options) => {
          // Clone and modify options to handle Symbol values
          const modifiedOptions = { ...options };

          // Ensure proper Content-Type headers are set for all requests
          if (!modifiedOptions.headers) {
            modifiedOptions.headers = {};
          }

          // Handle Symbol values in body if present
          if (modifiedOptions.body && typeof modifiedOptions.body === "string") {
            try {
              // Parse, convert Symbols to strings, and stringify again
              const bodyObj = JSON.parse(modifiedOptions.body);
              const convertedBodyObj = convertSymbolsToStrings(bodyObj);
              modifiedOptions.body = JSON.stringify(convertedBodyObj);

              // Log the processed request body
            } catch (e) {}
          }

          // Handle Symbol values in headers
          if (modifiedOptions.headers) {
            const processedHeaders = convertSymbolsToStrings(modifiedOptions.headers) as Record<
              string,
              string
            >;
            modifiedOptions.headers = processedHeaders;
          }

          // Ensure Content-Type is set correctly
          if (!modifiedOptions.headers) {
            modifiedOptions.headers = {};
          }

          // Force these headers for ALL requests - must come after Symbol conversion
          modifiedOptions.headers = {
            ...(modifiedOptions.headers as Record<string, string>),
            "Content-Type": "application/json",
            Accept: "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          };

          // Intercept the URL to convert query parameters that might contain Symbol values
          let processedUrl = url;
          try {
            // Only process URL if it's a string
            if (typeof url === "string") {
              const urlObj = new URL(url);
              const params = urlObj.searchParams;
              params.forEach((value, key) => {
                if (typeof value === "symbol") {
                  params.set(key, String(value));
                }
              });
              processedUrl = urlObj.toString();
            } else if (url instanceof URL) {
              processedUrl = url.toString();
            }
          } catch (e) {}

          // Handle URL correctly based on its type
          let finalUrl = url;
          if (typeof processedUrl === "string") {
            finalUrl = processedUrl;
          } else if (processedUrl instanceof URL) {
            finalUrl = processedUrl.toString();
          }

          return fetch(finalUrl, modifiedOptions);
        },
      },
    });
  } catch (error) {}
}

export const supabaseAdmin = adminClient;
