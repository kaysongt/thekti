import Image from "next/image";
import styles from "@/components/ProgramImages.module.css";
import ProgramCatalog from "@/components/ProgramCatalog";

export const metadata = { title: "Programs" };

const basicCertificateAudiences = [
  "Teenagers",
  "Pastors, Teachers & Church Leaders",
  "Apostles, Prophets & Evangelists",
  "Small Group & Church Volunteer Leaders",
  "Believers in the Marketplace",
  "Christian Creatives",
];

const academies = [
  "Grace Academy",
  "Faith Academy",
  "Prayer Academy",
  "Purpose Academy",
  "Power & Authority Academy",
  "Health & Healing Academy",
  "Dating & Relationship Academy",
  "Leadership Academy",
  "School of the Spirit Academy",
  "End-Time Events Academy",
  "Marriage Academy",
  "Parenting Academy",
  "Mission & Evangelism Academy",
  "Prosperity & Stewardship Academy",
  "Signs & Wonders Academy",
  "Church Administration Academy",
];

export default function ProgramsPage() {
  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <header className="pagehead">
        <h1>Programs</h1>
        <p className="deck">Explore Bible study and ministry training at KingsWord Training Institute.</p>
        <p>Planned program languages: English, Spanish, French, and Portuguese.</p>
      </header>
      <ProgramCatalog />

      <section aria-labelledby="basic-certificates">
        <header className={styles.feature}>
          <div>
            <h2 id="basic-certificates">Basic Certificate Programs</h2>
            <p>Coming soon. Each short-term certificate covers 50 program hours.</p>
          </div>
          <Image src="/assets/programs/certificates.webp" alt="" width={834} height={469} sizes="(max-width: 700px) 100vw, 540px" />
        </header>
        <ul className="cards program-cards">
          {basicCertificateAudiences.map((audience) => (
            <li className="card" key={audience}>
              <h3 className="t">Certificate in Biblical Studies for {audience}</h3>
              <p>Coming soon</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="specialized-academies">
        <header className={styles.feature}>
          <div>
            <h2 id="specialized-academies">Specialized Academy Programs</h2>
            <p>Coming soon. Each academy covers 20 program hours and focuses on one subject.</p>
          </div>
          <Image src="/assets/programs/academies.webp" alt="" width={834} height={469} sizes="(max-width: 700px) 100vw, 540px" />
        </header>
        <ul className="cards program-cards">
          {academies.map((academy) => (
            <li className="card" key={academy}>
              <h3 className="t">{academy}</h3>
              <p>Coming soon</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ministers-handbook">
        <h2 id="ministers-handbook">Ministers Training Handbook</h2>
        <p>In development as a practical resource for ministers and church leaders.</p>
      </section>
    </main>
  );
}
