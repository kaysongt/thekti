import Image from "next/image";
import styles from "@/components/ProgramImages.module.css";
import Link from "next/link";

export const metadata = {
  title: "Believers Training",
  description: "Study seven free video modules or download the printable final assessment for your local church.",
};

const trainingOrigin = "https://seven-module-lms-beta.vercel.app";

export default function BelieversTrainingPage() {
  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <header className={styles.feature}>
        <div>
          <Link href="/programs">All programs</Link>
          <h1>Believers Training</h1>
          <p className={styles.meta}>7 essential classes · 21 credit hours</p>
          <p className="deck">Build a foundation for following Jesus in seven free video modules. Learn at your own pace or with your local church.</p>
        </div>
        <Image src="/assets/programs/believers.webp" alt="" width={834} height={469} sizes="(max-width: 700px) 100vw, 540px" />
      </header>
      <div className="cards program-cards">
        <section className="card">
          <h2 className="t">Study online</h2>
          <p>Create a free account in the Believers Training portal to watch the modules, track your progress, and take the final assessment.</p>
          <div className="foot">
            <a className="btn primary" href={`${trainingOrigin}/believers-training`}>Start free online</a>
          </div>
        </section>
        <section className="card">
          <h2 className="t">Give the assessment at your church</h2>
          <p>Enter your church’s name and location to download the printable 50-question final assessment. No sign-in is required.</p>
          <div className="foot">
            <a className="btn primary" href={`${trainingOrigin}/final-assessment/print`}>Get the printable assessment</a>
          </div>
        </section>
      </div>
    </main>
  );
}
