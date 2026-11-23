import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatRegistrationDeadline, getRegistrationDeadline, isRegistrationOpen } from "@/lib/registration";

import { BELIEVERS, belongsToBelievers, currentAdvancedEnrollments } from "@/lib/program-membership";
import { db } from "@/lib/db";
import { currentStudent } from "@/lib/auth";
import { getModuleStatuses } from "@/lib/content";
import { formatModuleReleaseDate, getCurriculum } from "@/lib/curriculum";
import { isStripeCheckoutConfigured } from "@/lib/payments/stripe-client";

import EnrollForm from "./EnrollForm";

export const metadata: Metadata = { title: "Enroll" };

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; plan?: string; scholarship?: string }>;
}) {
  const student = await currentStudent();
  const { program: selected, plan, scholarship } = await searchParams;
  if (selected === BELIEVERS) {
    if (student && belongsToBelievers(await db.getEnrollmentsForStudent(student.id))) redirect("/programs/believers-training#classes");
    return <main className="shell" id="main-content" tabIndex={-1}><div className="authwrap"><div className="authcard">
      <h1>{student ? "Join Believers Training" : "Create your account"}</h1>
      <p className="sub">
        {student
          ? `You are signed in as ${student.email}. Join to open the seven free classes and the printable final assessment.`
          : "Believers Training is free. Create a KTI account to open the seven classes and the printable final assessment."}
      </p>
      <EnrollForm free signedIn={Boolean(student)} initialPlan="advanced" modules={[]} scholarshipIntent={false} returnPath="/enroll?program=believers-training" />
    </div></div></main>;
  }
  const existing = student ? currentAdvancedEnrollments(await db.getEnrollmentsForStudent(student.id)) : [];
  if (existing.length) {
    return <main className="shell" id="main-content" tabIndex={-1}><div className="authwrap"><div className="authcard">
      <h1>You are already enrolled</h1>
      <p className="sub">Your Advanced Certificate enrollment is on file, so there is nothing to submit again. My studies shows your next lesson{existing.some((e) => e.status === "pending") ? " and your payment options" : ""}.</p>
      <Link className="btn primary lg block" href="/dashboard#program-advanced">Go to My studies</Link>
      <p className="formfoot">Want to add Believers Training? <Link href="/enroll?program=believers-training">Join it free</Link>.</p>
    </div></div></main>;
  }
  const deadline = await getRegistrationDeadline();
  const deadlineLabel = formatRegistrationDeadline(deadline);
  if (!isRegistrationOpen(new Date(), deadline)) return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <div className="authwrap"><div className="authcard">
        <h1>Registration has closed</h1>
        <p>The most recent registration window closed {deadlineLabel}. Existing students retain their access and can continue studying and making payments.</p>
        <Link className="btn primary" href="/login">Sign in</Link>
        <p>For registration enquiries, email <a href="mailto:kti@kingsword.org">kti@kingsword.org</a>.</p>
      </div></div>
    </main>
  );



  const { program } = getCurriculum();
  const modules = getModuleStatuses().map((s) => ({
    slug: s.module.slug,
    title: s.module.title,
    available: s.available,
    availability: formatModuleReleaseDate(s.module),
  }));
  const availableCount = modules.filter((m) => m.available).length;
  const firstReleaseDate = modules[0].availability;
  const initialPlan = plan === "certificate" ? "certificate" : "advanced";
  const scholarshipIntent = scholarship === "apply";
  const stripeConfigured = isStripeCheckoutConfigured();

  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <div className="authwrap">
        <div className="authcard">
          <h1>{student ? "Join the Advanced Certificate" : "Create your account"}</h1>
          <div className="notice good"><strong>Registration is open.</strong> Sign up before {deadlineLabel}.</div>
          <p className="sub">
            {student
              ? `You are signed in as ${student.email}. Choose a single certificate or the full ${program.title}.`
              : `Enroll in the ${program.title}. Choose a single certificate or reserve your place in the full program.`}
          </p>

          {scholarshipIntent ? (
            <div className="notice good">
              <strong>Your scholarship application starts here.</strong>{" "}
              Choose the program you want and create your account. You will continue directly to
              the private scholarship form before making any payment.
            </div>
          ) : null}

          <div className={stripeConfigured ? "notice good" : "notice warn"}>
            <strong>
              {stripeConfigured ? "Secure online payment follows registration." : "Direct payment instructions follow registration."}
            </strong>{" "}
            {scholarshipIntent ? "You can apply for financial assistance before paying." : "Register to start Module 1 when it opens. Payment or an approved scholarship/minister waiver is required to continue into later modules."}
          </div>

          {availableCount < program.total_certificates ? (
            <p className="enrollment-schedule">
              {availableCount > 0
                ? `${availableCount} of ${program.total_certificates} certificates are ready to study today. The rest unlock according to the published release schedule.`
                : `Classes begin ${firstReleaseDate}. You may enroll now; each certificate unlocks on its published date.`}
            </p>
          ) : null}

          <EnrollForm
            signedIn={Boolean(student)}
            initialPlan={initialPlan}
            modules={modules}
            scholarshipIntent={scholarshipIntent}
            returnPath={`/enroll${plan === "certificate" ? "?plan=certificate" : ""}`}
          />
        </div>
      </div>
    </main>
  );
}
