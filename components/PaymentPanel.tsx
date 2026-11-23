import Link from "next/link";

import StripeCheckoutButton from "@/components/StripeCheckoutButton";
import { beginStripeCheckout } from "@/app/dashboard/actions";
import { getCurriculum } from "@/lib/curriculum";
import type { Enrollment, ScholarshipApplication, Student } from "@/lib/db/types";
import { promotionCodesAllowed } from "@/lib/payments/promotions";
import { isStripeCheckoutConfigured } from "@/lib/payments/stripe-client";
import { listLatestStripePaymentAttempts, type StripePaymentAttemptSummary } from "@/lib/payments/stripe-store";
import { getPaymentReminderTiming } from "@/lib/reminders/payment-reminder-policy";

const paymentStatusLabels: Record<StripePaymentAttemptSummary["status"], string> = {
  created: "Starting checkout",
  open: "Checkout ready",
  processing: "Payment processing",
  paid: "Paid",
  failed: "Payment failed",
  expired: "Checkout expired",
  "partially-refunded": "Partially refunded",
  refunded: "Refunded",
  disputed: "Payment under review",
};

function tuition(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/**
 * Tuition still owed on a reserved enrollment: promo code, Stripe Checkout,
 * scholarship, and bank transfer, in that order. Moved out of the dashboard
 * unchanged so it can sit inside the program it belongs to.
 */
export default async function PaymentPanel({
  student,
  pending,
  scholarshipApplications,
  paymentMessage,
}: {
  student: Pick<Student, "email">;
  pending: Enrollment[];
  scholarshipApplications: ScholarshipApplication[];
  paymentMessage: { tone: string; text: string } | null;
}) {
  const { program } = getCurriculum();
  const stripeConfigured = isStripeCheckoutConfigured();
  const paymentAttempts = await listLatestStripePaymentAttempts(pending.map((enrollment) => enrollment.id));
  const scholarshipsByEnrollment = new Map(scholarshipApplications.map((application) => [application.enrollmentId, application]));
  const moduleNames = new Map(getCurriculum().modules.map((module) => [module.slug, module.short_title]));
  const paymentDetails = {
    accountName: process.env.PAYMENT_BANK_ACCOUNT_NAME?.trim(),
    bankName: process.env.PAYMENT_BANK_NAME?.trim(),
    accountNumber: process.env.PAYMENT_BANK_ACCOUNT_NUMBER?.trim(),
    routingNumber: process.env.PAYMENT_BANK_ROUTING_NUMBER?.trim(),
  };
  const canShowPaymentDetails = Object.values(paymentDetails).every(Boolean);

  return (
    <section
      id="complete-payment"
      data-tour="payment"
      className="pending-payment"
      aria-labelledby="pending-payment-title"
    >
      <div className="payment-heading">
        <div>
          <h2 id="pending-payment-title">Complete your enrollment</h2>
        </div>
        <span className="secure-payment-mark">
          {stripeConfigured ? "Secure checkout by Stripe" : "Bank transfer available"}
        </span>
      </div>
      <p>
        Your account is ready. Apply an approved full-tuition code, pay securely by card,
        or use the bank-transfer option. Module 1 opens to everyone registered. Later modules require payment or an approved scholarship/waiver covering that module.
      </p>

      {paymentMessage ? (
        <div className={`notice ${paymentMessage.tone}`} role="status">
          {paymentMessage.text}
        </div>
      ) : null}

      <div className="pending-enrollment-list">
        {pending.map((enrollment) => {
          const attempt = paymentAttempts.get(enrollment.id);
          const paymentInFlight = attempt?.status === "processing";
          const staffReview =
            attempt?.needsReview ||
            attempt?.status === "partially-refunded" ||
            attempt?.status === "disputed";
          const canOpenCheckout = stripeConfigured && !paymentInFlight && !staffReview;
          const scholarship = scholarshipsByEnrollment.get(enrollment.id);
          const paymentTiming = getPaymentReminderTiming(enrollment);
          return (
            <article className="pending-enrollment" key={enrollment.id}>
              <div>
                <span className="pending-enrollment-plan">
                  {enrollment.plan === "advanced" ? "Full program" : "Single certificate"}
                </span>
                <h3>
                  {enrollment.product === "advanced"
                    ? "Advanced Certificate in Biblical Studies"
                    : moduleNames.get(enrollment.product) ?? enrollment.product}
                </h3>
                <strong>{tuition(enrollment.amount, enrollment.currency)}</strong>
                {attempt ? (
                  <span className={`payment-state ${attempt.status}`}>
                    {paymentStatusLabels[attempt.status]}
                  </span>
                ) : null}
                {paymentTiming ? (
                  <div
                    className={`payment-access-reminder${
                      paymentTiming.daysUntilStart <= 0 ? " has-started" : ""
                    }`}
                  >
                    <span>Payment deadline</span>
                    <strong>
                      {paymentTiming.daysUntilStart <= 0
                        ? `Due from ${paymentTiming.startDateLabel}`
                        : `Pay before ${paymentTiming.startDateLabel}`}
                    </strong>
                    <small>
                      Module 1 is open to registered students from its release time. Later modules unlock after payment, an approved scholarship, or a verified tuition waiver is confirmed.
                    </small>
                  </div>
                ) : null}
              </div>
              <div className="pending-enrollment-actions">
                {canOpenCheckout && promotionCodesAllowed(enrollment.plan) ? (
                  <div className="promo-redemption">
                    <strong>Full-tuition promo</strong>
                    <form action={beginStripeCheckout} className="promo-code-form">
                      <input type="hidden" name="enrollmentId" value={enrollment.id} />
                      <label htmlFor={`promotionCode-${enrollment.id}`}>Promo code</label>
                      <div className="promo-code-row">
                        <input
                          id={`promotionCode-${enrollment.id}`}
                          name="promotionCode"
                          type="text"
                          inputMode="text"
                          autoComplete="off"
                          autoCapitalize="characters"
                          spellCheck={false}
                          minLength={4}
                          maxLength={40}
                          pattern="[A-Za-z0-9-]{4,40}"
                          placeholder="Enter code"
                          required
                        />
                        <StripeCheckoutButton purpose="promotion" />
                      </div>
                    </form>
                    <small>A valid 100%-off code continues without card or bank details.</small>
                  </div>
                ) : null}
                {canOpenCheckout && promotionCodesAllowed(enrollment.plan) ? (
                  <div className="payment-choice-divider"><span>or pay tuition</span></div>
                ) : null}
                {canOpenCheckout ? (
                  <form action={beginStripeCheckout}>
                    <input type="hidden" name="enrollmentId" value={enrollment.id} />
                    <StripeCheckoutButton />
                  </form>
                ) : paymentInFlight ? (
                  <p className="payment-processing-note">
                    Confirmation is in progress. Please do not submit another payment.
                  </p>
                ) : staffReview ? (
                  <p className="payment-processing-note">
                    The KingsWord team is reviewing this payment. No further payment is needed.
                  </p>
                ) : (
                  <p className="payment-processing-note">
                    Online checkout is being configured. Bank transfer remains available.
                  </p>
                )}
                <div className={`scholarship-payment-option${scholarship ? ` ${scholarship.status}` : ""}`}>
                  {scholarship?.status === "pending" ? (
                    <>
                      <strong>Scholarship under review</strong>
                      <Link href={`/scholarship?enrollment=${enrollment.id}`}>View application status</Link>
                    </>
                  ) : scholarship?.status === "declined" ? (
                    <>
                      <strong>Scholarship application reviewed</strong>
                      <Link href={`/scholarship?enrollment=${enrollment.id}`}>View decision and payment options</Link>
                    </>
                  ) : (
                    <>
                      <span>Unable to afford tuition?</span>
                      <Link href={`/scholarship?enrollment=${enrollment.id}`}>Apply for a scholarship</Link>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="payment-divider"><span>Bank transfer option</span></div>
      {canShowPaymentDetails ? (
        <>
          <dl className="payment-details">
            <div>
              <dt>Account name</dt>
              <dd>{paymentDetails.accountName}</dd>
            </div>
            <div>
              <dt>Bank</dt>
              <dd>{paymentDetails.bankName}</dd>
            </div>
            <div>
              <dt>Account number</dt>
              <dd>{paymentDetails.accountNumber}</dd>
            </div>
            <div>
              <dt>Routing number</dt>
              <dd>{paymentDetails.routingNumber}</dd>
            </div>
          </dl>
          <p className="payment-note">
            Use <strong>{student.email}</strong> as the transfer reference, then email your
            receipt to <a href={`mailto:${program.contact.email}`}>{program.contact.email}</a>.
          </p>
        </>
      ) : (
        <p>
          Contact <a href={`mailto:${program.contact.email}`}>{program.contact.email}</a> for
          payment instructions.
        </p>
      )}
    </section>
  );
}
