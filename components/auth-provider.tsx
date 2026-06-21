"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types";

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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Safe check for missing profile row during setup
        console.warn("Could not fetch profile, setting placeholder details:", error.message);
        setProfile({
          id: userId,
          email: user?.email || "",
          fullName: "User Account",
        });
        return;
      }

      // Map snake_case database response to camelCase JS properties
      if (data) {
        setProfile({
          id: data.id,
          email: data.email || user?.email || "",
          fullName: data.full_name || "",
          avatarUrl: data.avatar_url || "",
          headline: data.headline || "",
          summary: data.summary || "",
          website: data.website || "",
          github: data.github_url || "",
          linkedin: data.linkedin_url || "",
          portfolio: data.portfolio_url || "",
          phoneNumber: data.phone_number || "",
          location: data.location || "",
          dob: data.dob || "",
          gender: data.gender || "",
          country: data.country || "",
          twitterUrl: data.twitter_url || "",
          personalWebsite: data.personal_website || "",
          preferredLanguage: data.preferred_language || "",
          timezone: data.timezone || "",
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
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
