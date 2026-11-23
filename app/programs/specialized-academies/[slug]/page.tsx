import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PaidProgramPanel from "@/components/PaidProgramPanel";
import { academyBySlug, usd } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

// The enrollment panel reads the visitor's session, so this page renders per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const academy = academyBySlug((await params).slug);
  return academy ? { title: academy.name, description: `${academy.subject}. ${academy.hours} program hours, ${usd(academy.price)} one-time.` } : {};
}

export default async function AcademyPage({ params }: Props) {
  const academy = academyBySlug((await params).slug);
  if (!academy) notFound();

  return (
    <main id="main-content" tabIndex={-1}>
      <header className="band page-band">
        <div className="wrap detail-head">
          <div>
            <Link className="crumb" href="/programs/specialized-academies">All academies</Link>
            <h1>{academy.name}</h1>
            <p className="detail-facts">{academy.subject} · {academy.hours} program hours</p>
          </div>
          <PaidProgramPanel program={academy} />
        </div>
      </header>
      <div className="wrap section detail-body">
        <section aria-labelledby="outline-title">
          <h2 id="outline-title">What you will study</h2>
          {academy.outline.length ? (
            <ol className="plain-outline">{academy.outline.map((item) => <li key={item}>{item}</li>)}</ol>
          ) : (
            <p>The course outline for this academy will be published before classes open.</p>
          )}
        </section>
        <aside className="detail-aside">
          {academy.catalogUrl ? (
            <section aria-labelledby="docs-title">
              <h2 id="docs-title">Documents</h2>
              <ul className="doc-links"><li><a href={academy.catalogUrl} target="_blank" rel="noopener noreferrer">Academy catalog (PDF)</a></li></ul>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
