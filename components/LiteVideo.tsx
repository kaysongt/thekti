"use client";

import { useState } from "react";

/**
 * A YouTube class that costs one thumbnail until the student presses play.
 * Seven iframes on one page each pull the YouTube player before anyone asks.
 */
export default function LiteVideo({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <div className="lite-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <button type="button" className="lite-video lite-video-poster" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube still; next/image would need a remote pattern for one thumbnail */}
      <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" width={480} height={360} />
      <span className="lite-video-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z" /></svg>
      </span>
    </button>
  );
}
