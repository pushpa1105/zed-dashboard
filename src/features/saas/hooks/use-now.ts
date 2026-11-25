import { useEffect, useState } from 'react';

/** Current time that re-renders the caller every `intervalMs`. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
