#!/usr/bin/env node
/**
 * Script to run database migrations from the supabase/migrations directory
 * This can be used to apply migrations manually when needed
 *
 * Note: To run this script, ensure your package.json has "type": "module"
 * or rename this file to run-migrations.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import process from "process";

// Load environment variables
dotenv.config();

// Get current module path (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY are required");
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Path to the migrations directory
const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

// Get command line args
const args = process.argv.slice(2);
const specificMigration = args.length > 0 ? args[0] : null;

async function runMigrations() {
  try {
    console.log("Starting migrations...");

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Error: Migrations directory not found at ${migrationsDir}`);
      process.exit(1);
    }

    // Get all migration files and sort them
    let migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    // Only run specific migration if provided
    if (specificMigration) {
      const matchingFiles = migrationFiles.filter((file) => file.includes(specificMigration));
      if (matchingFiles.length === 0) {
        console.error(`Error: No migration file matching '${specificMigration}' found`);
        process.exit(1);
      }
      migrationFiles = matchingFiles;
      console.log(`Only running migrations matching: ${specificMigration}`);
    }

    console.log(`Found ${migrationFiles.length} migration files to process`);

    // Run each migration file
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, "utf8");

      console.log(`Running migration: ${file}`);

      // Execute the SQL
      const { error } = await supabase.rpc("exec_sql", { sql });

      if (error) {
        console.error(`Error running migration ${file}:`, error);
        // Continue with other migrations
      } else {
        console.log(`✅ Successfully applied migration: ${file}`);
      }
    }

    console.log("All migrations completed");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
