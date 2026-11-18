import Image from "next/image";
import styles from "@/components/ProgramImages.module.css";
import Link from "next/link";

export const metadata = {
  title: "Believers Training",
  description: "Study seven free video modules or download the printable final assessment for your local church.",
};

const classes = [
  { title: "The New Covenant", videoId: "0IWX-fwHmu0" },
  { title: "Identity in Christ", videoId: "rebnFvX6r_8" },
  { title: "The Word: The Agent of Change", videoId: "4CzCbnx0eEU" },
  { title: "The Ministry of the Holy Spirit", videoId: "2EEpawrfzMM" },
  { title: "Spiritual Authority and Prayer", videoId: "-zxEVgYMbeU" },
  { title: "Purpose and Calling", videoId: "zRPiNwnmVbs" },
  { title: "Stewardship and Missional Lifestyle", videoId: "RLbRya09Mn8" },
];

export default function BelieversTrainingPage() {
  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <header className={styles.feature}>
        <div>
          <Link href="/programs">All programs</Link>
          <h1>Believers Training</h1>
          <p className={styles.meta}>7 essential classes · 21 program hours</p>
          <p className="deck">Build a foundation for following Jesus in seven free video modules. Learn at your own pace or with your local church.</p>
        </div>
        <Image src="/assets/programs/believers.webp" alt="" width={834} height={469} sizes="(max-width: 700px) 100vw, 540px" />
      </header>
      <div className="cards program-cards">
        <section className="card">
          <h2 className="t">Study online</h2>
          <p>Watch all seven video classes for free on KTI.</p>
          <div className="foot">
            <a className="btn primary" href="#classes">Watch the classes</a>
          </div>
        </section>
        <section className="card">
          <h2 className="t">Give the assessment at your church</h2>
          <p>Enter your church’s name and location to download the printable 50-question final assessment. No sign-in is required.</p>
          <div className="foot">
            <Link className="btn primary" href="/programs/believers-training/assessment">Get the printable assessment</Link>
          </div>
        </section>
      </div>
      <section id="classes" aria-labelledby="classes-title">
        <h2 id="classes-title">Believers Training classes</h2>
        <p>Saved progress and the online final assessment are coming to KTI later.</p>
        {classes.map(({ title, videoId }, index) => (
          <section key={videoId} aria-labelledby={`bt-class-${index + 1}`}>
            <h3 id={`bt-class-${index + 1}`}>Class {index + 1} · {title}</h3>
            <div className="videoslot">
              <div className="frame">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title={title}
                  loading="lazy"
                  allow="encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
