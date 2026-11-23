import Image from "next/image";
import Link from "next/link";

import Icon from "@/components/Icon";
import { AVAILABILITY_LABELS, PROGRAMS, type ProgramSummary } from "@/lib/programs";

const ACTIONS: Record<ProgramSummary["key"], string> = {
  believers: "Explore Believers Training",
  advanced: "Explore the Advanced Certificate",
  basic: "See the six certificate tracks",
  specialized: "See the sixteen academies",
};

export function ProgramStatus({ program }: { program: ProgramSummary }) {
  return <span className={`badge ${program.availability}`}>{AVAILABILITY_LABELS[program.availability]}</span>;
}

/** Each program answers who it serves, what students learn, and what comes next. */
export default function ProgramCatalog({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <ol className="program-rows">
      {PROGRAMS.map((program) => (
        <li className="program-row" key={program.key} id={`program-${program.key}`}>
          <Image
            className="program-row-photo"
            src={program.image}
            alt={program.imageAlt}
            width={834}
            height={469}
            sizes="(max-width: 760px) calc(100vw - 32px), 420px"
          />
          <div className="program-row-body">
            <div className="program-row-head">
              <Heading>{program.title}</Heading>
              <ProgramStatus program={program} />
            </div>
            <p className="program-row-meta"><strong>{program.hoursLabel}</strong> · {program.priceLabel}</p>
            <dl className="program-facts">
              <div><dt>Who it serves</dt><dd>{program.audience}</dd></div>
              <div><dt>What you will learn</dt><dd>{program.learn}</dd></div>
              <div><dt>What comes next</dt><dd>{program.next}</dd></div>
            </dl>
            <Link className={`btn ${program.availability === "coming-soon" ? "quiet" : "primary"}`} href={program.href}>
              {ACTIONS[program.key]} <Icon name="arrow-right" className="arrow" />
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}
