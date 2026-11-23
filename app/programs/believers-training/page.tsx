import Image from "next/image";
import Link from "next/link";

import Icon from "@/components/Icon";
import { currentStudent } from "@/lib/auth";
import { believersModules, believersPath } from "@/lib/believers-modules";
import { db } from "@/lib/db";
import { belongsToBelievers } from "@/lib/program-membership";
import { getProgram } from "@/lib/programs";
import { buildBelievers } from "@/lib/student-hub";

export const metadata = {
  title: "Believers Training",
  description: "Seven free online modules. Each ends with a 15-question assessment that unlocks the next. A printable final assessment is available for your church.",
};

export default async function BelieversTrainingPage() {
  const program = getProgram("believers");
  const student = await currentStudent();
  const enrolled = Boolean(student && belongsToBelievers(await db.getEnrollmentsForStudent(student.id)));
  const hub = enrolled && student ? buildBelievers(await db.getBelieversResults(student.id)) : null;

  return (
    <main id="main-content" tabIndex={-1}>
      <header className="band page-band program-hero">
        <div className="wrap program-hero-grid">
          <div>
            <Link className="crumb" href="/programs">All programs</Link>
            <h1>Believers Training</h1>
            <p className="program-hero-meta"><span className="badge open">Open now</span><span>Free · 7 modules · {program.hoursLabel}</span></p>
            {hub ? (
              <div className="next-step on-band">
                <div className="next-step-copy">
                  <h2>{hub.next.context}</h2>
                  <p>{hub.next.detail}</p>
                </div>
                <Link className="btn gold lg" href={hub.next.href}>{hub.next.label} <Icon name="arrow-right" className="arrow" /></Link>
              </div>
            ) : (
              <>
                <p className="deck">{program.fit} {program.next}</p>
                <div className="action-row program-actions">
                  {student ? (
                    <Link className="btn gold lg" href="/enroll?program=believers-training">Join Believers Training · free</Link>
                  ) : (
                    <>
                      <Link className="btn gold lg" href="/enroll?program=believers-training">Create a free account to start</Link>
                      <Link className="btn ghost lg" href={`/login?next=${encodeURIComponent("/enroll?program=believers-training")}`}>Sign in to join</Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          <Image className="program-hero-photo" src={program.image} alt={program.imageAlt} width={834} height={469} sizes="(max-width: 900px) 0px, 460px" />
        </div>
      </header>

      <div className="wrap section">
        <section id="classes" aria-labelledby="modules-title">
          <h2 id="modules-title" className="section-title">The seven modules</h2>
          <ol className="bt-modules">
            {(hub?.modules ?? believersModules.map((m) => ({ number: m.number, slug: m.slug, title: m.title, state: "locked" as const, score: null, href: `${believersPath}/${m.slug}` }))).map((m) => (
              <li key={m.slug} className={`is-${hub ? m.state : "preview"}`}>
                <span className="num">{m.number}</span>
                <span className="bt-module-main">
                  {hub && m.state !== "locked" ? <Link className="bt-module-title" href={m.href}>{m.title}</Link> : <span className="bt-module-title">{m.title}</span>}
                  <span className="bt-module-state">
                    {!hub ? "10 lessons and a 15-question assessment"
                      : m.state === "completed" ? <>Assessment submitted · {m.score}/15 · <Link href={`${m.href}/assessment`}>Review answers</Link></>
                      : m.state === "next" ? "Up next: 10 lessons, then a 15-question assessment"
                      : `Unlocks after the Module ${m.number - 1} assessment`}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        {hub ? (
          <p className="hint">Studying with your church? <Link href={`${believersPath}/assessment`}>Download the printable 50-question final assessment</Link>.</p>
        ) : null}
      </div>
    </main>
  );
}
