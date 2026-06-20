const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Lightweight manual loader for .env.local variables
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

async function runMigration() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:Akfire1804%3F%3F%3F@localhost:5432/AI_resume_Builder";

  console.log("Parsing connection coordinates...");
  let targetDb = "AI_resume_Builder";
  let bootstrapUrl = connectionString;

  try {
    const parsedUrl = new URL(connectionString);
    targetDb = parsedUrl.pathname.substring(1) || "AI_resume_Builder";
    parsedUrl.pathname = "/postgres";
    bootstrapUrl = parsedUrl.toString();
  } catch (err) {
    console.warn("Could not parse connection string as URL. Proceeding with fallbacks.");
  }

  console.log(`Connecting to default database to check status of "${targetDb}"...`);
  const bootstrapClient = new Client({
    connectionString: bootstrapUrl,
  });

  try {
    await bootstrapClient.connect();
    const res = await bootstrapClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );

    if (res.rowCount === 0) {
      console.log(`Database "${targetDb}" does not exist. Creating database...`);
      await bootstrapClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Database "${targetDb}" created successfully.`);
    } else {
      console.log(`Database "${targetDb}" verified.`);
    }
  } catch (err) {
    console.error("Database status verification failed:", err.message);
  } finally {
    try {
      await bootstrapClient.end();
    } catch (e) {}
  }

  // 2. Connect to the target database and execute migrations
  console.log(`Connecting to "${targetDb}" database to run tables schema...`);
  const client = new Client({ connectionString });
  
  try {
    await client.connect();

    // Create schema_migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    
    const migrationsDir = path.join(__dirname, "../migrations");
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Sort alphabetically to execute in correct sequence

    console.log(`Found ${files.length} migration file(s) available.`);

    // Bootstrap tracker: check which tables exist to mark migrations as already applied
    const tableExists = async (table) => {
      const res = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table]);
      return res.rows[0].exists;
    };

    const bootstrapFiles = async () => {
      if (await tableExists("profiles")) {
        await client.query("INSERT INTO public.schema_migrations (filename) VALUES ('001_init_schema.sql') ON CONFLICT DO NOTHING");
        await client.query("INSERT INTO public.schema_migrations (filename) VALUES ('002_schema_enhancement.sql') ON CONFLICT DO NOTHING");
      }
      if (await tableExists("settings")) {
        await client.query("INSERT INTO public.schema_migrations (filename) VALUES ('003_editor_theme_config.sql') ON CONFLICT DO NOTHING");
        await client.query("INSERT INTO public.schema_migrations (filename) VALUES ('004_user_template_preferences.sql') ON CONFLICT DO NOTHING");
      }
      // Check if ai_generations table exists
      if (await tableExists("ai_generations")) {
        await client.query("INSERT INTO public.schema_migrations (filename) VALUES ('005_ai_generation_resume_ref.sql') ON CONFLICT DO NOTHING");
      }
      // Check if ats_analyses table exists
      if (await tableExists("ats_analyses")) {
        await client.query("INSERT INTO public.schema_migrations (filename) VALUES ('006_ats_matcher_enhancements.sql') ON CONFLICT DO NOTHING");
      }
      // Check if public_resume_links table exists
      if (await tableExists("public_resume_links")) {
        await client.query("INSERT INTO public.schema_migrations (filename) VALUES ('007_resume_sharing_and_exports.sql') ON CONFLICT DO NOTHING");
      }
      // Check if career_documents table exists
      if (await tableExists("career_documents")) {
        await client.query("INSERT INTO public.schema_migrations (filename) VALUES ('008_career_documents_suite.sql') ON CONFLICT DO NOTHING");
      }
    };

    await bootstrapFiles();

    // Query applied migrations
    const { rows } = await client.query("SELECT filename FROM public.schema_migrations");
    const applied = new Set(rows.map((r) => r.filename));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Migration already applied: ${file} (Skipping)`);
        continue;
      }

      console.log(`Executing migration file: ${file}...`);
      const schemaSql = fs.readFileSync(filePath = path.join(migrationsDir, file), "utf8");
      
      await client.query("BEGIN");
      try {
        await client.query(schemaSql);
        await client.query("INSERT INTO public.schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`Successfully completed migration: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
    
    console.log("All migrations executed successfully.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

runMigration();
