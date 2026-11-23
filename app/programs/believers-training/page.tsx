import { currentStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { belongsToBelievers } from "@/lib/program-membership";
import { believersModules, believersPath } from "@/lib/believers-modules";
import Image from "next/image";
import styles from "@/components/ProgramImages.module.css";
import Link from "next/link";

export const metadata = {
  title: "Believers Training",
  description: "Study seven free video modules or download the printable final assessment for your local church.",
};



export default async function BelieversTrainingPage() {
  const student = await currentStudent();
  const enrolled = student && belongsToBelievers(await db.getEnrollmentsForStudent(student.id));
  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <header className={styles.feature}>
        <div>
          <Link href="/programs">All programs</Link>
          <h1>Believers Training</h1>
          <p className={styles.meta}>7 essential classes · 21 program hours</p>
          <p className="deck">Build a foundation for following Jesus in seven free video modules. Learn at your own pace or with your local church.</p>
        </div>
        <Image src="/assets/programs/believers-2026.webp" alt="" width={834} height={469} sizes="(max-width: 700px) 100vw, 540px" />
      </header>
      {enrolled ? <><div className="cards program-cards">
        <section className="card">
          <h2 className="t">Study online</h2>
          <p>Study seven modules with teaching videos, student manuals, and lesson audio.</p>
          <div className="foot">
            <a className="btn primary" href="#classes">Explore the modules</a>
          </div>
        </section>
        <section className="card">
          <h2 className="t">Give the assessment at your church</h2>
          <p>Enter your church’s name and location to download the printable 50-question final assessment.</p>
          <div className="foot">
            <Link className="btn primary" href="/programs/believers-training/assessment">Get the printable assessment</Link>
          </div>
        </section>
      </div>
      <section id="classes" aria-labelledby="classes-title">
        <h2 id="classes-title">Your seven modules</h2>
        <ol className="cards program-cards">
          {believersModules.map((m) => <li className="card" key={m.slug}>
            <p>Module {m.number} · 10 lessons and a review</p>
            <h3>{m.title}</h3><p>{m.objectives[0]}</p>
            <Link className="btn primary" href={believersPath + "/" + m.slug}>Open module {m.number}</Link>
          </li>)}
        </ol>
      </section>
      </> : <section className="panel">
        <h2>Start your training</h2>
        <p>Join this free program to watch the classes and access the final assessment.</p>
        <Link className="btn primary" href="/enroll?program=believers-training">Join Believers Training</Link>
        {!student && <p>Already enrolled? <Link href="/login?next=/programs/believers-training">Sign in</Link></p>}
      </section>}
    </main>
  );
}
