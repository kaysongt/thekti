import Image from "next/image";
import Link from "next/link";

import Icon from "@/components/Icon";
import LiteVideo from "@/components/LiteVideo";
import { ProgramStatus } from "@/components/ProgramCatalog";
import { currentStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { belongsToBelievers } from "@/lib/program-membership";
import { BELIEVERS_CLASSES, getProgram } from "@/lib/programs";

export const metadata = {
  title: "Believers Training",
  description: "Study seven free video classes or download the printable final assessment for your local church.",
};

const JOIN_PATH = "/enroll?program=believers-training";

export default async function BelieversTrainingPage() {
  const program = getProgram("believers");
  const student = await currentStudent();
  const enrolled = Boolean(student && belongsToBelievers(await db.getEnrollmentsForStudent(student.id)));

  return (
    <main id="main-content" tabIndex={-1}>
      <header className="band page-band program-hero">
        <div className="wrap program-hero-grid">
          <div>
            <Link className="crumb" href="/programs">All programs</Link>
            <h1>Believers Training</h1>
            <div className="program-hero-meta">
              <ProgramStatus program={program} />
              <span>{program.priceLabel} · {BELIEVERS_CLASSES.length} essential classes · {program.hoursLabel}</span>
            </div>
            <dl className="program-facts on-navy">
              <div><dt>Who it serves</dt><dd>{program.audience}</dd></div>
              <div><dt>What you will learn</dt><dd>{program.learn}</dd></div>
              <div><dt>What comes next</dt><dd>{program.next}</dd></div>
            </dl>
            <div className="action-row program-actions">
              {enrolled ? (
                <>
                  <a className="btn gold lg" href="#classes">Open classes <Icon name="arrow-right" className="arrow" /></a>
                  <Link className="btn ghost lg" href="/programs/believers-training/assessment">Get the printable assessment</Link>
                </>
              ) : student ? (
                <Link className="btn gold lg" href={JOIN_PATH}>Join this program — free <Icon name="arrow-right" className="arrow" /></Link>
              ) : (
                <>
                  <Link className="btn gold lg" href={JOIN_PATH}>Create an account to join</Link>
                  <Link className="btn ghost lg" href={`/login?next=${encodeURIComponent(JOIN_PATH)}`}>Sign in to join</Link>
                </>
              )}
            </div>
            {enrolled ? <p className="program-hero-note">You are enrolled. Your classes are below.</p> : null}
          </div>
          <Image
            className="program-hero-photo"
            src={program.image}
            alt={program.imageAlt}
            width={834}
            height={469}
            sizes="(max-width: 900px) 0px, 460px"
          />
        </div>
      </header>

      <div className="wrap section">
        <section id="classes" aria-labelledby="classes-title" className="class-path-section">
          <div className="section-head">
            <div>
              <h2 id="classes-title">The seven-class path</h2>
              <p>
                {enrolled
                  ? "Watch the classes in order. KTI does not track individual class progress yet, so pick up wherever you left off."
                  : "Join the program to watch every class. The titles below show the full path."}
              </p>
            </div>
          </div>
          <ol className="class-path">
            {BELIEVERS_CLASSES.map(({ title, videoId }, index) => (
              <li key={videoId} id={`class-${index + 1}`}>
                <div className="class-path-head">
                  <span className="class-number">Class {index + 1}</span>
                  <h3>{title}</h3>
                </div>
                {enrolled ? <LiteVideo videoId={videoId} title={`Class ${index + 1}: ${title}`} /> : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="k-card assessment-callout" aria-labelledby="assessment-title">
          <div className="k-card-body">
            <h2 id="assessment-title">Final assessment with your church</h2>
            <p>The 50-question final assessment is printable. Enter your church’s name and location, download it, and give it at your local church.</p>
            <div className="action-row">
              {enrolled ? (
                <Link className="btn primary" href="/programs/believers-training/assessment"><Icon name="download" /> Get the printable assessment</Link>
              ) : (
                <p className="hint">Available after you join Believers Training.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
