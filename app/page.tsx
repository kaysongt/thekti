import Link from "next/link";
import ProgramCatalog from "@/components/ProgramCatalog";

export default function HomePage() {
  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <section className="hero">
        <h1>KingsWord Training Institute</h1>
        <p className="deck">Raising a supernatural army</p>
      </section>
      <section aria-labelledby="programs-heading">
        <h2 id="programs-heading">Choose a program</h2>
        <ProgramCatalog />
        <Link href="/programs" className="text-action">View the full program catalog →</Link>
      </section>
    </main>
  );
}
