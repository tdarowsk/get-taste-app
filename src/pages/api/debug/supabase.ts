import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../../../env.config";
import type { Database } from "../../../db/database.types";

export const prerender = false;

/**
 * Debug endpoint to test Supabase connection and RLS bypass
 *
 * GET /api/debug/supabase
 */
export const GET: APIRoute = async () => {
  try {
    // Log environment variables (masking the key)

    if (SUPABASE_KEY) {
      // Key is available, proceed with admin client creation
    } else {
      // Key is missing, will likely cause connection issues
    }

    // Create admin client
    const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Test connection

    const { error } = await supabaseAdmin.from("recommendations").select("count()");

    if (error) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to connect to Supabase",
          error: error instanceof Error ? error.message : String(error),
          details: error,
          envVars: {
            supabaseUrl: SUPABASE_URL,
            keyAvailable: !!SUPABASE_KEY,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Test inserting a record with service role

    const testUser = "test-user-" + Date.now();
    const insertResult = await supabaseAdmin
      .from("recommendations")
      .insert({
        user_id: testUser,
        type: "film",
        data: { test: true },
      })
      .select();

    if (insertResult.error) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to insert test record",
          error: insertResult.error.message,
          connectionSucceeded: true,
          envVars: {
            supabaseUrl: SUPABASE_URL,
            keyAvailable: !!SUPABASE_KEY,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete the test record if it was created
    if (insertResult.data && insertResult.data.length > 0) {
      const id = insertResult.data[0].id;
      await supabaseAdmin.from("recommendations").delete().eq("id", id);
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Successfully connected to Supabase and performed test operations",
        connectionSucceeded: true,
        insertSucceeded: !!insertResult.data,
        envVars: {
          supabaseUrl: SUPABASE_URL,
          keyAvailable: !!SUPABASE_KEY,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Unexpected error testing Supabase connection",
        error: error instanceof Error ? error.message : String(error),
        envVars: {
          supabaseUrl: SUPABASE_URL,
          keyAvailable: !!SUPABASE_KEY,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
