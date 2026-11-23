/**
 * Local sample data for design review and journey testing. Dev only.
 *
 *   npx tsx scripts/seed-sample.ts          # add any missing sample accounts
 *   npx tsx scripts/seed-sample.ts --reset  # back up .data/store.json, then start clean
 *
 * Every account uses the local password below and an @kingsword.test address,
 * so none of them can collide with a real student. The script refuses to run
 * when DATABASE_URL is set: it must never write sample people into production.
 */

import fs from "node:fs/promises";
import path from "node:path";

import { hashPassword } from "../lib/auth-core";
import { db } from "../lib/db";
import type { Enrollment, NewEnrollment, Student, StudentRole } from "../lib/db/types";

export const SAMPLE_PASSWORD = "kti-sample-pass-2026";

type Persona = {
  email: string;
  fullName: string;
  role?: StudentRole;
  enrollments?: Omit<NewEnrollment, "studentId" | "currency" | "providerRef">[];
  /** Lesson ids marked complete, e.g. "st-101-1". */
  completed?: string[];
  suspend?: boolean;
};

const lessons = (course: string, count: number) =>
  Array.from({ length: count }, (_, i) => `${course}-${i + 1}`);

const advanced = (status: "active" | "pending", provider: string | null) => ({
  product: "advanced", plan: "advanced" as const, status, amount: 1000, provider,
});
const believers = {
  product: "believers-training", plan: "certificate" as const, status: "active" as const, amount: 0, provider: null,
};

const PERSONAS: Persona[] = [
  { email: "believers@kingsword.test", fullName: "Grace Believers", enrollments: [believers] },
  {
    email: "module@kingsword.test", fullName: "Samuel Single-Module",
    enrollments: [{ product: "01-systematic-theology", plan: "certificate", status: "active", amount: 250, provider: "stripe" }],
    completed: [...lessons("st-101", 6), ...lessons("st-102", 2)],
  },
  {
    email: "advanced@kingsword.test", fullName: "Ada Advanced",
    enrollments: [advanced("active", "stripe")],
    completed: [...lessons("st-101", 6), ...lessons("st-102", 6), ...lessons("st-103", 1)],
  },
  { email: "newcomer@kingsword.test", fullName: "Nathan Newcomer", enrollments: [advanced("active", "stripe")] },
  {
    email: "dual@kingsword.test", fullName: "Dami Dual-Program",
    enrollments: [believers, advanced("pending", null)],
    completed: lessons("st-101", 3),
  },
  { email: "staff@kingsword.test", fullName: "Esther Staff", role: "staff" },
  { email: "admin@kingsword.test", fullName: "Andrew Admin", role: "admin" },
  { email: "noenroll@kingsword.test", fullName: "Naomi No-Program" },
  { email: "legacy@kingsword.test", fullName: "Lydia Legacy", enrollments: [advanced("pending", null)] },
  { email: "scholarship@kingsword.test", fullName: "Silas Scholarship", enrollments: [advanced("active", "scholarship")], completed: lessons("st-101", 2) },
  { email: "waiver@kingsword.test", fullName: "Pastor Wale Waiver", enrollments: [advanced("active", "minister-waiver")] },
  { email: "suspended@kingsword.test", fullName: "Sola Suspended", enrollments: [advanced("active", "stripe")], suspend: true },
  // Believers Training partway through: Modules 1 and 2 assessed, Module 3 next.
  { email: "bt@kingsword.test", fullName: "Beatrice Believers", enrollments: [believers] },
  // Bought the earlier six-track Basic Certificates pass.
  { email: "pass@kingsword.test", fullName: "Paul Pass", enrollments: [{ product: "basic-certificates", plan: "certificate", status: "active", amount: 250, provider: "stripe" }] },
  // Reserved the Marketplace track and still owes US$250; also joined Grace Academy.
  { email: "marketplace@kingsword.test", fullName: "Mara Marketplace", enrollments: [{ product: "basic-marketplace", plan: "certificate", status: "pending", amount: 250, provider: null }, { product: "academy-grace", plan: "certificate", status: "active", amount: 50, provider: "stripe" }] },
];

function storePath() {
  return path.join(process.cwd(), ".data", "store.json");
}

async function ensure(persona: Persona, passwordHash: string): Promise<{ student: Student; created: boolean }> {
  const existing = await db.getStudentByEmail(persona.email);
  if (existing) return { student: existing, created: false };
  const student = await db.createStudent({
    email: persona.email,
    fullName: persona.fullName,
    country: "Nigeria",
    passwordHash,
    role: persona.role ?? "student",
  });
  for (const enrollment of persona.enrollments ?? []) {
    const record = await db.createEnrollment({ ...enrollment, studentId: student.id, currency: "USD", providerRef: enrollment.provider ? "sample-data" : null });
    if (enrollment.status === "active") await db.activateEnrollment(record.id, "sample-data", enrollment.provider ?? "manual");
  }
  for (const lesson of persona.completed ?? []) await db.markLessonComplete(student.id, lesson);
  return { student, created: true };
}

async function main() {
  if (process.env.DATABASE_URL || process.env.NODE_ENV === "production") {
    throw new Error("Sample data is for the local file store only. Unset DATABASE_URL.");
  }
  if (process.argv.includes("--reset")) {
    const file = storePath();
    try {
      await fs.copyFile(file, `${file}.${Date.now()}.bak`);
      await fs.rm(file);
    } catch {
      /* nothing to back up */
    }
  }

  const passwordHash = await hashPassword(SAMPLE_PASSWORD);
  const people = new Map<string, { student: Student; created: boolean }>();
  for (const persona of PERSONAS) people.set(persona.email, await ensure(persona, passwordHash));

  // Ada has one graded ST 101 assessment with feedback and one ST 102 paper in the grading queue.
  const ada = people.get("advanced@kingsword.test")!;
  const staff = people.get("staff@kingsword.test")!.student;
  if (ada.created) {
    const graded = await db.createAssessmentSubmission({ studentId: ada.student.id, courseSlug: "st-101", sectionACorrect: 18, sectionATotal: 20, sectionAPoints: 36 });
    await db.submitAssessmentWrittenWork(graded.id, ada.student.id, "Part B. God reveals himself generally through creation and conscience, and specially through Scripture and supremely in Christ...");
    await db.gradeAssessment({ id: graded.id, graderId: staff.id, writtenPoints: 52, feedback: "Clear distinction between general and special revelation. Add one more scripture reference in your essay next time." });
    const pending = await db.createAssessmentSubmission({ studentId: ada.student.id, courseSlug: "st-102", sectionACorrect: 17, sectionATotal: 20, sectionAPoints: 34 });
    await db.submitAssessmentWrittenWork(pending.id, ada.student.id, [
      "Section B — Short answers",
      "1. Inspiration means Scripture is God-breathed (2 Timothy 3:16): God guided the human authors so that what they wrote is his Word.",
      "2. Inerrancy affirms that Scripture, in its original manuscripts, does not affirm anything contrary to fact.",
      "",
      "Section C — Essay",
      "The Bible's authority rests on its source. Because God is truthful, his Word is trustworthy. Jesus himself treated the Old Testament as authoritative (Matthew 5:18) and promised the Spirit would guide the apostles into all truth (John 16:13). For the believer this means Scripture is the final rule for faith and practice...",
    ].join("\n"));
  }

  // A second student also waiting for grading, so the queue shows more than one paper.
  const samuel = people.get("module@kingsword.test")!;
  if (samuel.created) {
    const paper = await db.createAssessmentSubmission({ studentId: samuel.student.id, courseSlug: "st-101", sectionACorrect: 15, sectionATotal: 20, sectionAPoints: 30 });
    await db.submitAssessmentWrittenWork(paper.id, samuel.student.id, "Section B — General revelation is what all people can know about God through creation (Romans 1:20). Special revelation is God's direct communication, written down in Scripture...\n\nSection C — Essay on the knowability of God...");
  }

  // An approved scholarship explains Silas's active enrollment.
  const silas = people.get("scholarship@kingsword.test")!;
  if (silas.created) {
    const [enrollment] = await db.getEnrollmentsForStudent(silas.student.id);
    const application = await db.createScholarshipApplication({ enrollmentId: enrollment.id, studentId: silas.student.id, financialNeed: "Sample: full-time pastor in a rural church.", trainingGoals: "Sample: teach sound doctrine to the congregation.", amountAbleToPay: 0 });
    if (application) await db.reviewScholarshipApplication({ applicationId: application.id, reviewerId: staff.id, decision: "approved", adminNotes: "Sample data" });
  }

  // Beatrice has submitted the Module 1 and 2 Believers Training assessments (15 questions each).
  const bea = people.get("bt@kingsword.test")!;
  if (bea.created) {
    for (const [slug, correct] of [["the-new-covenant", 13], ["identity-in-christ", 12]] as const) {
      await db.createQuizAttempt({ studentId: bea.student.id, courseSlug: "believers-training", lessonId: slug, kind: "topic", correct, total: 15, scorePct: Math.round(correct * 100 / 15), passed: true, answers: [] });
    }
  }

  // Suspension is only ever set by a disputed Stripe payment, so write it directly.
  const suspended = PERSONAS.filter((persona) => persona.suspend && people.get(persona.email)!.created);
  if (suspended.length) {
    const file = storePath();
    const data = JSON.parse(await fs.readFile(file, "utf8")) as { enrollments: Enrollment[] };
    const ids = new Set(suspended.map((persona) => people.get(persona.email)!.student.id));
    for (const enrollment of data.enrollments) {
      if (ids.has(enrollment.studentId)) enrollment.accessSuspendedAt = new Date().toISOString();
    }
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  }

  for (const [email, { created }] of people) console.log(`${created ? "created " : "exists  "} ${email}`);
  console.log(`\nPassword for every sample account: ${SAMPLE_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
