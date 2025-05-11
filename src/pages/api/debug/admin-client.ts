import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../db/supabase.admin";
import { supabaseClient } from "../../../db/supabase.client";
import { SUPABASE_URL, SUPABASE_KEY } from "../../../env.config";

export const prerender = false;

/**
 * Debug endpoint to test Supabase connection and RLS bypass
 * GET /api/debug/admin-client
 */
export const GET: APIRoute = async () => {
  try {
    console.log("Testing admin client");

    // Sprawdź konfigurację
    const configInfo = {
      supabaseUrl: SUPABASE_URL,
      hasSupabaseKey: !!SUPABASE_KEY,
      keyLength: SUPABASE_KEY ? SUPABASE_KEY.length : 0,
      isKeyService: SUPABASE_KEY?.startsWith("eyJ") || false,
      isRunningOnServer: typeof window === "undefined",
    };

    console.log("Config info:", configInfo);

    // Sprawdź, czy klient administratora istnieje
    if (!supabaseAdmin) {
      console.error("Admin client is null");
      return new Response(
        JSON.stringify({
          error: "Admin client is null",
          clientExists: false,
          configInfo,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Admin client exists, testing functionality");

    // Spróbuj wykonać prostą operację z klientem administratora
    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from("film_preferences")
      .select("count(*)");

    // Dla porównania, spróbuj tego samego z normalnym klientem
    const { data: clientTest, error: clientError } = await supabaseClient
      .from("film_preferences")
      .select("count(*)");

    // Spróbuj dodać testowy rekord
    const testUserId = "test-user-" + Date.now();
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("film_preferences")
      .upsert({
        user_id: testUserId,
        genres: ["Action", "Drama", "Test"],
      });

    return new Response(
      JSON.stringify(
        {
          adminClientExists: !!supabaseAdmin,
          configInfo,
          adminTest: adminTest,
          adminError: adminError
            ? {
                message: adminError.message,
                code: adminError.code,
                details: adminError.details,
              }
            : null,
          clientTest: clientTest,
          clientError: clientError
            ? {
                message: clientError.message,
                code: clientError.code,
                details: clientError.details,
              }
            : null,
          insertTest: {
            data: insertData,
            error: insertError
              ? {
                  message: insertError.message,
                  code: insertError.code,
                  details: insertError.details,
                }
              : null,
          },
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error testing admin client:", error);
    return new Response(
      JSON.stringify(
        {
          error: "Error testing admin client",
          details: error instanceof Error ? error.message : String(error),
        },
        null,
        2
      ),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
