"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types";
import { getUserProfile } from "@/app/actions/profileActions";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const data = await getUserProfile(userId);

      if (!data) {
        // Safe check for missing profile row during setup
        console.warn("Could not fetch profile, setting placeholder details");
        setProfile({
          id: userId,
          email: user?.email || "",
          fullName: "User Account",
        });
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile details:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Helper to read mock cookie
    const getMockUser = () => {
      if (typeof window === "undefined") return null;
      const cookies = document.cookie.split("; ");
      const mockCookie = cookies.find((row) => row.startsWith("mock_user="));
      if (mockCookie) {
        try {
          return JSON.parse(decodeURIComponent(mockCookie.split("=")[1]));
        } catch (e) {}
      }
      return null;
    };

    // 1. Initial auth check
    const checkUser = async () => {
      try {
        let sessionUser = null;
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user) {
            sessionUser = session.user;
          }
        } catch (e) {}

        if (!sessionUser) {
          sessionUser = getMockUser();
        }
        
        if (sessionUser) {
          setUser(sessionUser);
          await fetchProfile(sessionUser.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Error during initial auth verification:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        let sessionUser = session?.user || null;
        if (!sessionUser) {
          sessionUser = getMockUser();
        }

        setUser(sessionUser);
        if (sessionUser) {
          await fetchProfile(sessionUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
      
      // Clear mock cookie
      if (typeof window !== "undefined") {
        document.cookie = "mock_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
