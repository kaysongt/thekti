import Image from "next/image";
import Link from "next/link";

import Icon from "@/components/Icon";
import ProgramCatalog from "@/components/ProgramCatalog";
import { getCurriculum } from "@/lib/curriculum";
import { AVAILABILITY_LABELS, PROGRAMS } from "@/lib/programs";

export default function HomePage() {
  const { program } = getCurriculum();
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="band home-hero-v2" aria-labelledby="home-title">
        <div className="wrap home-hero-grid">
          <div>
          <h1 id="home-title">Raising a supernatural army</h1>
          <p className="home-lede">
            KingsWord Training Institute trains believers to know God’s Word, walk in the Spirit,
            and communicate the Gospel with confidence.
          </p>
          <nav className="program-links" aria-label="KTI programs">
            {PROGRAMS.map((item) => (
              <Link className="program-link" href={item.href} key={item.key}>
                <span className="program-link-title">{item.linkLabel}</span>
                <span className="program-link-meta">
                  {item.availability === "open" ? item.priceLabel : AVAILABILITY_LABELS[item.availability]}
                  {" · "}{item.hoursLabel}
                </span>
                <Icon name="chevron-right" className="program-link-go" />
              </Link>
            ))}
          </nav>
          <p className="home-return">
            Already a student? <Link href="/login?next=/dashboard">Sign in to continue studying</Link>
          </p>
          </div>
          <Image
            className="home-seal"
            src="/assets/kti-brand-2026.png"
            alt="KingsWord Training Institute seal: Advanced Certificate in Biblical Studies"
            width={1536}
            height={1024}
            sizes="440px"
          />
        </div>
      </section>

      <section className="section" aria-labelledby="programs-heading">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2 id="programs-heading">Find the right program</h2>
              <p>Each program lists who it serves, what you will study, and the step that follows. Believers Training is free and open now.</p>
            </div>
            <Link className="text-link" href="/programs">Full program catalog <Icon name="arrow-right" /></Link>
          </div>
          <ProgramCatalog />
        </div>
      </section>

      <section className="band band-deep section founder-band" aria-labelledby="founder-heading">
        <div className="wrap founder-layout">
          <Image
            className="founder-photo"
            src="/assets/faculty/dr-kay-ijisesan-green.jpg"
            alt={`${program.founder.name}, ${program.founder.role} of ${program.institute}`}
            width={783}
            height={1280}
            sizes="(max-width: 760px) 60vw, 340px"
          />
          <div>
            <h2 id="founder-heading">Meet {program.founder.name}</h2>
            <p className="founder-role">{program.founder.role}</p>
            <p>{program.founder.bio}</p>
            <blockquote className="founder-motto">{program.motto}</blockquote>
            <Link className="btn ghost" href="/programs/advanced-certificate#faculty">Meet the faculty <Icon name="arrow-right" className="arrow" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
