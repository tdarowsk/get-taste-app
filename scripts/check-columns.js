// Script to check if columns exist in recommendation_feedback table
/* eslint-env node */
/* global console, process */

// Import pg
import pg from "pg";
const { Pool } = pg;

async function checkColumns() {
  try {
    // Create connection pool
    const pool = new Pool({
      host: "127.0.0.1",
      port: 54322,
      database: "postgres",
      user: "postgres",
      password: "postgres",
    });

    console.log("🔍 Checking recommendation_feedback table structure...");

    // SQL to check columns
    const query = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'recommendation_feedback' 
    ORDER BY column_name;
    `;

    // Execute the query
    const result = await pool.query(query);

    console.log(
      "Table columns:",
      result.rows.map((row) => row.column_name)
    );

    // Specifically check for our new columns
    const hasContentId = result.rows.some((row) => row.column_name === "content_id");
    const hasContentType = result.rows.some((row) => row.column_name === "content_type");

    console.log("content_id column exists:", hasContentId);
    console.log("content_type column exists:", hasContentType);

    // Close the pool
    await pool.end();
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

// Run the check
checkColumns();
