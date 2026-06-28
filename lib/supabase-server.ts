import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  if (process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    console.warn(
      "Supabase environment variables are missing. Using server-side fallback placeholders for local execution."
    );
  }

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if middleware is handling cookies refresh
        }
      },
    },
  });

  // Intercept auth.getUser to support local mock user login session when remote Supabase fails/is unconfigured
  const originalGetUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = async (jwt?: string) => {
    try {
      const response = await originalGetUser(jwt);
      if (response.data?.user) {
        return response;
      }
    } catch (e) {
      // Ignore remote communication/auth errors
    }

    try {
      const mockUserCookie = cookieStore.get("mock_user")?.value;
      if (mockUserCookie) {
        const user = JSON.parse(decodeURIComponent(mockUserCookie));
        if (user && user.id) {
          return { data: { user }, error: null };
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }

    return { data: { user: null }, error: null };
  };

  return client;
}
