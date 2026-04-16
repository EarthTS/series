"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchUserById } from "@/lib/api/series-api";
import type { ContinueItem, Subscription, UserSession } from "@/lib/types";

const STORAGE_USER = "winter_user";
const STORAGE_SUB = "winter_subscription";
const STORAGE_CONTINUE = "winter_continue";

type AppStateValue = {
  user: UserSession | null;
  subscription: Subscription;
  continueWatching: ContinueItem[];
  adminSession: boolean;
  login: (user: UserSession) => void;
  logout: () => void;
  setSubscription: (sub: Subscription) => void;
  activateSubscriptionDays: (days: number) => void;
  setContinueWatching: (items: ContinueItem[]) => void;
  updateContinue: (item: ContinueItem) => void;
  adminLogout: () => void;
  hydrated: boolean;
};

const defaultSub: Subscription = { active: false, expiresAt: null };

const AppStateContext = createContext<AppStateValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [subscription, setSubscriptionState] = useState<Subscription>(defaultSub);
  const [continueWatching, setContinueWatchingState] = useState<ContinueItem[]>(
    []
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setUser(loadJson<UserSession | null>(STORAGE_USER, null));
      setSubscriptionState(loadJson<Subscription>(STORAGE_SUB, defaultSub));
      setContinueWatchingState(loadJson<ContinueItem[]>(STORAGE_CONTINUE, []));
      setHydrated(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    fetchUserById(user.id)
      .then((apiUser) => {
        if (!mounted || !apiUser) return;
        setUser((prev) => {
          if (!prev) return prev;
          const nextUser: UserSession = {
            id: apiUser.id || prev.id,
            name: apiUser.name || prev.name,
            email: apiUser.email || prev.email,
            isAdmin: apiUser.isAdmin,
            expiredDate: apiUser.expiredDate,
          };
          localStorage.setItem(STORAGE_USER, JSON.stringify(nextUser));
          return nextUser;
        });
      })
      .catch(() => {
        // Keep current session value when API is unavailable.
      });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const persistUser = useCallback((u: UserSession | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_USER, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_USER);
  }, []);

  const login = useCallback((nextUser: UserSession) => {
    persistUser(nextUser);
  }, [persistUser]);

  const logout = useCallback(() => {
    persistUser(null);
    setSubscriptionState(defaultSub);
    localStorage.removeItem(STORAGE_SUB);
    setContinueWatchingState([]);
    localStorage.removeItem(STORAGE_CONTINUE);
  }, [persistUser]);

  const setSubscription = useCallback((sub: Subscription) => {
    setSubscriptionState(sub);
    localStorage.setItem(STORAGE_SUB, JSON.stringify(sub));
  }, []);

  const activateSubscriptionDays = useCallback(
    (days: number) => {
      const start = new Date();
      const exp = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
      const sub: Subscription = { active: true, expiresAt: exp.toISOString() };
      setSubscription(sub);
    },
    [setSubscription]
  );

  const setContinueWatching = useCallback((items: ContinueItem[]) => {
    setContinueWatchingState(items);
    localStorage.setItem(STORAGE_CONTINUE, JSON.stringify(items));
  }, []);

  const updateContinue = useCallback(
    (item: ContinueItem) => {
      setContinueWatchingState((prev) => {
        const rest = prev.filter((p) => p.seriesId !== item.seriesId);
        const next = [item, ...rest].slice(0, 12);
        localStorage.setItem(STORAGE_CONTINUE, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const adminLogout = useCallback(() => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, isAdmin: false };
      localStorage.setItem(STORAGE_USER, JSON.stringify(next));
      return next;
    });
  }, []);

  const adminSession = Boolean(user?.isAdmin);

  const value = useMemo<AppStateValue>(
    () => ({
      user,
      subscription,
      continueWatching,
      adminSession,
      login,
      logout,
      setSubscription,
      activateSubscriptionDays,
      setContinueWatching,
      updateContinue,
      adminLogout,
      hydrated,
    }),
    [
      user,
      subscription,
      continueWatching,
      adminSession,
      login,
      logout,
      setSubscription,
      activateSubscriptionDays,
      setContinueWatching,
      updateContinue,
      adminLogout,
      hydrated,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export function subscriptionValid(sub: Subscription): boolean {
  if (!sub.active || !sub.expiresAt) return false;
  return new Date(sub.expiresAt) > new Date();
}

export function memberValidByExpiredDate(expiredDate: string | null): boolean {
  if (!expiredDate) return false;
  const exp = new Date(expiredDate);
  if (Number.isNaN(exp.getTime())) return false;
  return exp.getTime() > Date.now();
}
