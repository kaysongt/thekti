import Link from "next/link";

import BelieversAudio from "@/components/BelieversAudio";
import Icon from "@/components/Icon";
import { believersModules, believersPath, getStudyAccess } from "@/lib/believers-modules";

export default async function ModulePage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = await params;
  const { module: m, score } = await getStudyAccess(moduleSlug);
  const path = `${believersPath}/${m.slug}`;
  const following = believersModules.find((entry) => entry.number === m.number + 1);
  const done = score !== undefined;

  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <div className="topicwrap">
        <header className="lesson-head">
          <nav className="lesson-crumbs" aria-label="Breadcrumb">
            <Link href="/dashboard?program=believers">My studies</Link>
            <Icon name="chevron-right" />
            <Link href={believersPath}>Believers Training</Link>
          </nav>
          <h1>Module {m.number} · {m.title}</h1>
          <p className="lesson-meta">
            <span className={`badge ${done ? "done" : "open"}`}>{done ? `Assessment submitted · ${score}/15` : "In progress"}</span>
            <span>{m.lessons.length - 1} lessons and a review · 15-question assessment</span>
          </p>
          <p className="deck">{m.description}</p>
          <div className="lesson-next">
            <p>
              <strong>Your next action:</strong>{" "}
              {done
                ? following ? `you have finished this module. Module ${following.number} is open.` : "you have finished all seven modules."
                : `read the lessons in order, then submit all 15 answers in the assessment${following ? ` to unlock Module ${following.number}` : ""}.`}
            </p>
            <div className="action-row">
              {done ? (
                following ? <Link className="btn gold" href={`${believersPath}/${following.slug}`}>Start Module {following.number}</Link>
                  : <Link className="btn gold" href={`${believersPath}/assessment`}>Get the printable final assessment</Link>
              ) : (
                <>
                  <Link className="btn gold" href={`${path}/${m.lessons[0].slug}`}>Start lesson 1</Link>
                  <Link className="btn quiet" href={`${path}/assessment`}>Take the Module {m.number} assessment</Link>
                </>
              )}
            </div>
          </div>
        </header>

        <section aria-labelledby="lessons-title">
          <h2 id="lessons-title">Lessons</h2>
          <ol className="lesson-list">
            {m.lessons.map((lesson, i) => (
              <li key={lesson.slug}>
                <Link href={`${path}/${lesson.slug}`}>
                  <span className="num">{i === m.lessons.length - 1 ? "R" : i + 1}</span>
                  <span>{lesson.title}</span>
                  <small>{lesson.audio ? "Reading and audio" : "Reading"}</small>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="teaching-title">
          <h2 id="teaching-title">Module teaching video</h2>
          <div className="videoslot"><div className="frame">
            <iframe src={`https://www.youtube-nocookie.com/embed/${m.video}`} title={m.title} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen />
          </div></div>
          {m.opening.map((t) => <details key={t.id}><summary>{t.title} audio</summary><BelieversAudio id={t.id} title={`${t.title} audio`} /></details>)}
          {m.closing.map((t) => <details key={t.id}><summary>{t.title} audio</summary><BelieversAudio id={t.id} title={`${t.title} audio`} /></details>)}
        </section>

        <section aria-labelledby="learn-title">
          <h2 id="learn-title">What you will learn</h2>
          <ul>{m.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
          <p><a href={m.manual} target="_blank" rel="noreferrer">Open the full student manual</a></p>
        </section>
      </div>
    </main>
  );
}
