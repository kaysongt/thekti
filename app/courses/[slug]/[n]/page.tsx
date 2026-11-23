import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import TopicReader from "@/components/TopicReader";
import LessonDiscussion from "@/components/LessonDiscussion";
import { entitlementRedirectPath, hasStudyAccess } from "@/lib/access";
import { currentStudent } from "@/lib/auth";
import { isCoursePreview } from "@/lib/learning-mode";
import LearningModeBanner from "@/components/LearningModeBanner";
import { getCourseAudio, getCourseStatuses, getLesson, getLessonRows } from "@/lib/content";
import Icon from "@/components/Icon";
import { getCourseBook } from "@/lib/course-materials";
import { findCourse, getCurriculum, lessonId } from "@/lib/curriculum";
import { db } from "@/lib/db";
import { earlierLessonsComplete } from "@/lib/learning-progress";

type Props = { params: Promise<{ slug: string; n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, n } = await params;
  const found = findCourse(slug);
  if (!found) return {};
  const rows = getLessonRows(found.module, found.course);
  const row = rows.find((r) => r.n === Number(n));
  return { title: row ? `${found.course.code} · ${row.title}` : found.course.title };
}

export default async function TopicPage({ params }: Props) {
  const { slug, n } = await params;
  const index = Number(n);

  const found = findCourse(slug);
  if (!found || !Number.isInteger(index)) notFound();
  const { module, course } = found;

  const student = await currentStudent();
  const staffPreview = student ? await isCoursePreview(student) : false;
  const available = getCourseStatuses().some(
    (status) => status.course.slug === course.slug && status.complete && (status.available || staffPreview)
  );
  if (!available) redirect(`/curriculum/${module.slug}`);

  const rows = getLessonRows(module, course);
  const row = rows.find((r) => r.n === index);
  if (!row) notFound();

  // Study material is for enrolled students only.
  if (!student) redirect(`/login?next=/courses/${slug}/${index}`);

  const enrollments = await db.getEnrollmentsForStudent(student.id);
  const entitled = hasStudyAccess(student, enrollments, module.slug);
  if (!entitled && !staffPreview) redirect(entitlementRedirectPath(enrollments));

  const { grading } = getCurriculum();
  const lesson = getLesson(module, course, index);
  const progress = await db.getProgress(student.id);
  const done = new Set(progress.map((p) => p.lessonId));

  const prevRow = rows.find((r) => r.n === index - 1) ?? null;
  const nextRow = rows.find((r) => r.n === index + 1) ?? null;

  // Sequential gating: you may not skip ahead past an unfinished topic.
  if (!staffPreview && !earlierLessonsComplete(rows, index, done)) {
    const firstIncomplete = rows.find((r) => r.n < index && !done.has(r.id))!;
    redirect(`/courses/${slug}/${firstIncomplete.n}`);
  }

  const hasQuiz = lesson.html.includes('class="quiz"');
  const alreadyPassed = !staffPreview && await db.hasPassingTopicAttempt(student.id, row.id);
  const chapter = row.reading;
  const book = getCourseBook(course.slug);
  const audio = getCourseAudio(course.slug);

  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <LearningModeBanner student={student} preview={staffPreview} />
      <div className="topicwrap">
      <header className="lesson-head">
        <nav className="lesson-crumbs" aria-label="Breadcrumb">
          <Link href={`/curriculum/${module.slug}`}>Module {module.numeral} · {module.short_title}</Link>
          <Icon name="chevron-right" />
          <Link href={`/courses/${course.slug}`}>{course.code} · {course.title}</Link>
        </nav>
        <h1>{row.title}</h1>
        <div className="lesson-meta">
          <span className={`badge ${done.has(row.id) ? "done" : "open"}`}>{done.has(row.id) ? "Completed" : "In progress"}</span>
          <span className="num">Topic {index} of {rows.length}</span>
          <span>{row.duration}</span>
          {chapter ? <span>{chapter}</span> : null}
        </div>
        <div className="lesson-materials" aria-label="Lesson materials">
          {book ? <a className="btn sm quiet" href={book.viewUrl} target="_blank" rel="noopener noreferrer"><Icon name="book" /> Textbook</a> : null}
          {audio ? <Link className="btn sm quiet" href={`/courses/${course.slug}#audio-library-title`}><Icon name="play" /> Audiobook</Link> : null}
          <a className="btn sm quiet" href="#discussion"><Icon name="message" /> Discussion</a>
        </div>
        <p className="lesson-next">
          <strong>Your next action:</strong>{" "}
          {done.has(row.id)
            ? nextRow ? <>continue to <Link href={`/courses/${slug}/${nextRow.n}`}>Topic {nextRow.n}, {nextRow.title}</Link>.</> : <>take the <Link href={`/courses/${slug}/assessment`}>{course.code} course assessment</Link>.</>
            : <>read the lesson, pass the quiz at {grading.pass_mark}%, then select <a href="#mark-complete">Mark complete</a> to unlock {nextRow ? `Topic ${nextRow.n}` : "the course assessment"}.</>}
        </p>
      </header>

      <nav className="topicbar" aria-label={`${course.code} topics`}>
        {rows.map((r) => {
          const isDone = done.has(r.id);
          const locked =
            !staffPreview && !earlierLessonsComplete(rows, r.n, done);
          if (r.n === index) {
            return (
              <span className="cur" key={r.id} aria-current="page">
                {r.n}<span className="sr-only"> (current topic)</span>
              </span>
            );
          }
          return locked ? (
            <span className="lock" key={r.id} title="Complete the previous topic first">
              {r.n}<span className="sr-only"> (locked)</span>
            </span>
          ) : (
            <Link href={`/courses/${course.slug}/${r.n}`} className={isDone ? "done" : ""} key={r.id} aria-label={`Topic ${r.n}: ${r.title}${isDone ? " (completed)" : ""}`}>
              {r.n}
            </Link>
          );
        })}
      </nav>

      <TopicReader
        preview={staffPreview}
        html={lesson.html}
        courseSlug={course.slug}
        lessonId={lessonId(course.slug, index)}
        passMark={grading.pass_mark}
        mustPass={grading.must_pass_to_advance}
        alreadyComplete={done.has(row.id)}
        alreadyPassed={alreadyPassed}
        hasQuiz={hasQuiz}
        path={`/courses/${slug}/${index}`}
        prev={prevRow ? { href: `/courses/${slug}/${prevRow.n}`, title: prevRow.title } : null}
        next={
          nextRow
            ? { href: `/courses/${slug}/${nextRow.n}`, title: nextRow.title }
            : { href: `/courses/${slug}/assessment`, title: "Course assessment" }
        }
      />
      {staffPreview ? (
        <div className="notice" id="discussion">Lesson discussions are available in student mode. Preview does not post contributions or award credits.</div>
      ) : <LessonDiscussion moduleSlug={module.slug} lessonId={row.id} title={row.title} />}
      </div>
    </main>
  );
}
