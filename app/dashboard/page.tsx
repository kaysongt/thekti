import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/login/actions";
import DeferredDetails from "@/components/DeferredDetails";
import Icon from "@/components/Icon";
import LearningModeBanner from "@/components/LearningModeBanner";
import ModuleOneUpdate, { ModuleOneDeadline } from "@/components/ModuleOneUpdate";
import PaymentPanel from "@/components/PaymentPanel";
import StudentWalkthrough from "@/components/StudentWalkthrough";
import { hasMinisterWaiver } from "@/lib/access";
import { currentStudent, isStaff } from "@/lib/auth";
import { getCourseStatuses, getLessonRows, getModuleStatuses } from "@/lib/content";
import { getCurriculum } from "@/lib/curriculum";
import { db } from "@/lib/db";
import { isCoursePreview } from "@/lib/learning-mode";
import { paidProgramCheckoutReady } from "@/lib/payments/stripe-client";
import { programOffer, BELIEVERS_CLASSES } from "@/lib/programs";
import { currentAdvancedEnrollments } from "@/lib/program-membership";
import {
  buildStudentHub,
  CHOOSE_PROGRAM_ACTION,
  MODULE_STATE_LABELS,
  moduleStateExplanation,
  type AdvancedHub,
  type HubAction,
  type HubModule,
  type ModuleState,
} from "@/lib/student-hub";

import { beginStripeCheckout, changeOwnPassword } from "./actions";

export const metadata: Metadata = {
  title: "My studies",
  robots: { index: false, follow: false },
};

const passwordMessages: Record<string, { tone: "good" | "warn" | "bad"; text: string }> = {
  changed: { tone: "good", text: "Your password has been updated." },
  wrong: { tone: "bad", text: "That current password is not right. Nothing was changed." },
  same: { tone: "warn", text: "The new password matches your current one. Choose a different one." },
  invalid: {
    tone: "bad",
    text: "Check the form: the new password needs at least 10 characters and both new fields must match.",
  },
};

const paymentMessages: Record<string, { tone: "good" | "warn" | "bad"; text: string }> = {
  required: {
    tone: "warn",
    text: "Module 1 is available to all registered students from its opening time. Payment or an approved scholarship/waiver is required for later modules. See the access details above.",
  },
  success: {
    tone: "good",
    text: "Your enrollment was submitted securely. Stripe is confirming it now; access updates automatically after the signed confirmation arrives.",
  },
  processing: {
    tone: "warn",
    text: "Your Checkout Session is complete and payment confirmation is still processing. You do not need to pay again.",
  },
  cancelled: {
    tone: "warn",
    text: "Checkout was cancelled and no new access was granted. You can resume secure payment below.",
  },
  invalid: { tone: "bad", text: "That enrollment could not be opened for payment." },
  "promo-invalid": {
    tone: "bad",
    text: "That full-tuition promo code could not be applied. Check the spelling or ask KTI staff whether it is still active.",
  },
  unavailable: {
    tone: "bad",
    text: "Secure card payment is temporarily unavailable. Please try again or use the bank-transfer option below.",
  },
  "scholarship-submitted": {
    tone: "good",
    text: "Your scholarship application was submitted. The KingsWord team can now review it in the staff dashboard.",
  },
};

const accessMessages: Record<string, { tone: "good" | "warn" | "bad"; text: string }> = {
  "staff-required": {
    tone: "bad",
    text: "This account does not have Staff Operations access. Ask an administrator to assign it the Staff or Administrator role.",
  },
};

const ACTION_BUTTON: Record<HubAction["kind"], string> = {
  "start-lesson": "Start lesson",
  "resume-lesson": "Open lesson",
  assessment: "Open assessment",
  payment: "See payment options",
  release: "Preview the module",
  "awaiting-grading": "See submitted work",
  contact: "Email KTI",
  review: "Open the curriculum",
  "open-classes": "Open classes",
  "choose-program": "Browse programs",
};

const BADGE_FOR_STATE: Record<ModuleState, string> = {
  completed: "done",
  available: "open",
  "awaiting-payment": "payment",
  scheduled: "scheduled",
  "in-preparation": "soon",
  "on-hold": "hold",
  "not-included": "soon",
};

function NextStep({ action, tour }: { action: HubAction; tour?: boolean }) {
  const external = action.href.startsWith("mailto:");
  const button = (
    <>
      {ACTION_BUTTON[action.kind]} <Icon name="arrow-right" className="arrow" />
    </>
  );
  return (
    <div className="next-step" data-tour={tour ? "next-step" : undefined}>
      <div className="next-step-copy">
        {action.context ? <p className="next-step-context">{action.context}</p> : null}
        <h3>{action.label}</h3>
        <p>{action.detail}</p>
      </div>
      {external || action.href.startsWith("#") ? (
        <a className="btn gold lg" href={action.href}>{button}</a>
      ) : (
        <Link className="btn gold lg" href={action.href}>{button}</Link>
      )}
    </div>
  );
}

function ModuleRow({ hub }: { hub: HubModule }) {
  const { module, state } = hub;
  const percent = hub.topics ? Math.round((hub.topicsDone / hub.topics) * 100) : 0;
  const open = state === "available" || state === "completed";
  return (
    <li className={`hub-module is-${state}`}>
      <div className="hub-module-head">
        <div>
          <p className="hub-module-number">Module {module.numeral} · {module.hours} program hours</p>
          <h4>{open ? <Link href={`/curriculum/${module.slug}`}>{module.short_title}</Link> : module.short_title}</h4>
        </div>
        <span className={`badge ${BADGE_FOR_STATE[state]}`}>{MODULE_STATE_LABELS[state]}</span>
      </div>
      <p className="hub-module-explain">{moduleStateExplanation(state, module)}</p>
      {open || hub.topicsDone > 0 ? (
        <>
          <div className="hub-progress">
            <progress value={hub.topicsDone} max={hub.topics || 1} aria-label={`${module.short_title}: ${hub.topicsDone} of ${hub.topics} topics complete`} />
            <span className="num">{hub.topicsDone} of {hub.topics} topics · {percent}%</span>
          </div>
          <details className="hub-courses">
            <summary>Courses and assessment results <Icon name="chevron-right" className="disclosure-icon" /></summary>
            <ul>
              {hub.courses.map((course) => (
                <li key={course.courseSlug}>
                  <Link href={`/courses/${course.courseSlug}`}>{course.code} · {course.title}</Link>
                  <span className="num">{course.topicsDone}/{course.topics} topics</span>
                  <span className={`hub-result is-${course.assessment}`}>
                    {course.assessment === "passed" ? `Passed · ${course.score}%`
                      : course.assessment === "retry" ? `${course.score}% · retake needed`
                      : course.assessment === "pending-review" ? "Awaiting grading"
                      : course.assessment === "in-progress" ? "Assessment started"
                      : "Assessment not taken"}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : null}
    </li>
  );
}

function ResultsPanel({ hub, passMark }: { hub: AdvancedHub; passMark: number }) {
  if (!hub.pendingGrading.length && !hub.recentFeedback.length) return null;
  const latest = hub.recentFeedback[0];
  return (
    <section className="hub-results" id="results" data-tour="results" aria-labelledby="results-title">
      <h3 id="results-title">Grading and feedback</h3>
      <ul>
        {hub.pendingGrading.map((course) => (
          <li key={course.courseSlug} className="hub-result-row">
            <Icon name="clock" />
            <div>
              <strong>{course.code} assessment is with your instructor</strong>
              <p>Section A is marked. Your written work will be graded and your result will appear here with feedback.</p>
            </div>
          </li>
        ))}
        {latest ? (
          <li className="hub-result-row">
            <Icon name={latest.assessment === "passed" ? "check-circle" : "alert"} />
            <div>
              <strong>{latest.code} result: {latest.score}% · {latest.assessment === "passed" ? "Passed" : `below the ${passMark}% pass mark`}</strong>
              {latest.feedback ? <blockquote className="hub-feedback">{latest.feedback}</blockquote> : null}
              <Link href={`/courses/${latest.courseSlug}/assessment`}>{latest.assessment === "passed" ? "View the full result" : "Retake the assessment"}</Link>
            </div>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ access?: string; payment?: string; password?: string }>;
}) {
  const student = await currentStudent();
  if (!student) redirect("/login");
  const staffPreview = await isCoursePreview(student);
  const nameParts = student.fullName.trim().split(/\s+/);
  const greetingName = /^(?:pastor )?godfrey ekhomu$/i.test(nameParts.join(" "))
    ? "Pastor Godfrey"
    : nameParts[0];

  const { access, payment, password } = await searchParams;
  const { program, grading } = getCurriculum();
  const allEnrollments = await db.getEnrollmentsForStudent(student.id);
  const purchases = allEnrollments.flatMap((enrollment) => {
    const offer = programOffer(enrollment.product);
    return offer && ["pending", "active"].includes(enrollment.status) ? [{ offer, enrollment }] : [];
  });
  const advancedEnrollments = currentAdvancedEnrollments(allEnrollments);
  const inAdvanced = advancedEnrollments.length > 0;

  // Only students in the Advanced Certificate need its progress, grades, and payment records.
  const [progress, assessments, scholarshipApplications, engagement] = inAdvanced
    ? await Promise.all([
      db.getProgress(student.id),
      db.getLatestAssessmentSubmissions(student.id),
      db.getScholarshipApplicationsForStudent(student.id),
      db.getCommunityEngagement(student.id),
    ])
    : [[], [], [], { posts: 0, credits: 0 }];

  const courseStatuses = inAdvanced ? getCourseStatuses() : [];
  const courseReady = new Set(courseStatuses.filter((status) => status.complete).map((status) => status.course.slug));
  const lessonTitles = new Map<string, string>();
  for (const status of courseStatuses.filter((s) => s.available)) {
    for (const row of getLessonRows(status.module, status.course)) lessonTitles.set(row.id, row.title);
  }

  const programs = buildStudentHub({
    student,
    enrollments: allEnrollments,
    progress,
    assessments,
    scholarships: scholarshipApplications,
    courseReady,
    lessonTitles,
    passMark: grading.pass_mark,
    contactEmail: program.contact.email,
  });

  const ministerWaiver = hasMinisterWaiver(advancedEnrollments);
  const pending = ministerWaiver ? [] : advancedEnrollments.filter((e) => e.status === "pending");
  const paymentMessage = ministerWaiver
    ? { tone: "good", text: "Your ordained-minister tuition waiver is active for the full program. No tuition payment is required. Please do not use any older checkout links; contact kti@kingsword.org if you have already paid." }
    : payment ? paymentMessages[payment] ?? null : null;
  const passwordMessage = password ? passwordMessages[password] : null;
  const accessMessage = access ? accessMessages[access] : null;
  const multiple = programs.length > 1;

  return (
    <main id="main-content" tabIndex={-1} className="hub">
      <header className="band hub-head">
        <div className="wrap">
          <h1>Welcome, {greetingName}</h1>
          {programs.length ? (
            <nav className="hub-programs" aria-label="Your programs" data-tour="programs">
              {programs.map((item) => (
                <a key={item.kind} href={`#program-${item.kind}`} className="hub-program-chip">
                  <span>{item.kind === "believers" ? "Believers Training" : "Advanced Certificate"}</span>
                  <small>{item.kind === "believers" ? "Free · open now" : item.planLabel}</small>
                </a>
              ))}
            </nav>
          ) : (
            <p className="deck">You are signed in as {student.email}.</p>
          )}
        </div>
      </header>

      <div className="wrap hub-body">
        <LearningModeBanner student={student} preview={staffPreview} />
        {accessMessage ? <div className={`notice ${accessMessage.tone}`} role="alert">{accessMessage.text}</div> : null}
        {passwordMessage ? <div className={`notice ${passwordMessage.tone}`} role="status">{passwordMessage.text}</div> : null}
        {isStaff(student) ? (
          <Link href="/admin" className="staff-entry">
            <span className="staff-entry-label">{student.role === "admin" ? "Administrator" : "Staff"} access</span>
            <strong>Open staff operations</strong>
            <span className="staff-entry-hint">Registrations, payments, scholarships, grading, and every account on the course.</span>
          </Link>
        ) : null}

        {staffPreview ? (
          <section className="hub-program" aria-labelledby="preview-title">
            <h2 id="preview-title">Course preview</h2>
            <p>Your preview access lets you review completed course content without payment or waiting for student release dates. Previewing does not record grades or student progress.</p>
            <ul className="hub-preview-list">
              {getModuleStatuses().map(({ module, coursesComplete }) => (
                <li key={module.slug}>
                  <span>Module {module.numeral} · {module.short_title}</span>
                  <Link href={`/curriculum/${module.slug}`}>{coursesComplete > 0 ? "Preview courses →" : "View module overview →"}</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!programs.length && !purchases.length && !staffPreview ? (
          <section className="hub-program hub-empty" aria-labelledby="empty-title">
            <h2 id="empty-title">You have not joined a program yet</h2>
            <p>Choose a program to start studying. Believers Training is free and opens as soon as you join. The Advanced Certificate enrolls by intake; its page shows whether registration is open.</p>
            <NextStep action={CHOOSE_PROGRAM_ACTION} tour />
            <p><Link href="/programs#program-believers">Compare program hours and availability</Link></p>
          </section>
        ) : null}

        {purchases.length > 0 && payment && paymentMessages[payment] && <p role="status">{paymentMessages[payment].text}</p>}
        {purchases.map(({ offer, enrollment }) => <section key={enrollment.id} id={"program-" + offer.product} className="hub-program">
          <h2>{offer.title}</h2>
          {enrollment.accessSuspendedAt ? <p>Access is suspended. Contact KTI for help.</p> : enrollment.status === "active" ?
            <p>Your enrollment is active. Classes are coming soon.</p> : <>
              <p>One-time tuition · US${offer.amount}. Classes are coming soon.</p>
              {paidProgramCheckoutReady(offer.product) ? <form action={beginStripeCheckout}><input type="hidden" name="enrollmentId" value={enrollment.id} /><button className="btn primary">Pay US${offer.amount}</button></form> : offer.product === "basic-certificates" ? <Link href="/programs#basic-certificates">Choose an individual certificate</Link> : <p>Checkout is coming soon.</p>}
            </>}
        </section>)}
        {programs.map((item, index) => item.kind === "believers" ? (
          <section key="believers" id="program-believers" className="hub-program" aria-labelledby="believers-title">
            <div className="hub-program-head">
              <h2 id="believers-title">Believers Training</h2>
              <span className="badge open">Enrolled</span>
            </div>
            <NextStep action={item.next} tour={index === 0} />
            <div className="hub-believers" data-tour="believers-path">
              <div>
                <h3>Your seven-class path</h3>
                <ol className="hub-class-list">
                  {BELIEVERS_CLASSES.map((lesson, n) => (
                    <li key={lesson.videoId}><Link href={`/programs/believers-training#class-${n + 1}`}><span className="num">{n + 1}</span>{lesson.title}</Link></li>
                  ))}
                </ol>
              </div>
              <div className="hub-side-card">
                <h3>Printable final assessment</h3>
                <p>Download the 50-question assessment to give at your local church. You enter your church’s name and location first.</p>
                <Link className="btn quiet" href="/programs/believers-training/assessment" data-tour="believers-assessment"><Icon name="download" /> Get the assessment</Link>
              </div>
            </div>
          </section>
        ) : (
          <section key="advanced" id="program-advanced" className="hub-program" aria-labelledby="advanced-title">
            <div className="hub-program-head">
              <div>
                <h2 id="advanced-title">{item.title}</h2>
                <p className="hub-plan">{item.planLabel}{item.fundingLabel ? ` · ${item.fundingLabel}` : ""}</p>
              </div>
              <span className={`badge ${item.enrollmentStatus === "active" ? "open" : item.enrollmentStatus === "pending" ? "payment" : "hold"}`}>
                {item.enrollmentStatus === "active" ? "Enrolled" : item.enrollmentStatus === "pending" ? "Payment due" : "Access on hold"}
              </span>
            </div>
            <NextStep action={item.next} tour={index === 0 || !multiple} />
            {item.modules.some((m) => m.module.number === 1 && m.state === "available") ? <ModuleOneDeadline /> : null}
            <ResultsPanel hub={item} passMark={grading.pass_mark} />

            <div className="hub-grid">
              <section aria-labelledby="modules-title" data-tour="modules">
                <h3 id="modules-title">Your modules</h3>
                <ol className="hub-modules">
                  {item.modules.map((hub) => <ModuleRow key={hub.module.slug} hub={hub} />)}
                </ol>
                {item.modules.length < getCurriculum().modules.length ? (
                  <p className="hint">Your plan covers one certificate. <a href={`mailto:${program.contact.email}?subject=${encodeURIComponent("Add a KTI certificate")}`}>Ask KTI about adding another</a>.</p>
                ) : null}
              </section>
              <aside className="hub-aside">
                <section className="hub-side-card hub-video" aria-labelledby="weekly-video-title" data-tour="weekly-video">
                  <h3 id="weekly-video-title">This week’s student video</h3>
                  <p className="hint"><time dateTime="2026-11-18">November 18, 2026</time> · Dr. Kay Ijisesan</p>
                  <video controls playsInline preload="none" poster="/assets/kti-student-update-2026-11-18-poster.jpg" width={816} height={540} aria-labelledby="weekly-video-title">
                    <source src="/assets/kti-student-update-2026-11-18.mp4" type="video/mp4" />
                  </video>
                  <p><a href="/assets/kti-student-update-2026-11-18.mp4">Open the video in a new page</a></p>
                </section>
                <section className="hub-side-card" aria-labelledby="community-title" data-tour="community">
                  <h3 id="community-title">Community groups</h3>
                  <p>{engagement.posts} {engagement.posts === 1 ? "contribution" : "contributions"} · {engagement.credits} engagement {engagement.credits === 1 ? "credit" : "credits"}. Ask questions and share reflections with classmates and instructors.</p>
                  <Link className="btn quiet" href="/community"><Icon name="message" /> Open community groups</Link>
                </section>
              </aside>
            </div>

            {pending.length && !staffPreview ? (
              <PaymentPanel student={student} pending={pending} scholarshipApplications={scholarshipApplications} paymentMessage={paymentMessage} />
            ) : paymentMessage ? (
              <div className={`notice ${paymentMessage.tone}`} role="status">{paymentMessage.text}</div>
            ) : null}

            <div className="hub-more">
              <details>
                <summary>How you are graded <Icon name="chevron-right" className="disclosure-icon" /></summary>
                <p>You need <strong>{grading.pass_mark}%</strong> to pass. Each course assessment has Section A (40 points, marked instantly) and written work (60 points, graded by your instructor).</p>
                <div className="tablewrap">
                  <table>
                    <thead><tr><th>Component</th><th>Weight</th></tr></thead>
                    <tbody>
                      {grading.components.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.weight}%</td></tr>)}
                      <tr><td><strong>Pass mark</strong></td><td><strong>{grading.pass_mark}%</strong></td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="hint">Grade scale: {grading.scale.map((s) => `${s.grade} ${s.range}`).join(" · ")}</p>
              </details>
              <DeferredDetails summary={<>Messages from Dr. Kay <Icon name="chevron-right" className="disclosure-icon" /></>}>
                {program.welcome_video?.url ? (
                  <section className="module-update" aria-labelledby="welcome-video-title">
                    <h2 id="welcome-video-title">{program.welcome_video.title}</h2>
                    <video src={program.welcome_video.url} poster={program.welcome_video.poster ?? undefined} controls playsInline preload="none" aria-label={program.welcome_video.title ?? "Welcome video"} />
                  </section>
                ) : null}
                {item.modules.some((m) => m.module.number === 1 && (m.state === "available" || m.state === "completed")) ? <ModuleOneUpdate /> : null}
              </DeferredDetails>
              <p className="hint">New to KTI? <a href="/student-guide.pdf" target="_blank" rel="noopener noreferrer">Read the student quick-start guide (PDF)</a>.</p>
            </div>
          </section>
        ))}

        {programs.length ? <StudentWalkthrough /> : null}

        <section className="hub-account" id="password" aria-labelledby="account-title">
          <h2 id="account-title">Account</h2>
          <details open={Boolean(passwordMessage)}>
            <summary>Change your password <Icon name="chevron-right" className="disclosure-icon" /></summary>
            <p>Choose something only you know, at least 10 characters. You will be asked to sign in again after the change, and previous sessions will be signed out.</p>
            <form action={changeOwnPassword} className="password-form">
              <div className="field">
                <label htmlFor="currentPassword">Current password</label>
                <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
              </div>
              <div className="field">
                <label htmlFor="newPassword">New password</label>
                <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={10} required />
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Confirm new password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required />
              </div>
              <button type="submit" className="btn quiet">Update password</button>
            </form>
          </details>
          <form action={signOut}>
            <button type="submit" className="btn">Sign out</button>
          </form>
        </section>
      </div>
    </main>
  );
}
