import { currentStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { belongsToBelievers } from "@/lib/program-membership";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Printable Believers Training Assessment",
  robots: { index: false },
};

export default async function PrintableAssessmentPage() {
  const student = await currentStudent();
  if (!student) redirect("/login?next=/programs/believers-training/assessment");
  if (!belongsToBelievers(await db.getEnrollmentsForStudent(student.id))) redirect("/enroll?program=believers-training");
  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <header className="pagehead">
        <Link href="/programs/believers-training">Believers Training</Link>
        <h1>Printable final assessment</h1>
        <p className="deck">Enter your church’s name and location to download the 50-question assessment. KTI records both details when you download it.</p>
      </header>
      <form method="post" action="/programs/believers-training/assessment/download">
        <div className="field">
          <label htmlFor="church">Church name</label>
          <input id="church" name="church" required minLength={2} maxLength={200} />
        </div>
        <div className="field">
          <label htmlFor="location">Church location</label>
          <input id="location" name="location" required minLength={2} maxLength={200} placeholder="City, state or province, and country" />
        </div>
        <button className="btn primary" type="submit">Download printable assessment</button>
        <p>Open the downloaded file in your browser to print it or save it as a PDF.</p>
      </form>
    </main>
  );
}
