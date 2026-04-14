import { useEffect, useMemo, useState } from 'react';

type Stored<T> = {
  v: T;
  t: number; // timestamp (ms)
};

export function useLocalStorageTTL<T>(
  key: string,
  initialValue: T,
  ttlMs: number = 24 * 60 * 60 * 1000, // 24 hours
) {
  const now = Date.now();

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initialValue;

      const parsed = JSON.parse(raw) as Stored<T>;
      if (!parsed || typeof parsed.t !== 'number') return initialValue;

      // expired?
      if (now - parsed.t > ttlMs) {
        localStorage.removeItem(key);
        return initialValue;
      }

      return parsed.v;
    } catch {
      return initialValue;
    }
  });

  // Persist changes
  useEffect(() => {
    try {
      const payload: Stored<T> = { v: value, t: Date.now() };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // ignore write errors
    }
  }, [key, value]);

  // Optional: while app is open, auto-delete exactly when TTL passes
  const expiresAt = useMemo(() => Date.now() + ttlMs, [ttlMs]); // recalculated per mount
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Stored<T>;
      if (!parsed?.t) return;

      const remaining = parsed.t + ttlMs - Date.now();
      if (remaining <= 0) {
        localStorage.removeItem(key);
        setValue(initialValue);
        return;
      }

      const id = window.setTimeout(() => {
        localStorage.removeItem(key);
        setValue(initialValue);
      }, remaining);

      return () => window.clearTimeout(id);
    } catch {
      // ignore
    }
  }, [key, ttlMs, initialValue]);

  return [value, setValue] as const;
}