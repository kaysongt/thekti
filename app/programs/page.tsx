import Image from "next/image";
import Link from "next/link";

import Icon from "@/components/Icon";
import { ACADEMIES_CATALOG, BASIC_TRACKS } from "@/lib/catalog";
import { AVAILABILITY_LABELS, PROGRAMS, type ProgramSummary } from "@/lib/programs";

export const metadata = {
  title: "Programs",
  description: "Choose a KTI program: free Believers Training, the Advanced Certificate in Biblical Studies, six Basic Certificate tracks at US$250 each, or one of 24 Specialized Academies at US$50 each.",
};

const ACTION: Record<ProgramSummary["key"], string> = {
  believers: "Start Believers Training",
  advanced: "See the Advanced Certificate",
  basic: `Choose one of ${BASIC_TRACKS.length} tracks`,
  specialized: `Browse ${ACADEMIES_CATALOG.length} academies`,
};

// Old links pointed at #basic-certificates and #specialized-academies on this page.
const ANCHOR: Record<ProgramSummary["key"], string> = {
  believers: "program-believers",
  advanced: "program-advanced",
  basic: "basic-certificates",
  specialized: "specialized-academies",
};

export default function ProgramsPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <header className="band page-band">
        <div className="wrap">
          <h1>Choose a program</h1>
          <p className="deck">Four ways to study at KingsWord Training Institute. Pick the family that fits you, then choose your program inside it.</p>
        </div>
      </header>

      <div className="wrap section">
        <ul className="family-grid">
          {PROGRAMS.map((program) => (
            <li key={program.key} id={ANCHOR[program.key]} className="family-card">
              <Link href={program.href} className="family-link">
                <Image src={program.image} alt="" width={834} height={469} sizes="(max-width: 760px) calc(100vw - 32px), 560px" />
                <span className="family-body">
                  <span className="family-name">{program.title}</span>
                  <span className="family-fit">{program.fit}</span>
                  <span className="family-facts">
                    <strong>{program.priceLabel}</strong>
                    <span>{program.hoursLabel}</span>
                  </span>
                  <span className={`badge ${program.availability}`}>{AVAILABILITY_LABELS[program.availability]}</span>
                  <span className="family-action">{ACTION[program.key]} <Icon name="arrow-right" className="arrow" /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="hint catalog-languages">Planned program languages: English, Spanish, French, and Portuguese. A Ministers Training Handbook is in development.</p>
      </div>
    </main>
  );
}
