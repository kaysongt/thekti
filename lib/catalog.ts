/**
 * The paid-program catalog in one shape: every Basic Certificate track and
 * every Specialized Academy with its exact name, one-time price, link, and
 * detail. Catalog pages, enrollment, checkout copy and My studies all read
 * from here, so a student sees the same name and price at every step.
 */
import {
  ACADEMY_HOURS,
  ACADEMY_OFFERS,
  BASIC_CERTIFICATES,
  BASIC_OFFERS,
  BASIC_PASS,
  academyCatalog,
  basicCatalog,
  ownsBasicPass,
} from "./programs";

export const BASIC_PRICE = 250;
export const ACADEMY_PRICE = 50;

/** What a buyer is told about timing. Classes for these programs have not opened yet. */
export const PAID_AVAILABILITY = "Classes coming soon";
export const PAID_AVAILABILITY_DETAIL = "Your place is held until they open, and then they appear in My studies.";

export function usd(amount: number) {
  return `US$${amount}`;
}

export type BasicTrack = {
  kind: "basic";
  slug: string;
  product: string;
  name: string;
  audience: string;
  ages?: string;
  description: string;
  hours: number;
  price: number;
  href: string;
  modules: { number: number; title: string; hours: number; sessions: { code: string; title: string }[] }[];
  sessionCount: number;
  requirements: string;
  assessment: string[];
  brochureUrl: string | null;
  catalogUrl: string | null;
  /** The Teenagers PDF predates the current tuition. */
  pdfFeeNote: string | null;
};

export type Academy = {
  kind: "academy";
  slug: string;
  product: string;
  name: string;
  subject: AcademySubject;
  hours: number;
  price: number;
  href: string;
  outline: string[];
  catalogUrl: string | null;
};

const drive = (id: string | undefined) => (id ? `https://drive.google.com/file/d/${id}/view` : null);

export const BASIC_TRACKS: readonly BasicTrack[] = BASIC_CERTIFICATES.map((track) => {
  const offer = BASIC_OFFERS.find((item) => item.product === "basic-" + track.slug)!;
  const detail = basicCatalog(track.slug);
  return {
    kind: "basic",
    slug: track.slug,
    product: offer.product,
    name: `Certificate in Biblical Studies for ${track.audience}`,
    audience: track.audience,
    ages: track.ages,
    description: track.description,
    hours: track.hours,
    price: offer.amount,
    href: `/programs/basic-certificates/${track.slug}`,
    modules: track.modules.map((module, index) => ({
      number: index + 1,
      title: module.title,
      hours: module.hours,
      sessions: (detail?.courses ?? []).filter((course) => course.module === index + 1).map(({ code, title }) => ({ code, title })),
    })),
    sessionCount: detail?.courses.length ?? 0,
    requirements: detail?.requirements ?? "",
    assessment: detail?.assessment ?? [],
    brochureUrl: drive(detail?.brochure),
    catalogUrl: drive(detail?.catalog),
    pdfFeeNote: track.slug === "teenagers" ? `Current tuition is ${usd(offer.amount)}. The catalog PDF lists an earlier fee.` : null,
  };
});

/** Subjects used to scan the academies. Every academy sits in exactly one. */
export const ACADEMY_SUBJECTS = [
  "Faith and spiritual life",
  "Family and relationships",
  "Ministry and leadership",
  "Bible, history and doctrine",
] as const;
export type AcademySubject = (typeof ACADEMY_SUBJECTS)[number];

const SUBJECT_OF: Record<string, AcademySubject> = {
  "Grace Academy": "Faith and spiritual life",
  "Faith Academy": "Faith and spiritual life",
  "Prayer Academy": "Faith and spiritual life",
  "Purpose Academy": "Faith and spiritual life",
  "Power & Authority Academy": "Faith and spiritual life",
  "Health & Healing Academy": "Faith and spiritual life",
  "School of the Spirit Academy": "Faith and spiritual life",
  "Signs & Wonders Academy": "Faith and spiritual life",
  "Pentecostal & Charismatic Revival Academy": "Faith and spiritual life",
  "Prosperity & Stewardship Academy": "Faith and spiritual life",
  "Dating & Relationship Academy": "Family and relationships",
  "Marriage Academy": "Family and relationships",
  "Parenting Academy": "Family and relationships",
  "Leadership Academy": "Ministry and leadership",
  "Church Administration Academy": "Ministry and leadership",
  "Mission & Evangelism Academy": "Ministry and leadership",
  "Helps Ministry Academy": "Ministry and leadership",
  "Media Ministry Academy": "Ministry and leadership",
  "Worship Ministry Academy": "Ministry and leadership",
  "Teen & Children Ministry Academy": "Ministry and leadership",
  "Youth Ministry Academy": "Ministry and leadership",
  "End-Time Events Academy": "Bible, history and doctrine",
  "Church History Academy": "Bible, history and doctrine",
  "Christian Apologetics Academy": "Bible, history and doctrine",
};

export const ACADEMIES_CATALOG: readonly Academy[] = ACADEMY_OFFERS.map((offer) => {
  const detail = academyCatalog(offer.title);
  const slug = offer.product.replace(/^academy-/, "");
  return {
    kind: "academy",
    slug,
    product: offer.product,
    name: offer.title,
    subject: SUBJECT_OF[offer.title] ?? "Faith and spiritual life",
    hours: ACADEMY_HOURS,
    price: offer.amount,
    href: `/programs/specialized-academies/${slug}`,
    outline: detail?.courses ?? [],
    catalogUrl: drive(detail?.catalog),
  };
});

export type PaidProgram = BasicTrack | Academy;

export function paidProgramByProduct(product: string): PaidProgram | undefined {
  return BASIC_TRACKS.find((t) => t.product === product) ?? ACADEMIES_CATALOG.find((a) => a.product === product);
}

export function basicTrackBySlug(slug: string) {
  return BASIC_TRACKS.find((track) => track.slug === slug);
}

export function academyBySlug(slug: string) {
  return ACADEMIES_CATALOG.find((academy) => academy.slug === slug);
}

/** The earlier one-payment pass for all six Basic Certificate tracks. */
export const SIX_TRACK_PASS = { product: BASIC_PASS.product, name: "Basic Certificates pass · all six tracks" } as const;

type EnrollmentLike = { product: string; status: string; accessSuspendedAt?: string | null };

export type PaidProgramState = "covered-by-pass" | "enrolled" | "payment-due" | "on-hold" | "none";

/** Where a signed-in student stands with one paid program. */
export function paidProgramState(program: PaidProgram, records: EnrollmentLike[]): PaidProgramState {
  if (program.kind === "basic" && ownsBasicPass(records)) return "covered-by-pass";
  const mine = records.filter((r) => r.product === program.product && (r.status === "active" || r.status === "pending"));
  if (mine.some((r) => r.status === "active" && r.accessSuspendedAt)) return "on-hold";
  if (mine.some((r) => r.status === "active")) return "enrolled";
  if (mine.some((r) => r.status === "pending")) return "payment-due";
  return "none";
}
