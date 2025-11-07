import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const SESSION_KEY = 'auth:session';
const ACCOUNTS_KEY = 'auth:accounts';

const DEFAULT_ACCOUNTS = [
  { username: 'admin@example.com', password: 'admin123', role: 'admin' },
  { username: 'user@example.com', password: 'user123', role: 'user' },
];

function loadAccounts() {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNTS;
  try {
    const stored = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!stored) return DEFAULT_ACCOUNTS;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.map((account) => ({ ...account }));
    }
  } catch (error) {
    // ignore malformed storage
  }
  return DEFAULT_ACCOUNTS;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [accounts, setAccounts] = useState(() => loadAccounts());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(SESSION_KEY);
      if (saved) setSession(JSON.parse(saved));
    } catch (error) {
      // ignore malformed session data
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (error) {
      // ignore persistence errors
    }
  }, [accounts]);

  const login = (username, password) => {
    const match = accounts.find((account) => account.username === username && account.password === password);
    if (!match) return { success: false };
    const next = { username: match.username, role: match.role, loggedInAt: Date.now() };
    setSession(next);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      }
    } catch (error) {
      // ignore storage errors
    }
    return { success: true, role: match.role };
  };

  const logout = () => {
    setSession(null);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      // ignore removal errors
    }
  };

  const updateAccount = (role, updates) => {
    let updatedAccount = null;
    setAccounts((prev) => {
      const next = prev.map((account) => {
        if (account.role !== role) return account;
        updatedAccount = { ...account, ...updates, role: account.role };
        return updatedAccount;
      });
      return next;
    });
    setSession((prev) => {
      if (!prev || prev.role !== role) return prev;
      return { ...prev, ...updates };
    });
    return updatedAccount;
  };

  const value = useMemo(
    () => ({ session, login, logout, accounts, updateAccount }),
    [session, accounts]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

