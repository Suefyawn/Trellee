"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

/**
 * A real, playable video testimonial card. Shows the video's first frame as a
 * poster (preload="metadata") with a play overlay; clicking plays it inline
 * with native controls.
 */
export function VideoReview({
  src,
  name,
  role,
  company,
  duration,
}: {
  src: string;
  name: string;
  role?: string | null;
  company?: string | null;
  duration?: string | null;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function play() {
    setPlaying(true);
    ref.current?.play();
  }

  return (
    <div className="surface-card overflow-hidden group">
      <div className="relative aspect-[4/5] bg-bg">
        <video
          ref={ref}
          src={src}
          className="w-full h-full object-cover"
          preload="metadata"
          playsInline
          controls={playing}
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
        />
        {!playing ? (
          <button
            type="button"
            onClick={play}
            aria-label={`Play ${name}'s video review`}
            className="absolute inset-0 flex items-center justify-center bg-bg/25 group-hover:bg-bg/10 transition"
          >
            <span className="w-14 h-14 rounded-full bg-fg/95 group-hover:scale-105 transition flex items-center justify-center">
              <Play className="w-5 h-5 text-bg fill-bg ml-0.5" />
            </span>
          </button>
        ) : null}
        {!playing ? (
          <span className="absolute top-3 left-3 t-mono text-[10px] text-fg/80 px-2 py-1 rounded bg-bg/60 backdrop-blur">
            <span className="text-brand-500">●</span> VIDEO
          </span>
        ) : null}
        {duration && !playing ? (
          <span className="absolute bottom-3 right-3 t-mono text-[10px] text-fg/80 px-2 py-1 rounded bg-bg/60 backdrop-blur">
            {duration}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <div className="t-small text-fg">{name}</div>
        {role || company ? (
          <div className="t-mono text-muted text-xs mt-0.5">
            {[role, company].filter(Boolean).join(" · ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
