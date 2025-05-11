import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Ensure required environment variables are set
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "ERROR: Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY)"
  );
  process.exit(1);
}

// Create Supabase client with service key for admin privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigrations() {
  try {
    console.log("Starting database migrations...");

    // Path to migrations directory
    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

    // Check if directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error(`ERROR: Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }

    // Read migration files, sorted by name (which should include timestamp)
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    // Run each migration file
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      // Execute the SQL
      const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

      if (error) {
        console.error(`ERROR running migration ${file}:`, error);

        // If it's not a 'relation already exists' error, stop the migrations
        if (!error.message.includes("already exists")) {
          process.exit(1);
        } else {
          console.log(`WARN: Table already exists error, continuing...`);
        }
      } else {
        console.log(`✓ Successfully ran migration: ${file}`);
      }
    }

    console.log("✅ All migrations completed successfully!");
  } catch (error) {
    console.error("ERROR during migrations:", error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
