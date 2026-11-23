/**
 * Decides what a signed-in student sees first on My studies: one section per
 * program they belong to, each with a single next action chosen from their
 * real enrollment, progress, grading, payment status, and release dates.
 *
 * Pure: callers load the records, this only reads them, so the rules are
 * testable without a request (see scripts/check-student-hub.ts).
 */

import { getModuleEnrollmentState, hasMinisterWaiver, hasStudyAccess } from "./access";
import type { Module } from "./curriculum";
import { formatModuleReleaseDate, getCurriculum } from "./curriculum";
import type { AssessmentSubmission, Enrollment, ProgressRecord, ScholarshipApplication, Student } from "./db/types";
import { BELIEVERS, belongsToBelievers, currentAdvancedEnrollments } from "./program-membership";
import believersModules from "../content/believers-training/modules.json";
import { BASIC_TRACKS, SIX_TRACK_PASS, paidProgramByProduct } from "./catalog";
import { ownsBasicPass } from "./programs";

export type HubActionKind =
  | "start-lesson"
  | "resume-lesson"
  | "assessment"
  | "payment"
  | "release"
  | "awaiting-grading"
  | "contact"
  | "review"
  | "open-classes"
  | "bt-module"
  | "bt-final"
  | "pay"
  | "wait-classes"
  | "choose-program";

export type HubAction = {
  kind: HubActionKind;
  /** Button text: a verb and an object. */
  label: string;
  href: string;
  /** One sentence under the button saying what happens or why. */
  detail: string;
  /** Course or module the action belongs to, for the action card's heading. */
  context?: string;
};

export type ModuleState =
  | "completed"
  | "available"
  | "awaiting-payment"
  | "scheduled"
  | "in-preparation"
  | "on-hold"
  | "not-included";

export const MODULE_STATE_LABELS: Record<ModuleState, string> = {
  completed: "Completed",
  available: "Available",
  "awaiting-payment": "Awaiting payment",
  scheduled: "Scheduled",
  "in-preparation": "Content in preparation",
  "on-hold": "Access on hold",
  "not-included": "Not in your plan",
};

/** What the student can do in each state, shown beside the badge. */
export function moduleStateExplanation(state: ModuleState, module: Module): string {
  switch (state) {
    case "completed": return "Every topic and course assessment is done. You can revisit any lesson.";
    case "available": return "Open now. Work through the topics in order.";
    case "awaiting-payment": return "Included in your plan. It unlocks once tuition, an approved scholarship, or a waiver is confirmed.";
    case "scheduled": return `Opens ${formatModuleReleaseDate(module)} at 12:00 noon WAT. It appears here automatically.`;
    case "in-preparation": return "Released, but its lessons are still being prepared. KTI will announce when they are ready.";
    case "on-hold": return "Access is paused while KTI reviews a payment. Contact KTI to restore it.";
    case "not-included": return "Not part of your enrollment. Contact KTI to add this certificate.";
  }
}

export type CourseResult = {
  courseSlug: string;
  code: string;
  title: string;
  topicsDone: number;
  topics: number;
  assessment: "not-started" | "in-progress" | "pending-review" | "passed" | "retry";
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
};

export type HubModule = {
  module: Module;
  state: ModuleState;
  topicsDone: number;
  topics: number;
  courses: CourseResult[];
};

export type AdvancedHub = {
  kind: "advanced";
  title: string;
  planLabel: string;
  enrollmentStatus: "active" | "pending" | "suspended";
  fundingLabel: string | null;
  modules: HubModule[];
  next: HubAction;
  /** Tuition still owed on the enrollment, when KTI expects it. */
  payment: { due: boolean; amountLabel: string } | null;
  pendingGrading: CourseResult[];
  recentFeedback: CourseResult[];
};

export type BelieversModuleState = "completed" | "next" | "locked";

export type BelieversHub = {
  kind: "believers";
  title: string;
  next: HubAction;
  completed: number;
  modules: { number: number; slug: string; title: string; state: BelieversModuleState; score: number | null; href: string }[];
};

/** A Basic Certificate track, a Specialized Academy, or the earlier six-track pass. */
export type PaidHub = {
  kind: "paid";
  key: string;
  title: string;
  statusLabel: string;
  status: "payment-due" | "enrolled" | "on-hold";
  enrollmentId: string;
  price: number;
  next: HubAction;
  /** For the six-track pass: the tracks it covers. */
  covers?: { name: string; href: string }[];
};

export type HubProgram = AdvancedHub | BelieversHub | PaidHub;

export type HubInput = {
  student: Pick<Student, "id">;
  enrollments: Enrollment[];
  progress: ProgressRecord[];
  /** Latest submission per course, any module. */
  assessments: (AssessmentSubmission | null)[];
  scholarships?: ScholarshipApplication[];
  /** Courses whose lessons are written, keyed by course slug. */
  courseReady: ReadonlySet<string>;
  lessonTitles?: ReadonlyMap<string, string>;
  passMark?: number;
  contactEmail?: string;
  now?: Date;
  /** Saved Believers Training module assessments: lessonId is the module slug. */
  believersResults?: { lessonId: string | null; correct: number }[];
};

const BT_PATH = "/programs/believers-training";

export function buildBelievers(results: HubInput["believersResults"] = []): BelieversHub {
  const scores = new Map(results.filter((r) => r.lessonId).map((r) => [r.lessonId as string, r.correct]));
  const nextModule = believersModules.find((m) => !scores.has(m.slug));
  const modules = believersModules.map((m) => ({
    number: m.number,
    slug: m.slug,
    title: m.title,
    state: (scores.has(m.slug) ? "completed" : m === nextModule ? "next" : "locked") as BelieversModuleState,
    score: scores.get(m.slug) ?? null,
    href: `${BT_PATH}/${m.slug}`,
  }));
  const completed = modules.filter((m) => m.state === "completed").length;
  const following = nextModule ? believersModules.find((m) => m.number === nextModule.number + 1) : undefined;
  const next: HubAction = !nextModule
    ? { kind: "bt-final", label: "Get the printable final assessment", context: "All seven modules complete", href: `${BT_PATH}/assessment`, detail: "All seven module assessments are submitted. Download the 50-question final assessment to take with your church." }
    : {
      kind: "bt-module",
      label: `Start Module ${nextModule.number}`,
      href: `${BT_PATH}/${nextModule.slug}`,
      context: `Module ${nextModule.number} · ${nextModule.title}`,
      detail: `Read the lessons, then submit all 15 answers in the Module ${nextModule.number} assessment${following ? ` to unlock Module ${following.number}` : " to finish the online modules"}.`,
    };
  return { kind: "believers", title: "Believers Training", next, completed, modules };
}

const RELEASE_HOUR_UTC = 11;
const released = (module: Module, now: Date) => now.getTime() >= Date.parse(`${module.release_date}T${String(RELEASE_HOUR_UTC).padStart(2, "0")}:00:00.000Z`);

function tuition(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function courseResult(module: Module, courseIndex: number, done: ReadonlySet<string>, assessments: Map<string, AssessmentSubmission>, passMark: number): CourseResult {
  const course = module.courses[courseIndex];
  const topicsDone = Array.from({ length: module.lessons_per_course }, (_, n) => `${course.slug}-${n + 1}`).filter((id) => done.has(id)).length;
  const record = assessments.get(course.slug);
  const assessment: CourseResult["assessment"] = !record
    ? "not-started"
    : record.status === "graded"
      ? (record.totalScore ?? 0) >= passMark ? "passed" : "retry"
      : record.status;
  return {
    courseSlug: course.slug,
    code: course.code,
    title: course.title,
    topicsDone,
    topics: module.lessons_per_course,
    assessment,
    score: record?.status === "graded" ? record.totalScore : null,
    feedback: record?.feedback ?? null,
    gradedAt: record?.gradedAt ?? null,
  };
}

function buildAdvanced(input: HubInput, plan: Enrollment[]): AdvancedHub {
  const { student, progress, courseReady } = input;
  const now = input.now ?? new Date();
  const passMark = input.passMark ?? getCurriculum().grading.pass_mark;
  const contact = input.contactEmail ?? getCurriculum().program.contact.email;
  const done = new Set(progress.map((row) => row.lessonId));
  const assessments = new Map<string, AssessmentSubmission>();
  for (const row of input.assessments) if (row) assessments.set(row.courseSlug, row);

  const fullProgram = plan.some((e) => e.product === "advanced");
  const covered = getCurriculum().modules.filter((module) => fullProgram || plan.some((e) => e.product === module.slug));
  const suspended = plan.some((e) => e.status === "active" && e.accessSuspendedAt) && !plan.some((e) => e.status === "active" && !e.accessSuspendedAt);
  const waiver = hasMinisterWaiver(plan);
  const pendingEnrollment = waiver ? undefined : plan.find((e) => e.status === "pending");
  const activeEnrollment = plan.find((e) => e.status === "active" && !e.accessSuspendedAt);
  const scholarship = input.scholarships?.find((a) => a.status === "approved" && plan.some((e) => e.id === a.enrollmentId));

  const modules: HubModule[] = covered.map((module) => {
    const courses = module.courses.map((_, index) => courseResult(module, index, done, assessments, passMark));
    const topics = courses.reduce((sum, c) => sum + c.topics, 0);
    const topicsDone = courses.reduce((sum, c) => sum + c.topicsDone, 0);
    const enrollmentState = getModuleEnrollmentState(plan, module.slug);
    const access = hasStudyAccess(student, plan, module.slug, now);
    const ready = module.courses.every((course) => courseReady.has(course.slug));
    const state: ModuleState =
      enrollmentState === "suspended" ? "on-hold"
      : !released(module, now) ? "scheduled"
      : !access ? enrollmentState === "pending" ? "awaiting-payment" : "not-included"
      : !ready ? "in-preparation"
      : courses.every((c) => c.topicsDone === c.topics && c.assessment === "passed") ? "completed"
      : "available";
    return { module, state, topics, topicsDone, courses };
  });

  const all = modules.flatMap((m) => m.courses);
  const pendingGrading = all.filter((c) => c.assessment === "pending-review");
  const recentFeedback = all
    .filter((c) => (c.assessment === "passed" || c.assessment === "retry") && c.gradedAt)
    .sort((a, b) => (b.gradedAt ?? "").localeCompare(a.gradedAt ?? ""));

  const next = ((): HubAction => {
    if (suspended) {
      return { kind: "contact", label: "Contact KTI about your access", href: `mailto:${contact}?subject=${encodeURIComponent("Restore my KTI access")}`, detail: "Your study access is paused while KTI reviews a payment. Your progress is saved." };
    }
    for (const hub of modules.filter((m) => m.state === "available")) {
      const { module } = hub;
      for (const course of hub.courses) {
        if (!courseReady.has(course.courseSlug)) continue;
        if (course.topicsDone < course.topics) {
          const n = Array.from({ length: module.lessons_per_course }, (_, i) => i + 1).find((i) => !done.has(`${course.courseSlug}-${i}`))!;
          const title = input.lessonTitles?.get(`${course.courseSlug}-${n}`);
          // "Resume" only when saved progress shows where they stopped.
          const started = hub.topicsDone > 0;
          return {
            kind: started ? "resume-lesson" : "start-lesson",
            label: started ? `Resume ${course.code}, Topic ${n}` : `Start ${course.code}, Topic ${n}`,
            href: `/courses/${course.courseSlug}/${n}`,
            detail: title ? `${title} · ${course.title}` : course.title,
            context: `Module ${module.numeral} · ${module.short_title}`,
          };
        }
        if (course.assessment === "not-started" || course.assessment === "in-progress" || course.assessment === "retry") {
          return {
            kind: "assessment",
            label: course.assessment === "retry" ? `Retake the ${course.code} assessment` : course.assessment === "in-progress" ? `Finish the ${course.code} assessment` : `Take the ${course.code} assessment`,
            href: `/courses/${course.courseSlug}/assessment`,
            detail: course.assessment === "retry"
              ? `Your last result was ${course.score}%. You need ${passMark}% to pass.`
              : `All ${course.topics} topics are complete. Section A is marked instantly; your instructor grades the written work.`,
            context: `${course.code} · ${course.title}`,
          };
        }
      }
    }
    if (pendingEnrollment) {
      const awaiting = modules.find((m) => m.state === "awaiting-payment" || (m.state === "scheduled" && getModuleEnrollmentState(plan, m.module.slug) === "pending"));
      return {
        kind: "payment",
        label: "Complete your enrollment payment",
        href: "#complete-payment",
        detail: awaiting
          ? `${awaiting.module.short_title} ${awaiting.state === "scheduled" ? `opens ${formatModuleReleaseDate(awaiting.module)} and ` : ""}unlocks after tuition, an approved scholarship, or a waiver is confirmed.`
          : "Pay by card or bank transfer, or apply for a scholarship.",
      };
    }
    if (pendingGrading.length) {
      const upcoming = modules.find((m) => m.state === "scheduled");
      return {
        kind: "awaiting-grading",
        label: "Review your submitted work",
        href: "#results",
        detail: `${pendingGrading.map((c) => c.code).join(", ")} ${pendingGrading.length === 1 ? "is" : "are"} with your instructor for grading.${upcoming ? ` ${upcoming.module.short_title} opens ${formatModuleReleaseDate(upcoming.module)}.` : ""}`,
      };
    }
    const upcoming = modules.find((m) => m.state === "scheduled" || m.state === "in-preparation");
    if (upcoming) {
      return {
        kind: "release",
        label: `Preview ${upcoming.module.short_title}`,
        href: `/curriculum/${upcoming.module.slug}`,
        detail: upcoming.state === "scheduled"
          ? `You are up to date. Module ${upcoming.module.numeral} opens ${formatModuleReleaseDate(upcoming.module)} at 12:00 noon WAT.`
          : `You are up to date. Module ${upcoming.module.numeral} lessons are being prepared.`,
        context: `Next: Module ${upcoming.module.numeral}`,
      };
    }
    return { kind: "review", label: "Review your completed modules", href: "/curriculum", detail: "Every module in your plan is complete." };
  })();

  const product = fullProgram ? null : covered[0];
  return {
    kind: "advanced",
    title: "Advanced Certificate in Biblical Studies",
    planLabel: fullProgram ? "Full program · all five certificates" : `Single certificate · ${product?.short_title ?? ""}`,
    enrollmentStatus: suspended ? "suspended" : activeEnrollment ? "active" : "pending",
    fundingLabel: waiver ? "Minister tuition waiver" : scholarship ? "Scholarship approved" : null,
    modules,
    next,
    payment: pendingEnrollment ? { due: true, amountLabel: tuition(pendingEnrollment.amount, pendingEnrollment.currency) } : null,
    pendingGrading,
    recentFeedback,
  };
}

export function buildStudentHub(input: HubInput): HubProgram[] {
  const programs: HubProgram[] = [];
  // Lesson reading is not recorded, so the next step names the module, never "resume".
  if (belongsToBelievers(input.enrollments)) programs.push(buildBelievers(input.believersResults));
  const advanced = currentAdvancedEnrollments(input.enrollments).filter((e) => e.product !== BELIEVERS);
  if (advanced.length) programs.push(buildAdvanced(input, advanced));
  programs.push(...buildPaid(input.enrollments));
  return programs;
}

const dollars = (amount: number) => "US$" + amount;

/** Basic Certificate tracks, academies and the six-track pass, each with one action. */
export function buildPaid(enrollments: Enrollment[]): PaidHub[] {
  const out: PaidHub[] = [];
  for (const e of enrollments) {
    if (e.status !== "active" && e.status !== "pending") continue;
    const isPass = e.product === SIX_TRACK_PASS.product;
    const program = paidProgramByProduct(e.product);
    if (!isPass && !program) continue;
    // A track bought separately but also covered by the pass is shown once, under the pass.
    if (!isPass && program?.kind === "basic" && ownsBasicPass(enrollments)) continue;
    const title = isPass ? SIX_TRACK_PASS.name : program!.name;
    const price = e.amount;
    const onHold = e.status === "active" && Boolean(e.accessSuspendedAt);
    const status: PaidHub["status"] = onHold ? "on-hold" : e.status === "active" ? "enrolled" : "payment-due";
    const scope = isPass ? "all six tracks" : program!.kind === "basic" ? "this track" : "this academy";
    const next: HubAction = status === "payment-due"
      ? { kind: "pay", label: `Pay ${dollars(price)}`, href: "#pay-" + e.product, detail: `One-time tuition for ${scope}. Classes are coming soon, and they appear here when they open.` }
      : status === "on-hold"
        ? { kind: "contact", label: "Email KTI about your access", href: "mailto:kti@kingsword.org?subject=Program%20access", detail: "Access is paused while KTI reviews a payment." }
        : { kind: "wait-classes", label: isPass ? "See your six tracks" : "Read what you will study", href: isPass ? "/programs/basic-certificates" : program!.href, detail: "You are enrolled. Classes have not opened yet. They will appear here when they open, with your first module as the next step." };
    out.push({
      kind: "paid",
      key: e.product,
      title,
      status,
      statusLabel: status === "payment-due" ? "Payment due" : status === "on-hold" ? "Access on hold" : "Enrolled · classes coming soon",
      enrollmentId: e.id,
      price,
      next,
      covers: isPass ? BASIC_TRACKS.map((t) => ({ name: t.name, href: t.href })) : undefined,
    });
  }
  return out;
}

/** The empty state: no current enrollment. */
export const CHOOSE_PROGRAM_ACTION: HubAction = {
  kind: "choose-program",
  label: "Choose a program",
  href: "/programs",
  detail: "Believers Training is free and open now. The catalog lists every program’s hours and availability.",
};
