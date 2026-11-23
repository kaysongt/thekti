import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminNav from "@/components/AdminNav";
import GradeForm from "@/components/GradeForm";
import Icon from "@/components/Icon";
import { currentStudent, isStaff } from "@/lib/auth";
import { findCourse, getCurriculum } from "@/lib/curriculum";
import { db } from "@/lib/db";
import { staffLoginPath, STAFF_ACCESS_REQUIRED_PATH } from "@/lib/login-redirect";

export const metadata: Metadata = { title: "Assessment grading", robots: { index: false, follow: false } };

const errors: Record<string, string> = {
  invalid: "Enter written points from 0 to 60 and feedback of at least 3 characters. Nothing was saved.",
  missing: "That submission no longer exists. Choose another paper from the queue.",
  "already-graded": "This paper was already graded, so the earlier grade was kept. Nothing was changed.",
};

const when = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(value)) + " WAT";

export default async function GradingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; graded?: string; error?: string }>;
}) {
  const staff = await currentStudent();
  if (!staff) redirect(staffLoginPath("/admin/grading"));
  if (!isStaff(staff)) redirect(STAFF_ACCESS_REQUIRED_PATH);

  const { id, graded, error } = await searchParams;
  const { grading } = getCurriculum();
  const [queue, pendingScholarships, justGraded] = await Promise.all([
    db.listPendingAssessments(),
    db.countPendingScholarshipApplications(),
    graded ? db.getAssessmentSubmissionForGrading(graded) : null,
  ]);
  const selected = queue.find((item) => item.id === id) ?? (graded ? null : queue[0] ?? null);
  const next = queue.find((item) => item.id !== selected?.id) ?? null;
  const course = selected ? findCourse(selected.courseSlug) : undefined;
  const gradedCourse = justGraded ? findCourse(justGraded.courseSlug) : undefined;

  return (
    <main className="shell admin-shell grading-shell" id="main-content" tabIndex={-1}>
      <header className="pagehead">
        <h1>Assessment grading</h1>
        <p className="deck">Section A is marked automatically out of 40. Read the written work, award up to 60 points, and leave feedback. The student sees the total and your feedback as soon as you record it.</p>
      </header>
      <AdminNav pendingScholarshipCount={pendingScholarships} pendingGradingCount={queue.length} />

      {error && errors[error] ? <div className="notice bad" role="alert">{errors[error]}</div> : null}
      {justGraded && justGraded.status === "graded" && !error ? (
        <div className="notice good grade-confirmation" role="status">
          <Icon name="check-circle" />
          <div>
            <strong>Grade recorded for {justGraded.student.fullName} · {gradedCourse?.course.code ?? justGraded.courseSlug.toUpperCase()}</strong>
            <p>
              Section A {justGraded.sectionAPoints}/40 + written {justGraded.writtenPoints}/60 = <strong>{justGraded.totalScore}/100</strong>,{" "}
              {(justGraded.totalScore ?? 0) >= grading.pass_mark ? "a pass" : `below the ${grading.pass_mark}% pass mark`}. Their result and feedback now show on My studies and the course assessment page.
            </p>
            {next ? <Link className="btn primary sm" href={`/admin/grading?id=${next.id}`}>Grade the next paper <Icon name="arrow-right" className="arrow" /></Link> : <p>The queue is clear.</p>}
          </div>
        </div>
      ) : null}

      <div className="grading-layout">
        <nav className="grading-queue" aria-labelledby="queue-title">
          <h2 id="queue-title">Waiting for grading <span className="badge review">{queue.length}</span></h2>
          {queue.length ? (
            <ol>
              {queue.map((item) => {
                const found = findCourse(item.courseSlug);
                const current = item.id === selected?.id;
                return (
                  <li key={item.id}>
                    <Link href={`/admin/grading?id=${item.id}`} aria-current={current ? "true" : undefined} className={current ? "is-current" : undefined}>
                      <strong>{item.student.fullName}</strong>
                      <span>{found?.course.code ?? item.courseSlug.toUpperCase()} · {found?.course.title ?? ""}</span>
                      <small>Submitted {when(item.updatedAt)} · Section A {item.sectionAPoints}/40</small>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="hint">No written assessment is waiting for review.</p>
          )}
        </nav>

        {selected ? (
          <article className="grading-paper" aria-labelledby="paper-title">
            <header className="grading-paper-head">
              <div>
                <p className="grading-course">{course ? `${course.course.code} · ${course.course.title} · Module ${course.module.numeral}, ${course.module.short_title}` : selected.courseSlug.toUpperCase()}</p>
                <h2 id="paper-title">{selected.student.fullName}</h2>
                <p className="hint">{selected.student.email} · submitted {when(selected.updatedAt)}</p>
              </div>
              <dl className="grading-section-a">
                <dt>Section A</dt>
                <dd className="num"><strong>{selected.sectionAPoints}</strong> / 40</dd>
                <dd className="hint">{selected.sectionACorrect} of {selected.sectionATotal} correct</dd>
              </dl>
            </header>
            <section aria-labelledby="response-title">
              <h3 id="response-title">Written response</h3>
              <div className="grading-response" tabIndex={0} aria-label={`Written response from ${selected.student.fullName}`}>
                {selected.writtenResponse?.trim() ? selected.writtenResponse : "No written response was submitted."}
              </div>
            </section>
            <GradeForm submissionId={selected.id} sectionAPoints={selected.sectionAPoints} passMark={grading.pass_mark} studentName={selected.student.fullName.split(/\s+/)[0]} />
          </article>
        ) : !justGraded ? (
          <p className="grading-empty">Choose a paper from the queue.</p>
        ) : null}
      </div>
    </main>
  );
}
