// Simple script to run the content columns migration

import { createClient } from "@supabase/supabase-js";

// Hardcoded values for local development
const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

async function runMigration() {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Running content columns migration...");

    // Migration SQL
    const migrationSql = `
    -- First check if columns exist before adding them (idempotent migration)
    DO $$
    BEGIN
        -- Check if the recommendation_feedback table exists, rename it from recommendations_feedback if needed
        IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'recommendation_feedback'
        ) AND EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'recommendations_feedback'
        ) THEN
            ALTER TABLE public.recommendations_feedback RENAME TO recommendation_feedback;
        END IF;

        -- Check for content_id column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'recommendation_feedback' AND column_name = 'content_id'
        ) THEN
            ALTER TABLE public.recommendation_feedback ADD COLUMN content_id text;
            RAISE NOTICE 'Added content_id column to recommendation_feedback table';
        ELSE
            RAISE NOTICE 'content_id column already exists';
        END IF;

        -- Check for content_type column
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'recommendation_feedback' AND column_name = 'content_type'
        ) THEN
            ALTER TABLE public.recommendation_feedback ADD COLUMN content_type text;
            RAISE NOTICE 'Added content_type column to recommendation_feedback table';
        ELSE
            RAISE NOTICE 'content_type column already exists';
        END IF;
    END$$;

    -- Add appropriate indexes to improve query performance
    CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_content_id ON public.recommendation_feedback(content_id);
    CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_content_type ON public.recommendation_feedback(content_type);
    CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_content ON public.recommendation_feedback(user_id, content_type);
    `;

    // Execute the migration SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: migrationSql });

    if (error) {
      console.error("Error running migration:", error);
      process.exit(1);
    }

    console.log("✅ Migration completed successfully!");
    console.log(
      "The content_id and content_type columns have been added to the recommendation_feedback table."
    );
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

// Run the migration
runMigration();
