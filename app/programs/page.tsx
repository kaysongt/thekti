import Link from "next/link";

import Icon from "@/components/Icon";
import ProgramCatalog from "@/components/ProgramCatalog";
import { ACADEMIES, ACADEMY_HOURS, BASIC_CERTIFICATES, PROGRAMS } from "@/lib/programs";

export const metadata = {
  title: "Programs",
  description: "Compare KTI programs: free Believers Training, the Advanced Certificate in Biblical Studies, six Basic Certificate tracks, and the Specialized Academies.",
};

export default function ProgramsPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <header className="band page-band">
        <div className="wrap">
          <h1>Programs</h1>
          <p className="deck">Bible study and ministry training at KingsWord Training Institute. Compare who each program serves, what it covers, and how to begin.</p>
          <nav className="jump-links" aria-label="Jump to a program">
            {PROGRAMS.map((program) => (
              <a key={program.key} href={program.key === "basic" ? "#basic-certificates" : program.key === "specialized" ? "#specialized-academies" : `#program-${program.key}`}>
                {program.linkLabel}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="wrap section">
        <ProgramCatalog headingLevel={2} />
        <p className="hint catalog-languages">Planned program languages: English, Spanish, French, and Portuguese.</p>

        <section className="catalog-section" aria-labelledby="basic-certificates">
          <div className="section-head">
            <div>
              <h2 id="basic-certificates">Basic Certificate tracks</h2>
              <p>Six short Biblical Studies certificates, each written for the people it serves. All six are coming soon; open a track to see its modules.</p>
            </div>
            <span className="badge soon">Coming soon</span>
          </div>
          <ul className="k-grid track-grid">
            {BASIC_CERTIFICATES.map((track) => (
              <li key={track.slug}>
                <article className="k-card track-card" aria-labelledby={`track-${track.slug}`}>
                  <div className="k-card-body">
                    <h3 id={`track-${track.slug}`}>Certificate in Biblical Studies for {track.audience}</h3>
                    <p className="track-meta">
                      <strong>{track.hours} program hours</strong> · {track.modules.length} modules{track.ages ? ` · ${track.ages}` : ""}
                    </p>
                    <p>{track.description}</p>
                    <details className="module-disclosure">
                      <summary>
                        <span>Modules in this track</span>
                        <Icon name="chevron-right" className="disclosure-icon" />
                      </summary>
                      <ol>
                        {track.modules.map((module) => (
                          <li key={module.title}>
                            <span>{module.title}</span>
                            <span className="num">{module.hours} program hours</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section className="catalog-section" aria-labelledby="specialized-academies">
          <div className="section-head">
            <div>
              <h2 id="specialized-academies">Specialized Academies</h2>
              <p>Focused training on one subject. Each academy covers {ACADEMY_HOURS} program hours and opens for enrollment when it launches.</p>
            </div>
            <span className="badge soon">Coming soon</span>
          </div>
          <ul className="academy-list">
            {ACADEMIES.map((academy) => (
              <li key={academy}>
                <span>{academy}</span>
                <span className="num">{ACADEMY_HOURS} program hours</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="catalog-section handbook" aria-labelledby="ministers-handbook">
          <h2 id="ministers-handbook">Ministers Training Handbook</h2>
          <p>In development as a practical resource for ministers and church leaders.</p>
          <p>
            Ready to start now? <Link href="/programs/believers-training">Believers Training is free and open</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
