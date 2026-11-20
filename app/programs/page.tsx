import Image from "next/image";
import styles from "@/components/ProgramImages.module.css";
import ProgramCatalog from "@/components/ProgramCatalog";

export const metadata = { title: "Programs" };

const basicCertificates = [
  {
    "audience": "Teenagers",
    "description": "For ages 13–18. Explore what you believe in 20 sessions through conversations about school, friendships and life online. Put your faith into practice with a team project and a 30-day growth plan.",
    "hours": 40,
    "modules": [
      "What We Believe · 8 hours",
      "How to Read the Bible · 6 hours",
      "The Old Testament Story · 6 hours",
      "Jesus & the New Testament · 8 hours",
      "Living Our Faith · 12 hours"
    ]
  },
  {
    "audience": "Pastors, Teachers & Ministry Leaders",
    "description": "Practice moving from a Bible passage to a lesson or sermon, and explore the responsibilities of leading a ministry.",
    "hours": 50,
    "modules": [
      "Essential Theology for Ministry Leaders · 8 hours",
      "Biblical Interpretation & Teaching Preparation · 10 hours",
      "Teaching from the Old Testament · 6 hours",
      "Teaching from the New Testament · 8 hours",
      "Ministry Essentials · 10 hours",
      "Spiritual Formation & Responsible Leadership · 8 hours"
    ]
  },
  {
    "audience": "Apostles, Prophets & Evangelists",
    "description": "Study how Scripture describes these three ministries and how discernment and accountability guide their practice.",
    "hours": 50,
    "modules": [
      "Essential Theology for Fivefold Ministry · 8 hours",
      "Biblical Interpretation & Discernment · 10 hours",
      "Fivefold Foundations in the Old Testament · 6 hours",
      "The Offices & Their Gifts in the New Testament · 8 hours",
      "Apostolic, Prophetic & Evangelistic Ministry Essentials · 10 hours",
      "Spiritual Formation & Responsible Leadership · 8 hours"
    ]
  },
  {
    "audience": "Small Group & Church Volunteer Leaders",
    "description": "Learn to prepare a Bible study, guide a group discussion and lead volunteers through service.",
    "hours": 50,
    "modules": [
      "Essential Theology · 8 hours",
      "Interpretation & Study Preparation · 10 hours",
      "Teaching the Old Testament · 6 hours",
      "Teaching the New Testament · 8 hours",
      "Small Group & Ministry Essentials · 10 hours",
      "Spiritual Formation & Servant Leadership · 8 hours"
    ]
  },
  {
    "audience": "Believers in the Marketplace",
    "description": "Explore how biblical wisdom shapes decisions at work, relationships with colleagues and leadership.",
    "hours": 50,
    "modules": [
      "Essential Theology for Every Believer · 8 hours",
      "Biblical Interpretation & Personal Study · 10 hours",
      "Wisdom for Work from the Old Testament · 6 hours",
      "Faith & Life from the New Testament · 8 hours",
      "Faith at Work Essentials · 10 hours",
      "Spiritual Formation & Marketplace Leadership · 8 hours"
    ]
  },
  {
    "audience": "Christian Creatives",
    "description": "Study beauty and storytelling in Scripture and consider how your creative work can express faith and serve others.",
    "hours": 50,
    "modules": [
      "Essential Theology for Every Believer · 8 hours",
      "Biblical Interpretation & Personal Study · 10 hours",
      "Beauty & Story in the Old Testament · 6 hours",
      "Story & Witness in the New Testament · 8 hours",
      "Creative Ministry Essentials · 10 hours",
      "Spiritual Formation & Creative Leadership · 8 hours"
    ]
  }
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
            <p>Coming soon. Explore the six tracks below and open a module list to see what you’ll study.</p>
          </div>
          <Image src="/assets/programs/certificates.webp" alt="" width={834} height={469} sizes="(max-width: 700px) 100vw, 540px" />
        </header>
        <ul className="cards program-cards">
          {basicCertificates.map(({ audience, description, hours, modules }) => (
            <li className="card" key={audience}>
              <h3 className="t">Certificate in Biblical Studies for {audience}</h3>
              <p>{hours} program hours · {modules.length} modules</p>
              <p>{description}</p>
              <details>
                <summary>View modules for {audience}</summary>
                <ol>{modules.map((module) => <li key={module}>{module}</li>)}</ol>
              </details>
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
