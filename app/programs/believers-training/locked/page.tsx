import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Icon from "@/components/Icon";
import { currentStudent } from "@/lib/auth";
import { believersModules, believersPath } from "@/lib/believers-modules";
import { db } from "@/lib/db";
import { belongsToBelievers } from "@/lib/program-membership";

export const metadata: Metadata = { title: "Module locked", robots: { index: false } };

/** Shown when a student opens a Believers Training module before finishing the ones before it. */
export default async function LockedModulePage({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  const { module: slug } = await searchParams;
  const target = believersModules.find((m) => m.slug === slug);
  const student = await currentStudent();
  if (!student) redirect(`/login?next=${encodeURIComponent(`${believersPath}/${slug ?? ""}`)}`);
  if (!belongsToBelievers(await db.getEnrollmentsForStudent(student.id))) redirect("/enroll?program=believers-training");
  const scores = new Set((await db.getBelieversResults(student.id)).map((r) => r.lessonId));
  const required = believersModules.find((m) => !scores.has(m.slug));
  // Nothing is actually locked any more: go where they were heading.
  if (!target || !required || required.number >= target.number) redirect(target ? `${believersPath}/${target.slug}` : believersPath);
  const unlocks = believersModules.find((m) => m.number === required.number + 1);

  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <div className="locked-card">
        <Icon name="lock" className="locked-icon" />
        <h1>Module {target.number} · {target.title} is locked</h1>
        <p>
          Believers Training modules open in order. You are on <strong>Module {required.number} · {required.title}</strong>.
          Submit all 15 answers in its assessment to unlock {unlocks ? `Module ${unlocks.number}` : "the next module"}.
        </p>
        <div className="action-row">
          <Link className="btn gold lg" href={`${believersPath}/${required.slug}/assessment`}>Take the Module {required.number} assessment</Link>
          <Link className="btn quiet lg" href={`${believersPath}/${required.slug}`}>Review Module {required.number} lessons</Link>
        </div>
        <p className="hint"><Link href="/dashboard?program=believers">Back to My studies</Link></p>
      </div>
    </main>
  );
}
