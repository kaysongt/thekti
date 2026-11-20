import Image from "next/image";
import styles from "./ProgramImages.module.css";
import Link from "next/link";

const programs = [
  {
    href: "/programs/believers-training",
    title: "Believers Training",
    image: "/assets/programs/believers.webp",
    description: "Build a foundation for following Jesus through seven video modules. Study online or complete the training with your local church.",
    format: "Free · 7 essential classes · 21 program hours",
  },
  {
    href: "/programs/advanced-certificate",
    title: "Advanced Certificate",
    image: "/assets/programs/advanced.webp",
    description: "Study theology, biblical foundations, the Old and New Testaments, and spiritual formation in a structured certificate program.",
    format: "Paid · One-year program",
  },
  {
    href: "/programs#basic-certificates",
    title: "Basic Certificates",
    image: "/assets/programs/certificates.webp",
    description: "Explore short-term Biblical Studies certificates for believers, ministry leaders, and church volunteers.",
    format: "Coming soon · 40–50 program hours",
  },
  {
    href: "/programs#specialized-academies",
    title: "Specialized Academy",
    image: "/assets/programs/academies.webp",
    description: "Explore focused training in prayer, faith, leadership, relationships, and other areas of Christian life.",
    format: "Coming soon · 20 program hours",
  },
];

export default function ProgramCatalog() {
  return (
    <ul className="cards program-cards">
      {programs.map(({ href, title, description, format, image }) => (
        <li key={href}>
          <Link href={href} className={styles.card}>
            <Image src={image} alt="" width={834} height={469} sizes="(max-width: 640px) 100vw, 560px" />
            <div className={styles.cardBody}>
              <p className={styles.meta}>{format}</p>
              <h2>{title}</h2>
              <p>{description}</p>
              <span className={styles.action}>Explore →</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
