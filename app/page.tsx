import Link from "next/link";
import ProgramCatalog from "@/components/ProgramCatalog";

export default function HomePage() {
  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <section className="hero">
        <h1>KingsWord Training Institute</h1>
        <p className="deck">Raising a supernatural army</p>
        <nav className="cta-row program-bubbles" aria-label="Explore KTI programs">
          <Link href="/programs/believers-training" className="btn lg gold">Believers Training</Link>
          <Link href="/programs/advanced-certificate" className="btn lg gold">Advanced Certificate</Link>
          <Link href="/programs#basic-certificates" className="btn lg gold">Basic Certificates</Link>
          <Link href="/programs#specialized-academies" className="btn lg gold">Specialized Academy</Link>
        </nav>
      </section>
      <section aria-labelledby="programs-heading">
        <h2 id="programs-heading">Choose a program</h2>
        <ProgramCatalog />
        <Link href="/programs" className="text-action">View the full program catalog →</Link>
      </section>
    </main>
  );
}
