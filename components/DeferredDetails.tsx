"use client";

import { useState, type ReactNode } from "react";

/**
 * A disclosure whose contents mount the first time it opens. Browsers fetch
 * video posters even inside a closed <details>, so archived messages would
 * otherwise cost every visit to My studies a few hundred kilobytes.
 */
export default function DeferredDetails({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const [opened, setOpened] = useState(false);
  return (
    <details onToggle={(event) => { if (event.currentTarget.open) setOpened(true); }}>
      <summary>{summary}</summary>
      {opened ? children : null}
    </details>
  );
}
