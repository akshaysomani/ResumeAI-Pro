import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:Akfire1804%3F%3F%3F@localhost:5432/AI_resume_Builder";

if (!connectionString && process.env.NODE_ENV === "development") {
  console.warn("DATABASE_URL environment variable is missing. Using fallback localhost connection.");
}

// Internal real Pool instance
const realPool = new Pool({
  connectionString,
  ssl: false,
});

let isMockMode = false;

// Mock database storage
const mockDb = {
  profiles: [] as any[],
  audit_logs: [] as any[],
  user_consents: [] as any[],
  resumes: [] as any[],
};

// Log warning once
let warned = false;
const ensureWarned = () => {
  if (!warned) {
    console.warn("⚠️ Database connection failed or refused. Running ResumeAI Pro using in-memory mock database.");
    warned = true;
  }
};

// Helper to extract single-quoted strings from raw SQL text
function extractSingleQuotedStrings(sql: string): string[] {
  const matches: string[] = [];
  const regex = /'([^']*)'/g;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

// Mock Query Runner
async function runMockQuery(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
  ensureWarned();
  const sql = text.replace(/\s+/g, " ").trim().toLowerCase();

  // 1. SELECT 1
  if (sql.includes("select 1 as ping") || sql === "select 1;") {
    return { rows: [{ ping: 1 }], rowCount: 1 };
  }

  // 2. SELECT COUNT(*) FROM public.profiles
  if (sql.includes("select count(*)") && sql.includes("profiles")) {
    return { rows: [{ count: mockDb.profiles.length.toString() }], rowCount: 1 };
  }

  // 3. DELETE FROM public.profiles WHERE id = $1
  if (sql.includes("delete from public.profiles") || sql.includes("delete from profiles")) {
    const id = params[0];
    mockDb.profiles = mockDb.profiles.filter(p => p.id !== id);
    // Cascade delete logs and consents
    mockDb.audit_logs = mockDb.audit_logs.filter(l => l.user_id !== id);
    mockDb.user_consents = mockDb.user_consents.filter(c => c.user_id !== id);
    return { rows: [], rowCount: 1 };
  }

  // 4. INSERT INTO public.profiles
  if (sql.includes("insert into public.profiles") || sql.includes("insert into profiles")) {
    // VALUES ($1, $2, $3...)
    const id = params[0];
    let email = params[1];
    let fullName = params[2];
    if (!email || !fullName) {
      const literals = extractSingleQuotedStrings(text);
      email = email || literals[0];
      fullName = fullName || literals[1];
    }
    const existing = mockDb.profiles.find(p => p.id === id);
    if (!existing) {
      mockDb.profiles.push({
        id,
        email: email || "",
        full_name: fullName || "User Account",
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    return { rows: [], rowCount: 1 };
  }

  // 5. UPDATE public.profiles
  if (sql.includes("update public.profiles") || sql.includes("update profiles")) {
    // SET email = $1 WHERE id = $2
    const [email, id] = params;
    const profile = mockDb.profiles.find(p => p.id === id);
    if (profile) {
      profile.email = email;
      profile.updated_at = new Date();
    }
    return { rows: [], rowCount: 1 };
  }

  // 6. SELECT * FROM public.profiles WHERE id = $1
  if (sql.includes("select * from public.profiles where id = $1") || (sql.includes("select * from public.profiles") && sql.includes("id = $1"))) {
    const id = params[0];
    const rows = mockDb.profiles.filter(p => p.id === id);
    return { rows, rowCount: rows.length };
  }

  // 7. SELECT id FROM public.profiles WHERE email = $1
  if (sql.includes("select id from public.profiles where email = $1") || (sql.includes("select id from public.profiles") && sql.includes("email = $1"))) {
    const email = params[0];
    const rows = mockDb.profiles.filter(p => p.email === email).map(p => ({ id: p.id }));
    return { rows, rowCount: rows.length };
  }

  // 8. INSERT INTO public.audit_logs
  if (sql.includes("insert into public.audit_logs") || sql.includes("insert into audit_logs")) {
    const userId = params[0];
    let action = params[1];
    let severity = params[2];
    let details = params[3];
    if (!action || !severity) {
      const literals = extractSingleQuotedStrings(text);
      action = action || literals[0];
      severity = severity || literals[1];
      details = details || literals[2];
    }
    const log = {
      id: Math.random().toString(),
      user_id: userId,
      action,
      severity,
      details: typeof details === "string" ? JSON.parse(details) : details,
      created_at: new Date()
    };
    mockDb.audit_logs.push(log);
    return { rows: [], rowCount: 1 };
  }

  // 9. SELECT * FROM public.audit_logs
  if (sql.includes("select * from public.audit_logs") || sql.includes("select * from audit_logs")) {
    const userId = params[0];
    const rows = mockDb.audit_logs.filter(l => l.user_id === userId);
    return { rows, rowCount: rows.length };
  }

  // 10. INSERT INTO public.user_consents
  if (sql.includes("insert into public.user_consents") || sql.includes("insert into user_consents")) {
    const [userId, essential, analytical, marketing, retention] = params;
    const consent = {
      user_id: userId,
      cookies_essential: essential,
      cookies_analytical: analytical,
      cookies_marketing: marketing,
      data_retention_days: retention,
      created_at: new Date(),
      updated_at: new Date()
    };
    mockDb.user_consents.push(consent);
    return { rows: [], rowCount: 1 };
  }

  // 11. SELECT * FROM public.user_consents
  if (sql.includes("select * from public.user_consents") || sql.includes("select * from user_consents")) {
    const userId = params[0];
    const rows = mockDb.user_consents.filter(c => c.user_id === userId);
    return { rows, rowCount: rows.length };
  }

  // Default fallback for any unhandled queries
  return { rows: [], rowCount: 0 };
}

// Export a robust proxy of the Pool
export const db = {
  async query(text: string, params?: any[]): Promise<any> {
    if (!isMockMode) {
      try {
        return await realPool.query(text, params);
      } catch (err: any) {
        if (err.code === "ECONNREFUSED" || err.message.includes("connect ECONNREFUSED") || err.message.includes("database")) {
          isMockMode = true;
        } else {
          throw err;
        }
      }
    }
    return runMockQuery(text, params);
  },

  async connect(): Promise<any> {
    if (!isMockMode) {
      try {
        const client = await realPool.connect();
        // Return real client
        return client;
      } catch (err: any) {
        if (err.code === "ECONNREFUSED" || err.message.includes("connect ECONNREFUSED")) {
          isMockMode = true;
        } else {
          throw err;
        }
      }
    }

    // Mock client implementation
    return {
      query: async (text: string, params?: any[]) => {
        return runMockQuery(text, params);
      },
      release: () => {},
    };
  },

  async end(): Promise<void> {
    if (!isMockMode) {
      await realPool.end();
    }
  }
};

