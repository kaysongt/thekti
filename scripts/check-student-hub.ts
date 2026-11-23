/**
 * "What do I do next?" rules for My studies, plus the program data they sit on.
 * Imported by scripts/check.ts; runs without a request or a database.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { getCurriculum } from "../lib/curriculum";
import type { AssessmentSubmission, Enrollment } from "../lib/db/types";
import { ACADEMIES, ACADEMY_HOURS, BASIC_CERTIFICATES, PROGRAMS } from "../lib/programs";
import { buildStudentHub, type AdvancedHub } from "../lib/student-hub";

const { modules } = getCurriculum();
const [m1, m2] = modules;
const student = { id: "student-1" };
const ready = new Set(m1.courses.map((course) => course.slug));
const beforeM2 = new Date(`${m2.release_date}T10:00:00.000Z`);
const beforeM2Day = new Date(beforeM2.getTime() - 3 * 86400000);
const stamp = "2026-11-01T00:00:00.000Z";

function enrollment(over: Partial<Enrollment>): Enrollment {
  return {
    id: over.id ?? `e-${Math.random()}`, studentId: student.id, product: "advanced", plan: "advanced", status: "active",
    amount: 1000, currency: "USD", provider: "stripe", providerRef: "x", activatedAt: stamp, accessSuspendedAt: null,
    createdAt: stamp, updatedAt: stamp, ...over,
  };
}
const believers = enrollment({ product: "believers-training", plan: "certificate", amount: 0, provider: null });
const lessons = (course: string, count: number) => Array.from({ length: count }, (_, i) => ({ studentId: student.id, lessonId: `${course}-${i + 1}`, completedAt: stamp }));
function submission(courseSlug: string, over: Partial<AssessmentSubmission>): AssessmentSubmission {
  return {
    id: `s-${courseSlug}`, studentId: student.id, courseSlug, sectionACorrect: 18, sectionATotal: 20, sectionAPoints: 36,
    writtenResponse: "x", writtenPoints: null, totalScore: null, status: "pending-review", feedback: null, gradedById: null,
    gradedAt: null, createdAt: stamp, updatedAt: stamp, ...over,
  };
}
const hub = (input: Partial<Parameters<typeof buildStudentHub>[0]>) =>
  buildStudentHub({ student, enrollments: [], progress: [], assessments: [], courseReady: ready, passMark: 80, contactEmail: "kti@example.test", now: beforeM2Day, ...input });
const advancedOf = (programs: ReturnType<typeof hub>) => programs.find((p): p is AdvancedHub => p.kind === "advanced")!;

// No enrollment: nothing to continue, so the page falls back to choosing a program.
assert.deepEqual(hub({}), []);

// Believers only: never claims "Resume" because class progress is not recorded.
{
  const programs = hub({ enrollments: [believers] });
  assert.equal(programs.length, 1);
  assert.equal(programs[0].kind, "believers");
  assert.equal(programs[0].next.label, "Open classes");
  assert.equal(programs[0].next.href, "/programs/believers-training#classes");
}

// New Advanced student with nothing done: Start, not Resume.
{
  const next = advancedOf(hub({ enrollments: [enrollment({})] })).next;
  assert.equal(next.kind, "start-lesson");
  assert.equal(next.label, `Start ${m1.courses[0].code}, Topic 1`);
  assert.equal(next.href, `/courses/${m1.courses[0].slug}/1`);
}

// Saved progress: Resume at the first unfinished topic.
{
  const next = advancedOf(hub({ enrollments: [enrollment({})], progress: lessons(m1.courses[0].slug, 3) })).next;
  assert.equal(next.kind, "resume-lesson");
  assert.equal(next.href, `/courses/${m1.courses[0].slug}/4`);
}

// All topics in a course done, no submission yet: take the assessment.
{
  const next = advancedOf(hub({ enrollments: [enrollment({})], progress: lessons(m1.courses[0].slug, m1.lessons_per_course) })).next;
  assert.equal(next.kind, "assessment");
  assert.equal(next.href, `/courses/${m1.courses[0].slug}/assessment`);
}

// Pending grading does not block the next course; feedback and grading are listed.
{
  const progress = [...lessons(m1.courses[0].slug, 6), ...lessons(m1.courses[1].slug, 6), ...lessons(m1.courses[2].slug, 1)];
  const assessments = [
    submission(m1.courses[0].slug, { status: "graded", writtenPoints: 52, totalScore: 88, feedback: "Well argued.", gradedAt: stamp }),
    submission(m1.courses[1].slug, {}),
  ];
  const result = advancedOf(hub({ enrollments: [enrollment({})], progress, assessments }));
  assert.equal(result.next.kind, "resume-lesson");
  assert.equal(result.next.href, `/courses/${m1.courses[2].slug}/2`);
  assert.deepEqual(result.pendingGrading.map((c) => c.courseSlug), [m1.courses[1].slug]);
  assert.equal(result.recentFeedback[0].feedback, "Well argued.");
}

// A failed result asks for a retake at the pass mark.
{
  const progress = lessons(m1.courses[0].slug, 6);
  const assessments = [submission(m1.courses[0].slug, { status: "graded", writtenPoints: 30, totalScore: 66, gradedAt: stamp })];
  const next = advancedOf(hub({ enrollments: [enrollment({})], progress, assessments })).next;
  assert.equal(next.kind, "assessment");
  assert.match(next.label, /^Retake/);
  assert.match(next.detail, /80%/);
}

// Everything available is done and graded: point at the next release date.
{
  const progress = m1.courses.flatMap((course) => lessons(course.slug, m1.lessons_per_course));
  const assessments = m1.courses.map((course) => submission(course.slug, { status: "graded", writtenPoints: 50, totalScore: 86, gradedAt: stamp }));
  const result = advancedOf(hub({ enrollments: [enrollment({})], progress, assessments }));
  assert.equal(result.modules[0].state, "completed");
  assert.equal(result.modules[1].state, "scheduled");
  assert.equal(result.next.kind, "release");
  assert.match(result.next.detail, /opens December 1, 2026/);
}

// Work submitted but not graded, nothing else open: say it is with the instructor.
{
  const progress = m1.courses.flatMap((course) => lessons(course.slug, m1.lessons_per_course));
  const assessments = m1.courses.map((course) => submission(course.slug, {}));
  const next = advancedOf(hub({ enrollments: [enrollment({})], progress, assessments })).next;
  assert.equal(next.kind, "awaiting-grading");
}

// Unpaid (legacy) registration: Module 1 is open to registered students, so study first;
// once Module 1 work is finished, the payment step leads.
{
  const pending = enrollment({ status: "pending", provider: null, providerRef: null, activatedAt: null });
  const first = advancedOf(hub({ enrollments: [pending] }));
  assert.equal(first.enrollmentStatus, "pending");
  assert.equal(first.payment?.amountLabel, "$1,000");
  assert.equal(first.next.kind, "start-lesson");
  const progress = m1.courses.flatMap((course) => lessons(course.slug, m1.lessons_per_course));
  const assessments = m1.courses.map((course) => submission(course.slug, { status: "graded", totalScore: 90, gradedAt: stamp }));
  const done = advancedOf(hub({ enrollments: [pending], progress, assessments }));
  assert.equal(done.next.kind, "payment");
  assert.equal(done.next.href, "#complete-payment");
  // After Module 2 opens, an unpaid student sees it as awaiting payment, with an explanation.
  const later = advancedOf(hub({ enrollments: [pending], now: new Date(`${m2.release_date}T12:00:00.000Z`) }));
  assert.equal(later.modules[1].state, "awaiting-payment");
}

// Minister waiver and approved scholarship: no payment step, funding is named.
{
  const waiver = advancedOf(hub({ enrollments: [enrollment({ provider: "minister-waiver" })] }));
  assert.equal(waiver.payment, null);
  assert.equal(waiver.fundingLabel, "Minister tuition waiver");
  const e = enrollment({ id: "e-sch", provider: "scholarship" });
  const scholarship = advancedOf(hub({
    enrollments: [e],
    scholarships: [{ id: "a", enrollmentId: "e-sch", studentId: student.id, financialNeed: "", trainingGoals: "", amountAbleToPay: 0, status: "approved", adminNotes: null, reviewedById: null, reviewedAt: null, createdAt: stamp, updatedAt: stamp }],
  }));
  assert.equal(scholarship.fundingLabel, "Scholarship approved");
}

// Suspended access: contact KTI, never a lesson link.
{
  const result = advancedOf(hub({ enrollments: [enrollment({ accessSuspendedAt: stamp })] }));
  assert.equal(result.enrollmentStatus, "suspended");
  assert.equal(result.next.kind, "contact");
  assert.ok(result.next.href.startsWith("mailto:"));
  assert.equal(result.modules[0].state, "on-hold");
}

// Single certificate: only that module is listed.
{
  const result = advancedOf(hub({ enrollments: [enrollment({ product: m1.slug, plan: "certificate", amount: 250 })] }));
  assert.deepEqual(result.modules.map((m) => m.module.slug), [m1.slug]);
  assert.match(result.planLabel, /^Single certificate/);
}

// Dual program: one section each, Believers first, each with its own action.
{
  const programs = hub({ enrollments: [believers, enrollment({ status: "pending", provider: null })] });
  assert.deepEqual(programs.map((p) => p.kind), ["believers", "advanced"]);
  assert.notEqual(programs[0].next.href, programs[1].next.href);
}

// Program data: verified hours, six Basic tracks (Teenagers 40, the rest 50), "program hours" wording.
{
  assert.deepEqual(PROGRAMS.map((p) => p.linkLabel), ["Believers Training", "Advanced Certificates", "Basic Certificates", "Specialized Academy"]);
  assert.deepEqual(PROGRAMS.map((p) => p.href), ["/programs/believers-training", "/programs/advanced-certificate", "/programs#basic-certificates", "/programs#specialized-academies"]);
  assert.equal(PROGRAMS[1].hoursLabel, `${getCurriculum().program.total_hours} program hours`);
  assert.equal(BASIC_CERTIFICATES.length, 6);
  for (const track of BASIC_CERTIFICATES) {
    assert.equal(track.hours, track.slug === "teenagers" ? 40 : 50, track.slug);
    assert.equal(track.modules.reduce((sum, m) => sum + m.hours, 0), track.hours, `${track.slug} module hours add up`);
  }
  assert.equal(BASIC_CERTIFICATES[0].ages, "Ages 13–18");
  assert.equal(ACADEMIES.length, 16);
  assert.equal(ACADEMY_HOURS, 20);
  for (const program of PROGRAMS) assert.ok(program.hoursLabel.endsWith("program hours"));
  const pages = ["app/page.tsx", "app/programs/page.tsx", "app/programs/advanced-certificate/page.tsx", "lib/programs.ts"].map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8"));
  for (const source of pages) assert.ok(!/contact hours/i.test(source), "use 'program hours' throughout");
  assert.ok(pages[0].includes("Raising a supernatural army"), "homepage keeps its headline");
}

// Walkthrough: every step points at a data-tour target that My studies renders.
{
  const walkthrough = fs.readFileSync(path.join(process.cwd(), "components/StudentWalkthrough.tsx"), "utf8");
  const dashboard = fs.readFileSync(path.join(process.cwd(), "app/dashboard/page.tsx"), "utf8") + fs.readFileSync(path.join(process.cwd(), "components/PaymentPanel.tsx"), "utf8");
  const targets = [...walkthrough.matchAll(/target: "([a-z-]+)"/g)].map((match) => match[1]);
  assert.ok(targets.length >= 6);
  for (const target of targets) {
    assert.ok(dashboard.includes(`data-tour="${target}"`) || dashboard.includes(`"${target}" : undefined`), `walkthrough target ${target} exists on My studies`);
  }
  assert.ok(walkthrough.includes("=> Boolean(entry.element))"), "steps without a target on the page are skipped");
  assert.ok(walkthrough.includes("compareDocumentPosition"), "steps follow the order the page shows them");
  assert.ok(!/useEffect\(\(\) => \{ [^}]*setOpen\(/.test(walkthrough), "no synchronous setState in effects (lint rule)");
}

// The November 18 student-email video link stays where emails point.
{
  const dashboard = fs.readFileSync(path.join(process.cwd(), "app/dashboard/page.tsx"), "utf8");
  assert.ok(dashboard.includes('href="/assets/kti-student-update-2026-11-18.mp4"'));
  assert.ok(fs.existsSync(path.join(process.cwd(), "public/assets/kti-student-update-2026-11-18.mp4")));
  assert.ok(fs.readFileSync(path.join(process.cwd(), "components/PaymentPanel.tsx"), "utf8").includes('id="complete-payment"'), "payment reminder emails link to #complete-payment");
}

console.log("Student hub checks passed.");
