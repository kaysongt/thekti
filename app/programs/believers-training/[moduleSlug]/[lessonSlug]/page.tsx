import Link from "next/link";
import { notFound } from "next/navigation";
import BelieversAudio from "@/components/BelieversAudio";
import { believersModules, believersPath, getStudyModule } from "@/lib/believers-modules";
import { renderMarkdown } from "@/lib/markdown";

export default async function LessonPage({ params }: { params: Promise<{ moduleSlug: string; lessonSlug: string }> }) {
  const { moduleSlug, lessonSlug } = await params;
  const m = await getStudyModule(moduleSlug, lessonSlug);
  const index = m.lessons.findIndex((l) => l.slug === lessonSlug);
  if (index < 0) notFound();
  const lesson = m.lessons[index];
  const path = believersPath + "/" + m.slug;
  const next = m.lessons[index + 1];
  const nextModule = believersModules.find((entry) => entry.number === m.number + 1);
  return (
    <main className="shell" id="main-content">
      <article style={{ maxWidth: "72ch", marginInline: "auto" }}>
        <header className="pagehead">
          <Link href={path}>← Module {m.number} · {m.title}</Link>
          <p>{index === m.lessons.length - 1 ? "Module review" : "Lesson " + (index + 1) + " of 10"}</p>
          <h1>{lesson.title}</h1>
        </header>
        {lesson.audio && <section><h2>Listen to the lesson</h2><BelieversAudio id={lesson.audio} title={lesson.title + " audio"} /></section>}
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.body) }} />
        <nav className="pillrow" aria-label="Continue your studies">
          {index > 0 && <Link className="btn quiet" href={path + "/" + m.lessons[index - 1].slug}>Previous lesson</Link>}
          {next ? <Link className="btn primary" href={path + "/" + next.slug}>Next · {next.title}</Link>
            : nextModule ? <Link className="btn primary" href={believersPath + "/" + nextModule.slug}>Continue to module {nextModule.number}</Link>
            : <Link className="btn primary" href={believersPath + "/assessment"}>Open final assessment</Link>}
        </nav>
      </article>
    </main>
  );
}
