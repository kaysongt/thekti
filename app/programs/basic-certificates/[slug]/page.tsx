import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PaidProgramPanel from "@/components/PaidProgramPanel";
import { basicTrackBySlug, usd } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

// The enrollment panel reads the visitor's session, so this page renders per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const track = basicTrackBySlug((await params).slug);
  return track ? { title: track.name, description: `${track.description} ${usd(track.price)}, one-time.` } : {};
}

export default async function BasicTrackPage({ params }: Props) {
  const track = basicTrackBySlug((await params).slug);
  if (!track) notFound();

  return (
    <main id="main-content" tabIndex={-1}>
      <header className="band page-band">
        <div className="wrap detail-head">
          <div>
            <Link className="crumb" href="/programs/basic-certificates">All six Basic Certificate tracks</Link>
            <h1>{track.name}</h1>
            <p className="deck">{track.description}</p>
            <p className="detail-facts">For {track.audience}{track.ages ? ` · ${track.ages}` : ""} · {track.hours} program hours · {track.modules.length} modules · {track.sessionCount} sessions</p>
          </div>
          <PaidProgramPanel program={track} />
        </div>
      </header>

      <div className="wrap section detail-body">
        <section aria-labelledby="sessions-title">
          <h2 id="sessions-title">What you will study</h2>
          <ol className="module-outline">
            {track.modules.map((module) => (
              <li key={module.number}>
                <h3>Module {module.number} · {module.title} <span>{module.hours} program hours</span></h3>
                {module.sessions.length ? (
                  <ul>{module.sessions.map((session) => <li key={session.code}><span className="num">{session.code}</span> {session.title}</li>)}</ul>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <aside className="detail-aside">
          {track.assessment.length ? (
            <section aria-labelledby="grading-title">
              <h2 id="grading-title">How you are assessed</h2>
              <ul className="weights">{track.assessment.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ) : null}
          {track.requirements ? (
            <section aria-labelledby="graduation-title">
              <h2 id="graduation-title">To graduate</h2>
              <p>{track.requirements}</p>
            </section>
          ) : null}
          <section aria-labelledby="docs-title">
            <h2 id="docs-title">Documents</h2>
            <ul className="doc-links">
              {track.brochureUrl ? <li><a href={track.brochureUrl} target="_blank" rel="noopener noreferrer">Program brochure (PDF)</a></li> : null}
              {track.catalogUrl ? <li><a href={track.catalogUrl} target="_blank" rel="noopener noreferrer">Full course catalog (PDF)</a></li> : null}
            </ul>
            {track.pdfFeeNote ? <p className="notice warn">{track.pdfFeeNote}</p> : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
