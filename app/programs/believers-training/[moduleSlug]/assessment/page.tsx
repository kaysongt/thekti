import { createHash } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import banks from "@/content/believers-training/assessments.json";
import { believersModules, believersPath, getStudyAccess } from "@/lib/believers-modules";
import { db } from "@/lib/db";

function questionsFor(slug: string) {
  const bank = banks.find((entry) => entry.slug === slug);
  if (!bank || bank.questions.length !== 15) throw new Error("Missing module assessment");
  return bank.questions;
}

async function submit(slug: string, form: FormData) {
  "use server";
  const { student, module, score } = await getStudyAccess(slug, "assessment");
  const url = believersPath + "/" + module.slug + "/assessment";
  if (score !== undefined) redirect(url);
  const questions = questionsFor(slug);
  const answers = questions.map((question, index) => {
    const values = form.getAll("q" + index);
    const value = values[0];
    if (values.length !== 1 || typeof value !== "string" || !/^[0-3]$/.test(value)) redirect(url + "?incomplete=1");
    return { lesson: question.lesson, choice: Number(value) };
  });
  const correct = questions.filter((q, i) => q.answer === answers[i].choice).length;
  await db.createQuizAttempt({
    id: createHash("sha256").update(JSON.stringify(["bt-assessment", student.id, slug])).digest("hex"),
    studentId: student.id, courseSlug: "believers-training", lessonId: slug,
    kind: "topic", correct, total: questions.length, scorePct: Math.round(correct * 100 / questions.length),
    passed: true, answers,
  });
  revalidatePath(believersPath, "layout");
  redirect(url);
}

export default async function ModuleAssessment({ params, searchParams }: {
  params: Promise<{ moduleSlug: string }>;
  searchParams: Promise<{ incomplete?: string }>;
}) {
  const { moduleSlug } = await params;
  const { module, score } = await getStudyAccess(moduleSlug, "assessment");
  const path = believersPath + "/" + module.slug;
  const questions = questionsFor(module.slug);
  const next = believersModules.find((entry) => entry.number === module.number + 1);
  return <main className="shell" id="main-content"><article style={{ maxWidth: "72ch", marginInline: "auto" }}>
    <header className="pagehead">
      <Link href={path}>← Module {module.number} · {module.title}</Link>
      <h1>Module {module.number} assessment</h1>
    </header>
    {score !== undefined ? <>
      <h2>Assessment complete</h2><p>You answered {score} of {questions.length} questions correctly.</p>
      <Link className="btn primary" href={next ? believersPath + "/" + next.slug : believersPath + "/assessment"}>
        {next ? "Continue to Module " + next.number + " · " + next.title : "Open the printable final assessment"}
      </Link>
      <h2>Review the answers</h2>
      <ol>{questions.map((q) => {
        const lesson = module.lessons[q.lesson - 1];
        return <li key={q.question}><p><strong>{q.question}</strong></p><p>{q.options[q.answer]}</p>
          <blockquote>{q.evidence}</blockquote><Link href={path + "/" + lesson.slug}>Review lesson {q.lesson} · {lesson.title}</Link>
        </li>;
      })}</ol>
    </> : <form action={submit.bind(null, module.slug)}>
      <p>Choose one answer for each question. Submit all 15 to see your score and {next ? "unlock the next module" : "complete your seventh module"}.</p>
      {(await searchParams).incomplete && <p role="alert">Please select one answer for every question.</p>}
      {questions.map((q, i) => <fieldset key={q.question} style={{ marginBlock: "1.5rem", padding: "1rem" }}>
        <legend><strong>{i + 1}. {q.question}</strong></legend>
        {q.options.map((option, n) => <label key={option} style={{ display: "flex", alignItems: "baseline", gap: ".75rem", paddingBlock: ".6rem" }}>
          <input type="radio" name={"q" + i} value={n} required />{option}
        </label>)}
      </fieldset>)}
      <button type="submit" className="btn primary">Submit assessment</button>
    </form>}
  </article></main>;
}
