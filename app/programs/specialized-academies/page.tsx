import Link from "next/link";

import AcademyFinder from "@/components/AcademyFinder";
import { ACADEMIES_CATALOG, ACADEMY_SUBJECTS, PAID_AVAILABILITY, usd } from "@/lib/catalog";

export const metadata = {
  title: "Specialized Academies",
  description: "24 focused academies, each 20 program hours. Each academy is US$50, one-time, for that academy.",
};

export default function SpecializedAcademiesPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <header className="band page-band">
        <div className="wrap">
          <Link className="crumb" href="/programs">All programs</Link>
          <h1>Specialized Academies</h1>
          <p className="deck">{ACADEMIES_CATALOG.length} academies, each focused on one subject in 20 program hours. Each academy is {usd(50)}, one-time. {PAID_AVAILABILITY}.</p>
        </div>
      </header>
      <div className="wrap section">
        <AcademyFinder
          subjects={ACADEMY_SUBJECTS}
          academies={ACADEMIES_CATALOG.map((a) => ({ slug: a.slug, name: a.name, subject: a.subject, href: a.href, price: usd(a.price), hours: a.hours }))}
        />
      </div>
    </main>
  );
}
