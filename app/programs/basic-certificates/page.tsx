import Link from "next/link";

import Icon from "@/components/Icon";
import { BASIC_TRACKS, PAID_AVAILABILITY, usd } from "@/lib/catalog";

export const metadata = {
  title: "Basic Certificates",
  description: "Six Basic Certificate tracks in Biblical Studies. Each track is US$250, one-time, for that track.",
};

export default function BasicCertificatesPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <header className="band page-band">
        <div className="wrap">
          <Link className="crumb" href="/programs">All programs</Link>
          <h1>Basic Certificates</h1>
          <p className="deck">Six short certificates in Biblical Studies, each written for a different group. Choose the one track that fits you. Each track is {usd(250)}, one-time. {PAID_AVAILABILITY}.</p>
        </div>
      </header>
      <div className="wrap section">
        <ul className="choice-list">
          {BASIC_TRACKS.map((track) => (
            <li key={track.slug}>
              <Link className="choice" href={track.href}>
                <span className="choice-main">
                  <span className="choice-kicker">For {track.audience}{track.ages ? ` · ${track.ages}` : ""}</span>
                  <span className="choice-name">{track.name}</span>
                  <span className="choice-desc">{track.description}</span>
                </span>
                <span className="choice-side">
                  <strong className="choice-price">{usd(track.price)}</strong>
                  <span>{track.hours} program hours</span>
                  <span className="choice-go">View track <Icon name="arrow-right" /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="hint">Bought the earlier six-track Basic Certificates pass? It still covers every track. Your tracks are listed in <Link href="/dashboard">My studies</Link>.</p>
      </div>
    </main>
  );
}
