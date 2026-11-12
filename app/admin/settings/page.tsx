import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { currentStudent, isStaff } from "@/lib/auth";
import { db, hasDurableStorage } from "@/lib/db";
import {
  staffLoginPath,
  STAFF_ACCESS_REQUIRED_PATH,
} from "@/lib/login-redirect";
import { isStripeCheckoutConfigured } from "@/lib/payments/stripe-client";
import { getCurriculum } from "@/lib/curriculum";
import { formatRegistrationDeadline, getRegistrationDeadline, isRegistrationOpen } from "@/lib/registration";
import { hasActiveAccess } from "@/lib/access";
import ModuleAccessFields from "@/components/ModuleAccessFields";
import AdminSubmitButton from "@/components/AdminSubmitButton";
import { createStudentAccount, setStudentModuleAccess, resetStudentPassword, setStudentRole, reopenRegistration } from "../actions";

export const metadata: Metadata = {
  title: "Admin settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettings({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    reset?: string;
    page?: string;
    account?: string;
  }>;
}) {
  const actor = await currentStudent();
  if (!actor) redirect(staffLoginPath("/admin/settings"));
  if (!isStaff(actor)) redirect(STAFF_ACCESS_REQUIRED_PATH);
  const admin = actor.role === "admin";
  const { q = "", role, reset, account, page: pageQuery } = await searchParams;
  const [people, pending] = await Promise.all([
    db.listStudents(),
    db.countPendingScholarshipApplications(),
  ]);
  const registrationDeadline = admin ? await getRegistrationDeadline() : null;
  const registrationOpen = registrationDeadline && isRegistrationOpen(new Date(), registrationDeadline);
  const registrations = admin ? await db.listEnrollments() : [];
  const modules = getCurriculum().modules;
  const accountMessages: Record<string, string> = {
    created: "Account created. The initial password is password123. Share it directly with the student.",
    saved: "Module grants saved.",
    duplicate: "An account with that email already exists. Find it below to manage module grants.",
    invalid: "Enter a full name, valid email and country, and select valid modules.",
    missing: "That account could not be found.",
    failed: "Changes could not be saved. Check the account details and database connection, then try again.",
  };
  const term = q.trim().toLowerCase();
  const visible = people.filter((p) =>
    `${p.fullName} ${p.email} ${p.role}`.toLowerCase().includes(term),
  );
  const pages = Math.max(1, Math.ceil(visible.length / 25));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(pageQuery) || 1)));
  const pagePeople = visible.slice((page - 1) * 25, page * 25);
  const pageUrl = (value: number) =>
    `/admin/settings?${new URLSearchParams({ q, page: String(value) })}`;
  const messages: Record<string, string> = {
    done: "Changes saved successfully.",
    self: "Ask another administrator to change your own access level.",
    last: "The last administrator cannot be removed.",
    nochange: "This account already has that access level.",
    missing: "That account could not be found.",
    invalid:
      "Check the form. Passwords require 10–200 characters; choose a valid access level.",
  };
  const result = role ?? reset;
  return (
    <main className="shell admin-shell" id="main-content" tabIndex={-1}>
      <header className="pagehead">
        <div className="eyebrow">KingsWord administration</div>
        <h1>Admin settings</h1>
        <p className="deck">
          Manage account access, support your students, and check the services
          behind the institute.
        </p>
      </header>
      <AdminNav pendingScholarshipCount={pending} />
      {registrationDeadline ? (
        <section className="admin-section" id="registration-window">
          <h2>Public registration</h2>
          {registrationOpen ? (
            <p>Registration is open until {formatRegistrationDeadline(registrationDeadline)}.</p>
          ) : (
            <>
              <p>Registration is closed. Opening it here starts a 24-hour window immediately.</p>
              {hasDurableStorage ? (
                <form action={reopenRegistration}>
                  <AdminSubmitButton label="Open registration for 24 hours" />
                </form>
              ) : <p>Connect PostgreSQL to manage the registration window.</p>}
            </>
          )}
        </section>
      ) : null}
      <div className="admin-overview-grid">
        <section className="admin-overview-card">
          <span>Your account</span>
          <strong>{actor.fullName}</strong>
          <p>{actor.email}</p>
          <small>
            {admin
              ? "Administrator · full administrative access"
              : "Staff · academic and scholarship operations"}
          </small>
          <Link href="/dashboard#password">Change your own password →</Link>
        </section>
        <section className="admin-overview-card">
          <span>Student database</span>
          <strong>
            {hasDurableStorage ? "Connected" : "Local development"}
          </strong>
          <p>{people.length} accounts available</p>
          <small>
            {hasDurableStorage
              ? "Records are stored in PostgreSQL."
              : "Production requires a persistent database."}
          </small>
        </section>
        <section className="admin-overview-card">
          <span>Services</span>
          <strong>
            {isStripeCheckoutConfigured()
              ? "Checkout configured"
              : "Checkout needs setup"}
          </strong>
          <p>
            {process.env.RESEND_API_KEY
              ? "Email provider configured"
              : "Email provider not configured"}
          </p>
          <small>
            Configuration checks only; provider delivery and availability can
            vary.
          </small>
        </section>
      </div>
      {account && accountMessages[account] ? (
        <p className={`notice ${account === "created" || account === "saved" ? "good" : "warn"}`} role="status">{accountMessages[account]}</p>
      ) : null}
      {admin ? (
        <section className="admin-section" id="create-account">
          <div className="admin-section-head"><div><h2>Create a student account</h2><p>Choose the modules this student may study. No payment is required for these grants.</p></div></div>
          <form action={createStudentAccount} className="admin-create-account">
            <div className="admin-account-fields">
              <label>Full name<input name="fullName" required minLength={2} maxLength={160} autoComplete="name" /></label>
              <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
              <label>Country<input name="country" required minLength={2} maxLength={100} autoComplete="country-name" /></label>
            </div>
            <p className="admin-form-note">Initial password: <strong>password123</strong>. Students can change it from their dashboard.</p>
            <ModuleAccessFields modules={modules} selected={[]} />
            <AdminSubmitButton label="Create account" />
          </form>
        </section>
      ) : null}
      <section className="admin-section">
        <div className="admin-section-head admin-export-head">
          <div>
            <h2>Accounts & permissions</h2>
            <p>
              Students study. Staff review scholarships, grade work, and manage
              registrations. Administrators also manage roles and passwords.
            </p>
          </div>
          <a className="btn" href="/admin/registrations/export">
            Download all registrations (CSV)
          </a>
        </div>
        {result && messages[result] ? (
          <p
            className={`notice ${result === "done" ? "good" : "warn"}`}
            role="status"
          >
            {messages[result]}
          </p>
        ) : null}
        <form className="admin-search-form" method="get">
          <label htmlFor="account-search">Find an account</label>
          <div>
            <input
              id="account-search"
              name="q"
              defaultValue={q}
              placeholder="Name, email, or role"
            />
            <button className="btn primary">Search</button>
            <Link className="btn" href="/admin/settings">
              Clear
            </Link>
          </div>
        </form>
        <p className="admin-form-note">
          {visible.length} matching accounts of {people.length} total; up to 25
          per page. Role changes take effect on the next page load.
          {" "}The CSV download includes all accounts, not just these search results.
          {" "}<Link href="/admin/registrations">View registration groups →</Link>
        </p>
        <div className="admin-student-list">
          {pagePeople.map((p) => (
            <article className="admin-student-row" key={p.id}>
              <div className="admin-student-identity">
                <strong>
                  {p.fullName}
                  {p.id === actor.id ? " (you)" : ""}
                </strong>
                <a href={`mailto:${p.email}`}>{p.email}</a>
                <span className="admin-student-meta">
                  {p.country} · {p.role}
                </span>
              </div>
              {admin ? (
                <details className="admin-module-access">
                  <summary>Module access for {p.fullName}</summary>
                  <form action={setStudentModuleAccess} className="admin-create-account">
                    <input type="hidden" name="studentId" value={p.id} />
                    <ModuleAccessFields modules={modules} selected={registrations.filter((e) => e.studentId === p.id && e.provider === "admin-grant" && e.status === "active" && !e.accessSuspendedAt).map((e) => e.product)} />
                    <p className="admin-form-note">Saving changes only these administrator grants. Paid enrollments, scholarships, and the first module’s launch access still apply. Module release dates still apply.</p>
                    <p className="admin-form-note">Other active enrollment access: {modules.filter((m) => hasActiveAccess(registrations.filter((e) => e.studentId === p.id && e.provider !== "admin-grant"), m.slug)).map((m) => m.short_title).join(", ") || "None"}.</p>
                    <AdminSubmitButton label="Save module grants" />
                  </form>
                </details>
              ) : null}
              {admin && p.id !== actor.id ? (
                <div className="admin-account-controls">
                  <form action={setStudentRole} className="admin-inline-form">
                    <input type="hidden" name="studentId" value={p.id} />
                    <input
                      type="hidden"
                      name="returnTo"
                      value="/admin/settings"
                    />
                    <label>
                      Access level
                      <select name="role" defaultValue={p.role}>
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </label>
                    <button className="btn">Save access</button>
                  </form>
                  <details>
                    <summary>Reset password</summary>
                    <form
                      action={resetStudentPassword}
                      className="admin-inline-form"
                    >
                      <input type="hidden" name="studentId" value={p.id} />
                      <input
                        type="hidden"
                        name="returnTo"
                        value="/admin/settings"
                      />
                      <label>
                        New password
                        <input
                          type="password"
                          name="newPassword"
                          minLength={10}
                          maxLength={200}
                          autoComplete="new-password"
                          required
                        />
                      </label>
                      <button className="btn">Reset password</button>
                      <small>
                        Replaces the current password immediately. Share it with
                        this person securely.
                      </small>
                    </form>
                  </details>
                </div>
              ) : (
                <span className="registration-status active">{p.role}</span>
              )}
            </article>
          ))}
        </div>
        {!visible.length ? (
          <p className="admin-empty">No accounts match your search.</p>
        ) : null}
        {pages > 1 ? (
          <nav className="admin-pagination" aria-label="Account pages">
            {page > 1 ? (
              <Link className="btn" href={pageUrl(page - 1)}>
                Previous
              </Link>
            ) : null}
            <span>
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link className="btn" href={pageUrl(page + 1)}>
                Next
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
