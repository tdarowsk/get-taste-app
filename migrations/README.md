# Database Migrations

This directory contains SQL migrations for the Supabase database schema.

## Current Migrations

- **add_content_columns_to_feedback.sql**: Adds `content_id` and `content_type` columns to the `recommendation_feedback` table, used to link feedback to specific content items.
- **add_movie_titles_mapping.sql**: Creates a `movies_mapping` table to map movie IDs to their actual titles, improving recommendations by replacing opaque IDs with meaningful titles.

## Running Migrations

To run all migrations, use:

```bash
npm run migrate
```

This will execute all SQL files in this directory against your Supabase database.

## Requirements

- Properly configured `.env` file with `SUPABASE_URL` and `SUPABASE_KEY`
- The `SUPABASE_KEY` should be the "service_role" key that has permissions to modify the database schema

## Creating New Migrations

1. Create a new SQL file in this directory with a descriptive name, prefixed with a timestamp if needed (e.g., `20230501_add_new_column.sql`)
2. Use idempotent SQL operations that check if changes are needed before applying them
3. Include comments explaining the purpose of the migration

Example format:

```sql
-- Migration: [Short description]
-- Description: [Detailed description]

-- Check if changes are needed before applying
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'your_table' AND column_name = 'your_column'
    ) THEN
        -- Make your changes
        ALTER TABLE your_table ADD COLUMN your_column TEXT;
    END IF;
END$$;
``` 