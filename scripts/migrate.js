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
    
    const migrationsDir = path.join(__dirname, "../migrations");
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Sort alphabetically to execute in correct sequence

    console.log(`Found ${files.length} migration file(s) to execute.`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Executing migration file: ${file}...`);
      const schemaSql = fs.readFileSync(filePath, "utf8");
      await client.query(schemaSql);
      console.log(`Successfully completed migration: ${file}`);
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
