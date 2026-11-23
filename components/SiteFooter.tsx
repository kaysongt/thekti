import Image from "next/image";
import Link from "next/link";

import { getCurriculum } from "@/lib/curriculum";
import { PROGRAMS } from "@/lib/programs";

export default function SiteFooter() {
  const { program } = getCurriculum();
  const { phone, email, website } = program.contact;

  return (
    <footer className="sitefoot">
      <div className="inner">
        <div>
          <Link href="/" className="footer-brand" aria-label={`${program.institute} home`}>
            <Image src="/assets/kti-brand-2026.png" alt="" width={1536} height={1024} sizes="140px" />
          </Link>
          <p className="footer-motto">{program.motto}</p>
        </div>
        <nav aria-labelledby="footer-programs">
          <h2 id="footer-programs">Programs</h2>
          <ul>
            {PROGRAMS.map((item) => (
              <li key={item.key}><Link href={item.href}>{item.title}</Link></li>
            ))}
            <li><Link href="/scholarship">Scholarships</Link></li>
          </ul>
        </nav>
        <div>
          <h2 id="footer-contact">Contact</h2>
          <ul aria-labelledby="footer-contact">
            <li><a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></li>
            <li><a href={`mailto:${email}`}>{email}</a></li>
            <li><a href={`https://${website}`}>{website}</a></li>
            <li><Link href="/privacy">Privacy notice</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
