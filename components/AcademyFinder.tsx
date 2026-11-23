"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Item = { slug: string; name: string; subject: string; href: string; price: string; hours: number };

/** Scan 24 academies by name or subject; typing filters both. */
export default function AcademyFinder({ academies, subjects }: { academies: Item[]; subjects: readonly string[] }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<string>("All");
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => academies.filter((a) => (subject === "All" || a.subject === subject) && (!q || a.name.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q))),
    [academies, subject, q],
  );

  return (
    <div className="finder">
      <div className="finder-controls">
        <div className="field">
          <label htmlFor="academy-search">Find an academy</label>
          <input id="academy-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try prayer, marriage or leadership" autoComplete="off" />
        </div>
        <div className="finder-subjects" role="group" aria-label="Filter by subject">
          {["All", ...subjects].map((name) => (
            <button key={name} type="button" className="chip-button" aria-pressed={subject === name} onClick={() => setSubject(name)}>{name}</button>
          ))}
        </div>
      </div>
      <p className="hint" aria-live="polite">{visible.length === academies.length ? `${academies.length} academies` : `${visible.length} of ${academies.length} academies`}</p>
      {visible.length ? (
        <ul className="academy-grid">
          {visible.map((a) => (
            <li key={a.slug}>
              <Link className="academy-card" href={a.href}>
                <span className="academy-name">{a.name}</span>
                <span className="academy-subject">{a.subject}</span>
                <span className="academy-meta"><strong>{a.price}</strong> · {a.hours} program hours</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="notice">No academy matches “{query}”. <button type="button" className="text-link" onClick={() => { setQuery(""); setSubject("All"); }}>Show all academies</button></p>
      )}
    </div>
  );
}
