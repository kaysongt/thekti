import Link from "next/link";

const programs = [
  {
    href: "/programs/believers-training",
    title: "Believers Training",
    description: "Build a foundation for following Jesus through seven video modules. Study online or complete the training with your local church.",
    format: "Free · 7 essential classes · 21 credit hours",
  },
  {
    href: "/programs/advanced-certificate",
    title: "Advanced Certificate in Biblical Studies",
    description: "Study theology, biblical foundations, the Old and New Testaments, and spiritual formation in a structured certificate program.",
    format: "Paid · One-year program",
  },
];

export default function ProgramCatalog() {
  return (
    <ul className="cards program-cards">
      {programs.map(({ href, title, description, format }) => (
        <li key={href}>
          <Link href={href} className="card">
            <p className="eyebrow">{format}</p>
            <h2 className="t">{title}</h2>
            <p>{description}</p>
            <span className="foot">View program →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
