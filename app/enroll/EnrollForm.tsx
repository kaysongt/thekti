"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import Icon from "@/components/Icon";

import { registerStudent, type FormState } from "./actions";

const COUNTRIES = [
  "Nigeria",
  "United States",
  "United Kingdom",
  "Canada",
  "Ghana",
  "South Africa",
  "Kenya",
  "Other",
];

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn primary lg block" disabled={pending} aria-disabled={pending}>
      {pending ? "Submitting…" : label}
    </button>
  );
}

type ModuleOption = { slug: string; title: string; available: boolean; availability?: string };

export default function EnrollForm({
  initialPlan,
  free = false,
  offerProduct,
  offerLabel,
  signedIn = false,
  modules,
  scholarshipIntent,
  returnPath = "/enroll",
}: {
  free?: boolean;
  offerProduct?: string;
  /** Price shown on the submit button for a paid program, e.g. "US$250". */
  offerLabel?: string;
  signedIn?: boolean;
  initialPlan: "certificate" | "advanced";
  modules: ModuleOption[];
  scholarshipIntent: boolean;
  /** Where sign-in should bring this person back to, so they finish joining. */
  returnPath?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(registerStudent, {});
  const [plan, setPlan] = useState(initialPlan);

  const err = state.fieldErrors ?? {};
  const signInHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const val = state.values ?? {};
  return (
    // Remount after each response so selects and checkboxes show the submitted values again.
    <form action={action} key={state.values ? JSON.stringify(state.values) : "initial"}>
      {scholarshipIntent ? <input type="hidden" name="scholarshipIntent" value="apply" /> : null}
      {state.error ? <div className="notice bad" role="alert">{state.error}</div> : null}

      {free || offerProduct ? <input type="hidden" name="program" value={offerProduct ?? "believers-training"} /> : <>
      <div className="field">
        <label htmlFor="plan">What are you enrolling in?</label>
        <select
          id="plan"
          name="plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value as "certificate" | "advanced")}
        >
          <option value="advanced">Advanced Certificate - all five programs ($1,000)</option>
          <option value="certificate">One module / certificate ($250)</option>
        </select>
      </div>

      {plan === "certificate" ? (
        <div className={`field${err.product ? " err" : ""}`}>
          <label htmlFor="product">Which certificate?</label>
          <select id="product" aria-invalid={err.product ? true : undefined} aria-describedby={err.product ? "product-error" : undefined} name="product" defaultValue={val.product ?? ""} required>
            <option value="">Select a certificate…</option>
            {modules.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.title}
                {m.available ? "" : ` (Opens ${m.availability ?? "later"})`}
              </option>
            ))}
          </select>
          <div className="hint">
            You may enroll and pay now. Study access begins on the published opening date.
          </div>
          {err.product ? <div className="msg" id="product-error"><Icon name="alert" />{err.product}</div> : null}
        </div>
      ) : null}

      </>}
      {!signedIn && <>
      <div className={`field${err.fullName ? " err" : ""}`}>
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName" aria-invalid={err.fullName ? true : undefined} aria-describedby={err.fullName ? "fullName-error" : undefined}
          name="fullName"
          defaultValue={val.fullName ?? ""}
          autoComplete="name"
          minLength={2}
          maxLength={100}
          required
        />
        {err.fullName ? <div className="msg" id="fullName-error"><Icon name="alert" />{err.fullName}</div> : null}
      </div>

      <div className={`field${err.email ? " err" : ""}`}>
        <label htmlFor="email">Email address</label>
        <input
          id="email" aria-invalid={err.email ? true : undefined} aria-describedby={err.email ? "email-error" : undefined}
          name="email"
          type="email"
          defaultValue={val.email ?? ""}
          autoComplete="email"
          maxLength={254}
          required
        />
        {err.email ? <div className="msg" id="email-error"><Icon name="alert" /><span>{err.email}{err.email.includes("already exists") ? <> <Link href={signInHref}>Sign in to continue joining</Link>.</> : null}</span></div> : null}
      </div>

      <div className={`field${err.country ? " err" : ""}`}>
        <label htmlFor="country">Country</label>
        <select id="country" aria-invalid={err.country ? true : undefined} aria-describedby={err.country ? "country-error" : undefined} name="country" defaultValue={val.country ?? ""} required>
          <option value="">Select your country…</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {err.country ? <div className="msg" id="country-error"><Icon name="alert" />{err.country}</div> : null}
      </div>

      <div className={`field${err.password ? " err" : ""}`}>
        <label htmlFor="password">Password</label>
        <input
          id="password" aria-invalid={err.password ? true : undefined} aria-describedby={err.password ? "password-error" : undefined}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={200}
          required
        />
        <div className="hint">At least 10 characters.</div>
        {err.password ? <div className="msg" id="password-error"><Icon name="alert" />{err.password}</div> : null}
      </div>

      </>}
      <div className="form-trap" aria-hidden="true">
        <label htmlFor="website" aria-hidden="true">
          Website
        </label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>

      <div className={`field consent-field${err.privacyAccepted ? " err" : ""}`}>
        <label className="consent-row" htmlFor="privacyAccepted">
          <input
            id="privacyAccepted" aria-invalid={err.privacyAccepted ? true : undefined} aria-describedby={err.privacyAccepted ? "privacyAccepted-error" : undefined}
            name="privacyAccepted"
            type="checkbox"
            value="yes"
            required
            defaultChecked={val.privacyAccepted === "yes"}
          />
          <span>
            I have read the <Link href="/privacy">privacy notice</Link> and understand how my
            registration and learning records are used.
          </span>
        </label>
        {err.privacyAccepted ? <div className="msg" id="privacyAccepted-error"><Icon name="alert" />{err.privacyAccepted}</div> : null}
      </div>

      <Submit
        label={offerProduct ? (signedIn ? `Reserve my place · ${offerLabel ?? ""}`.trim() : `Create account and continue to payment`) : signedIn ? (free ? "Join Believers Training" : "Join this program") : scholarshipIntent ? "Create account and continue application" : free ? "Create account and join" : "Create account and enroll"}
      />

      {!signedIn && <p className="formfoot">
        Already have a KTI account? <Link href={signInHref}>Sign in to join</Link>
      </p>}
    </form>
  );
}
