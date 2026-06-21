const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Load .env.local variables
try {
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const index = trimmed.indexOf("=");
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        let val = trimmed.substring(index + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    });
    console.log("Loaded environment variables from .env.local");
  }
} catch (e) {
  console.warn("Skipped loading .env.local file:", e.message);
}

async function run() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:Akfire1804%3F%3F%3F@localhost:5432/AI_resume_Builder";

  console.log("Connecting to Postgres database at:", connectionString);
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // Check if storage.buckets table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'storage' AND table_name = 'buckets'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log("storage.buckets table does not exist. Is local Supabase running?");
      return;
    }
    
    console.log("storage.buckets table exists. Inserting 'avatars' bucket...");
    await client.query(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('avatars', 'avatars', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Successfully created / verified avatars bucket!");
  } catch (err) {
    console.error("Database query failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
