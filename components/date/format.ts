
import { useEffect, useState } from "react";

export function useRelativeTime(dateString: string) {
  const [text, setText] = useState(() => formatTimeShortFR(dateString));

  useEffect(() => {
    const interval = setInterval(() => {
      setText(formatTimeShortFR(dateString));
    }, 60 ); // refresh toutes les minutes
    return () => clearInterval(interval);
  }, [dateString]);

  return text;
}

export function formatTimeShortFR(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  return `${w} w.`;
}