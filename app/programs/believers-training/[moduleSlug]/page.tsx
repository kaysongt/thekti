import Link from "next/link";
import BelieversAudio from "@/components/BelieversAudio";
import { believersPath, getStudyModule } from "@/lib/believers-modules";

export default async function ModulePage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = await params;
  const m = await getStudyModule(moduleSlug);
  return (
    <main className="shell" id="main-content">
      <header className="pagehead">
        <Link href={believersPath + "#classes"}>← All seven modules</Link>
        <p>Believers Training · Module {m.number}</p>
        <h1>{m.title}</h1>
        <p className="deck">{m.description}</p>
        <Link className="btn primary" href={believersPath + "/" + m.slug + "/" + m.lessons[0].slug}>Start lesson 1</Link>
      </header>
      <section><h2>What you’ll learn</h2><ul>{m.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
        <p><a href={m.manual} target="_blank" rel="noreferrer">Open the full student manual ↗</a></p>
      </section>
      <section><h2>Module teaching</h2>
        <div className="videoslot"><div className="frame">
          <iframe src={"https://www.youtube-nocookie.com/embed/" + m.video} title={m.title}
            loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen />
        </div></div>
        {m.opening.map((t) => <details key={t.id}><summary>{t.title} audio</summary><BelieversAudio id={t.id} title={t.title + " audio"} /></details>)}
      </section>
      <section><h2>Lessons and review</h2>
        <ol>{m.lessons.map((lesson) => <li key={lesson.slug}>
          <Link href={believersPath + "/" + m.slug + "/" + lesson.slug}>{lesson.title}</Link>
          {" · "}{lesson.audio ? "Reading and audio" : "Reading"}
        </li>)}</ol>
        {m.closing.map((t) => <details key={t.id}><summary>{t.title} audio</summary><BelieversAudio id={t.id} title={t.title + " audio"} /></details>)}
      </section>
      <section><h2>Module assessment</h2>
        <p>Answer all 15 questions to complete this module.</p>
        <Link className="btn primary" href={believersPath + "/" + m.slug + "/assessment"}>Open assessment</Link>
      </section>
    </main>
  );
}
