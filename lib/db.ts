import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:Akfire1804%3F%3F%3F@localhost:5432/AI_resume_Builder";

if (!connectionString && process.env.NODE_ENV === "development") {
  console.warn("DATABASE_URL environment variable is missing. Using fallback localhost connection.");
}

export const db = new Pool({
  connectionString,
  // Disable SSL for local connections
  ssl: false,
});
