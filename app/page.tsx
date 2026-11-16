import Link from "next/link";
import ProgramCatalog from "@/components/ProgramCatalog";

export default function HomePage() {
  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <section className="hero">
        <h1>KingsWord Training Institute</h1>
        <p className="deck">Study the Bible, grow in your faith, and prepare to serve.</p>
        <div className="cta-row">
          <Link href="/programs/believers-training" className="btn lg gold">Explore Believers Training</Link>
          <Link href="/dashboard" className="btn lg ghost">Continue studying</Link>
        </div>
      </section>
      <section aria-labelledby="programs-heading">
        <h2 id="programs-heading">Choose a program</h2>
        <ProgramCatalog />
      </section>
    </main>
  );
}
