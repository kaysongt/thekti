import Image from "next/image";
import styles from "./ProgramImages.module.css";
import Link from "next/link";

const programs = [
  {
    href: "/programs/believers-training",
    title: "Believers Training",
    image: "/assets/programs/believers.webp",
    description: "Build a foundation for following Jesus through seven video modules. Study online or complete the training with your local church.",
    format: "Free · 7 essential classes · 21 credit hours",
  },
  {
    href: "/programs/advanced-certificate",
    title: "Advanced Certificate in Biblical Studies",
    image: "/assets/programs/advanced.webp",
    description: "Study theology, biblical foundations, the Old and New Testaments, and spiritual formation in a structured certificate program.",
    format: "Paid · One-year program",
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
              <span className={styles.action}>View program →</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
