import Link from "next/link";

import Icon from "@/components/Icon";
import { currentStudent } from "@/lib/auth";
import { PAID_AVAILABILITY, PAID_AVAILABILITY_DETAIL, paidProgramState, usd, type PaidProgram } from "@/lib/catalog";
import { db } from "@/lib/db";
import { paidProgramCheckoutReady } from "@/lib/payments/stripe-client";

/** Exactly what is being bought: name, one-time price, scope, and when classes run. */
export function OrderSummary({ program, compact = false }: { program: PaidProgram; compact?: boolean }) {
  const scope = program.kind === "basic" ? "This one track only" : "This one academy only";
  return (
    <dl className={`order-summary${compact ? " compact" : ""}`} aria-label="What you are enrolling in">
      <div><dt>Program</dt><dd>{program.name}</dd></div>
      <div><dt>Tuition</dt><dd><strong>{usd(program.price)}</strong> one-time · {scope}</dd></div>
      <div><dt>Classes</dt><dd>{PAID_AVAILABILITY}{compact ? "" : `. ${PAID_AVAILABILITY_DETAIL}`}</dd></div>
    </dl>
  );
}

export function enrollPath(program: PaidProgram) {
  return `/enroll?program=${program.product}`;
}

export function hubPath(program: PaidProgram) {
  return `/dashboard?program=${program.product}`;
}

/** The one action for this visitor, chosen from their account and enrollments. */
export default async function PaidProgramPanel({ program }: { program: PaidProgram }) {
  const student = await currentStudent();
  const records = student ? await db.getEnrollmentsForStudent(student.id) : [];
  const state = paidProgramState(program, records);
  const ready = paidProgramCheckoutReady(program.product);
  const price = usd(program.price);

  return (
    <section className="paid-panel" aria-label="Enrollment">
      {/* Nothing to buy for a pass holder, so no price is shown. */}
      {state === "covered-by-pass" ? null : <OrderSummary program={program} />}
      {state === "covered-by-pass" ? (
        <div className="paid-panel-status">
          <p><Icon name="check-circle" /> Your Basic Certificates pass already covers this track. You don’t need to buy it again.</p>
          <Link className="btn primary lg block" href="/dashboard?program=basic-certificates">Open My studies</Link>
        </div>
      ) : state === "enrolled" ? (
        <div className="paid-panel-status">
          <p><Icon name="check-circle" /> You’re enrolled. {PAID_AVAILABILITY}.</p>
          <Link className="btn primary lg block" href={hubPath(program)}>Open My studies</Link>
        </div>
      ) : state === "payment-due" ? (
        <div className="paid-panel-status">
          <p>Your place is reserved. Tuition of {price} is still due.</p>
          <Link className="btn gold lg block" href={hubPath(program)}>Pay {price}</Link>
        </div>
      ) : state === "on-hold" ? (
        <div className="paid-panel-status">
          <p>Access to this program is on hold while KTI reviews a payment.</p>
          <a className="btn quiet lg block" href="mailto:kti@kingsword.org?subject=Program%20access">Email KTI</a>
        </div>
      ) : !ready ? (
        <p className="paid-panel-status">Online enrollment for this program opens soon. Email <a href="mailto:kti@kingsword.org">kti@kingsword.org</a> to be told when it does.</p>
      ) : student ? (
        <Link className="btn gold lg block" href={enrollPath(program)}>Enroll · {price}</Link>
      ) : (
        <div className="paid-panel-actions">
          <Link className="btn gold lg block" href={enrollPath(program)}>Create an account to enroll · {price}</Link>
          <p className="hint">Already have a KTI account? <Link href={`/login?next=${encodeURIComponent(enrollPath(program))}`}>Sign in to enroll</Link></p>
        </div>
      )}
    </section>
  );
}
