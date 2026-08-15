"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { authApi, usersApi, type UserStatsSummary } from "./api-client";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isPremium: boolean;
  role?: string;
  currentLevel?: string;
}

export interface UserContextValue {
  user: UserProfile | null;
  stats: UserStatsSummary | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
  refetchStats: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue>({
  user: null,
  stats: null,
  loading: true,
  refetchUser: async () => {},
  refetchStats: async () => {},
});

export function UserProvider({
  children,
  initialUser = null,
}: Readonly<{ children: React.ReactNode; initialUser?: UserProfile | null }>) {
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [stats, setStats] = useState<UserStatsSummary | null>(null);
  const [loading, setLoading] = useState(!initialUser);

  const refetchStats = useCallback(async () => {
    try {
      const summary = await usersApi.getStatsSummary();
      setStats(summary);
    } catch {
      // ignore
    }
  }, []);

  const refetchUser = useCallback(async () => {
    try {
      const profile = await authApi.me();
      if (profile && profile.id) {
        setUser(profile);
        await refetchStats();
      } else {
        setUser(null);
        setStats(null);
      }
    } catch {
      setUser(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [refetchStats]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profile = await authApi.me();
        if (!cancelled) {
          if (profile && profile.id) {
            setUser(profile);
            const summary = await usersApi.getStatsSummary().catch(() => null);
            if (!cancelled && summary) {
              setStats(summary);
            }
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ user, stats, loading, refetchUser, refetchStats }),
    [user, stats, loading, refetchUser, refetchStats]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

