import { v4 as uuidv4 } from 'uuid';

const KEY = 'anon:user:id';

export function getAnonymousUserId() {
  if (typeof window === 'undefined') return 'server';
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const id = uuidv4();
  try { localStorage.setItem(KEY, id); } catch {}
  return id;
}

