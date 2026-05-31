"use client";

import { useEffect, useState } from "react";

/**
 * Hero ticker — cycles through ticker_words every ~1.9s.
 * The track translates vertically using a CSS transition; the wrapper clips overflow.
 */
export function HeroTicker({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length === 0) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      1900,
    );
    return () => clearInterval(id);
  }, [words.length]);

  if (words.length === 0) return null;
  const longest = words.reduce(
    (acc, w) => (w.length > acc.length ? w : acc),
    words[0],
  );

  return (
    <span
      className="ticker text-brand-500 inline-flex overflow-hidden align-baseline"
      style={{
        height: "1em",
        minWidth: `${longest.length + 1}ch`,
      }}
      aria-live="polite"
    >
      <span
        className="ticker-track"
        style={{ transform: `translateY(-${index * 100}%)` }}
      >
        {words.map((w) => (
          <span key={w} style={{ height: "1em", lineHeight: "1em" }}>
            {w}.
          </span>
        ))}
      </span>
    </span>
  );
}
