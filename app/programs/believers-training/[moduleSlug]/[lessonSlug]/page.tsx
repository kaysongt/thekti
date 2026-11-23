import Link from "next/link";
import { notFound } from "next/navigation";

import BelieversAudio from "@/components/BelieversAudio";
import Icon from "@/components/Icon";
import { believersPath, getStudyModule } from "@/lib/believers-modules";
import { renderMarkdown } from "@/lib/markdown";

export default async function LessonPage({ params }: { params: Promise<{ moduleSlug: string; lessonSlug: string }> }) {
  const { moduleSlug, lessonSlug } = await params;
  const m = await getStudyModule(moduleSlug, lessonSlug);
  const index = m.lessons.findIndex((l) => l.slug === lessonSlug);
  if (index < 0) notFound();
  const lesson = m.lessons[index];
  const path = `${believersPath}/${m.slug}`;
  const next = m.lessons[index + 1];
  const isReview = index === m.lessons.length - 1;
  const position = isReview ? "Module review" : `Lesson ${index + 1} of ${m.lessons.length - 1}`;
  const nextAction = next
    ? <>read this lesson, then continue to <Link href={`${path}/${next.slug}`}>{next.title}</Link>.</>
    : <>read this review, then take the <Link href={`${path}/assessment`}>Module {m.number} assessment</Link>. Submit all 15 answers to unlock the next module.</>;

  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <article className="topicwrap">
        <header className="lesson-head">
          <nav className="lesson-crumbs" aria-label="Breadcrumb">
            <Link href={believersPath}>Believers Training</Link>
            <Icon name="chevron-right" />
            <Link href={path}>Module {m.number} · {m.title}</Link>
          </nav>
          <h1>{lesson.title}</h1>
          <p className="lesson-meta"><span className="num">{position}</span></p>
          <p className="lesson-next"><strong>Your next action:</strong> {nextAction}</p>
        </header>
        {lesson.audio ? (
          <section aria-labelledby="audio-title" className="lesson-audio">
            <h2 id="audio-title">Listen to this lesson</h2>
            <BelieversAudio id={lesson.audio} title={`${lesson.title} audio`} />
          </section>
        ) : null}
        <div className="lesson-prose prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.body) }} />
        <nav className="topicnav" aria-label="Continue your studies">
          {index > 0 ? (
            <Link href={`${path}/${m.lessons[index - 1].slug}`}><span className="dir">Previous</span><span className="nm">{m.lessons[index - 1].title}</span></Link>
          ) : <span />}
          {next ? (
            <Link className="fwd" href={`${path}/${next.slug}`}><span className="dir">Next</span><span className="nm">{next.title}</span></Link>
          ) : (
            <Link className="fwd" href={`${path}/assessment`}><span className="dir">Next</span><span className="nm">Module {m.number} assessment</span></Link>
          )}
        </nav>
      </article>
    </main>
  );
}
