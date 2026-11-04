import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { applyTheme, readStoredTheme } from '../lib/theme';

export type Portal = 'work' | 'study';

export interface PortalSession {
  portal: Portal;
  email: string;
  signedInAt: string;
  remember: boolean;
}

interface Credentials {
  email: string;
  password: string;
}

const SESSION_KEYS: Record<Portal, string> = {
  work: 'personal-tracker:work-session',
  study: 'personal-tracker:study-session',
};

const OWNER_CREDENTIALS: Record<Portal, Credentials> = {
  work: {
    email: import.meta.env.VITE_WORK_EMAIL || 'annamalai@personal.workspace',
    password: import.meta.env.VITE_WORK_PASSWORD || 'work1234',
  },
  study: {
    email: import.meta.env.VITE_STUDY_EMAIL || 'study@personal.workspace',
    password: import.meta.env.VITE_STUDY_PASSWORD || 'study1234',
  },
};

function readSession(portal: Portal): PortalSession | null {
  const key = SESSION_KEYS[portal];
  try {
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalSession;
    if (parsed.portal !== portal || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  sessions: Record<Portal, PortalSession | null>;
  isAuthenticated: (portal: Portal) => boolean;
  login: (
    portal: Portal,
    email: string,
    password: string,
    remember: boolean,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: (portal: Portal) => void;
  demoCredentials: Record<Portal, Credentials>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Record<Portal, PortalSession | null>>(() => ({
    work: readSession('work'),
    study: readSession('study'),
  }));

  useEffect(() => {
    applyTheme(readStoredTheme('light'));
  }, []);

  const login = useCallback<AuthContextValue['login']>(
    async (portal, email, password, remember) => {
      const owner = OWNER_CREDENTIALS[portal];
      const normalized = email.trim().toLowerCase();
      await new Promise((resolve) => window.setTimeout(resolve, 420));

      if (normalized !== owner.email.toLowerCase()) {
        return { ok: false, error: 'No owner account matches that email address.' };
      }
      if (password !== owner.password) {
        return { ok: false, error: 'Incorrect password. Please try again.' };
      }

      const session: PortalSession = {
        portal,
        email: normalized,
        signedInAt: new Date().toISOString(),
        remember,
      };
      try {
        localStorage.removeItem(SESSION_KEYS[portal]);
        sessionStorage.removeItem(SESSION_KEYS[portal]);
        (remember ? localStorage : sessionStorage).setItem(
          SESSION_KEYS[portal],
          JSON.stringify(session),
        );
      } catch {
        // The in-memory session still grants access for this tab.
      }
      setSessions((current) => ({ ...current, [portal]: session }));
      return { ok: true };
    },
    [],
  );

  const logout = useCallback((portal: Portal) => {
    try {
      localStorage.removeItem(SESSION_KEYS[portal]);
      sessionStorage.removeItem(SESSION_KEYS[portal]);
    } catch {
      // Ignore storage limitations while signing out.
    }
    setSessions((current) => ({ ...current, [portal]: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      sessions,
      isAuthenticated: (portal) => Boolean(sessions[portal]),
      login,
      logout,
      demoCredentials: OWNER_CREDENTIALS,
    }),
    [sessions, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
