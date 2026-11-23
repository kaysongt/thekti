/**
 * One source for how KTI presents its programs: the homepage links, the
 * catalog cards, and each program page read from here so hours, availability,
 * and calls to action never drift apart.
 *
 * Hours are the verified catalog figures. Do not add dates, testimonials,
 * accreditation claims, or statistics that are not in the KTI catalogs.
 */

export type ProgramAvailability = "open" | "intake" | "coming-soon";

export type ProgramSummary = {
  key: "believers" | "advanced" | "basic" | "specialized";
  /** Plural label used by the homepage program links. */
  linkLabel: string;
  title: string;
  href: string;
  image: string;
  imageAlt: string;
  availability: ProgramAvailability;
  hoursLabel: string;
  priceLabel: string;
  /** Who it serves. */
  audience: string;
  /** What students will learn. */
  learn: string;
  /** What they can do next. */
  next: string;
};

export const AVAILABILITY_LABELS: Record<ProgramAvailability, string> = {
  open: "Open now",
  intake: "Enrolls by intake",
  "coming-soon": "Coming soon",
};

export const PROGRAMS: readonly ProgramSummary[] = [
  {
    key: "believers",
    linkLabel: "Believers Training",
    title: "Believers Training",
    href: "/programs/believers-training",
    image: "/assets/programs/believers.webp",
    imageAlt: "Two students reading the Bible together at a table",
    availability: "open",
    hoursLabel: "21 program hours",
    priceLabel: "Free",
    audience: "New and growing believers, and churches training their members.",
    learn: "Seven essential classes on the new covenant, identity in Christ, the Word, the Holy Spirit, prayer, purpose, and stewardship.",
    next: "Watch the classes online, then take the printable final assessment with your local church.",
  },
  {
    key: "advanced",
    linkLabel: "Advanced Certificates",
    title: "Advanced Certificate in Biblical Studies",
    href: "/programs/advanced-certificate",
    image: "/assets/programs/advanced.webp",
    imageAlt: "An instructor teaching from an open Bible to a class",
    availability: "intake",
    hoursLabel: "172 program hours",
    priceLabel: "$250 per certificate · $1,000 full program",
    audience: "Pastors, ministry leaders, Bible teachers, church workers, small group leaders, missionaries, and new believers.",
    learn: "Five certificates: Systematic Theology, Biblical Foundations, Old Testament Survey, New Testament Survey, and Spiritual Formation.",
    next: "Study one certificate at a time, pass each topic quiz and course assessment at 80%, and complete all five for the Advanced Certificate.",
  },
  {
    key: "basic",
    linkLabel: "Basic Certificates",
    title: "Basic Certificates",
    href: "/programs#basic-certificates",
    image: "/assets/programs/certificates.webp",
    imageAlt: "A small group discussing Scripture together",
    availability: "coming-soon",
    hoursLabel: "40–50 program hours",
    priceLabel: "Coming soon",
    audience: "Teenagers, ministry leaders, small group leaders, marketplace believers, and Christian creatives.",
    learn: "Six short Biblical Studies tracks, each shaped for the people it serves.",
    next: "Read each track’s module list now. Enrollment opens when the tracks launch.",
  },
  {
    key: "specialized",
    linkLabel: "Specialized Academy",
    title: "Specialized Academy",
    href: "/programs#specialized-academies",
    image: "/assets/programs/academies.webp",
    imageAlt: "An open Bible and notebook on a desk",
    availability: "coming-soon",
    hoursLabel: "20 program hours",
    priceLabel: "Coming soon",
    audience: "Believers who want focused training in one area of Christian life.",
    learn: "Sixteen academies, from prayer and faith to marriage, leadership, and church administration.",
    next: "Browse the academies now. Each opens for enrollment when it launches.",
  },
];

export function getProgram(key: ProgramSummary["key"]): ProgramSummary {
  return PROGRAMS.find((program) => program.key === key)!;
}

export type BasicCertificate = {
  slug: string;
  audience: string;
  ages?: string;
  description: string;
  hours: number;
  modules: { title: string; hours: number }[];
};

/** The six Basic Certificate catalogs. Teenagers: 40 program hours; the other five: 50. */
export const BASIC_CERTIFICATES: readonly BasicCertificate[] = [
  {
    slug: "teenagers",
    audience: "Teenagers",
    ages: "Ages 13–18",
    description: "Explore what you believe in 20 sessions through conversations about school, friendships and life online. Put your faith into practice with a team project and a 30-day growth plan.",
    hours: 40,
    modules: [
      { title: "What We Believe", hours: 8 },
      { title: "How to Read the Bible", hours: 6 },
      { title: "The Old Testament Story", hours: 6 },
      { title: "Jesus & the New Testament", hours: 8 },
      { title: "Living Our Faith", hours: 12 },
    ],
  },
  {
    slug: "ministry-leaders",
    audience: "Pastors, Teachers & Ministry Leaders",
    description: "Practice moving from a Bible passage to a lesson or sermon, and explore the responsibilities of leading a ministry.",
    hours: 50,
    modules: [
      { title: "Essential Theology for Ministry Leaders", hours: 8 },
      { title: "Biblical Interpretation & Teaching Preparation", hours: 10 },
      { title: "Teaching from the Old Testament", hours: 6 },
      { title: "Teaching from the New Testament", hours: 8 },
      { title: "Ministry Essentials", hours: 10 },
      { title: "Spiritual Formation & Responsible Leadership", hours: 8 },
    ],
  },
  {
    slug: "fivefold",
    audience: "Apostles, Prophets & Evangelists",
    description: "Study how Scripture describes these three ministries and how discernment and accountability guide their practice.",
    hours: 50,
    modules: [
      { title: "Essential Theology for Fivefold Ministry", hours: 8 },
      { title: "Biblical Interpretation & Discernment", hours: 10 },
      { title: "Fivefold Foundations in the Old Testament", hours: 6 },
      { title: "The Offices & Their Gifts in the New Testament", hours: 8 },
      { title: "Apostolic, Prophetic & Evangelistic Ministry Essentials", hours: 10 },
      { title: "Spiritual Formation & Responsible Leadership", hours: 8 },
    ],
  },
  {
    slug: "small-group-leaders",
    audience: "Small Group & Church Volunteer Leaders",
    description: "Learn to prepare a Bible study, guide a group discussion and lead volunteers through service.",
    hours: 50,
    modules: [
      { title: "Essential Theology", hours: 8 },
      { title: "Interpretation & Study Preparation", hours: 10 },
      { title: "Teaching the Old Testament", hours: 6 },
      { title: "Teaching the New Testament", hours: 8 },
      { title: "Small Group & Ministry Essentials", hours: 10 },
      { title: "Spiritual Formation & Servant Leadership", hours: 8 },
    ],
  },
  {
    slug: "marketplace",
    audience: "Believers in the Marketplace",
    description: "Explore how biblical wisdom shapes decisions at work, relationships with colleagues and leadership.",
    hours: 50,
    modules: [
      { title: "Essential Theology for Every Believer", hours: 8 },
      { title: "Biblical Interpretation & Personal Study", hours: 10 },
      { title: "Wisdom for Work from the Old Testament", hours: 6 },
      { title: "Faith & Life from the New Testament", hours: 8 },
      { title: "Faith at Work Essentials", hours: 10 },
      { title: "Spiritual Formation & Marketplace Leadership", hours: 8 },
    ],
  },
  {
    slug: "creatives",
    audience: "Christian Creatives",
    description: "Study beauty and storytelling in Scripture and consider how your creative work can express faith and serve others.",
    hours: 50,
    modules: [
      { title: "Essential Theology for Every Believer", hours: 8 },
      { title: "Biblical Interpretation & Personal Study", hours: 10 },
      { title: "Beauty & Story in the Old Testament", hours: 6 },
      { title: "Story & Witness in the New Testament", hours: 8 },
      { title: "Creative Ministry Essentials", hours: 10 },
      { title: "Spiritual Formation & Creative Leadership", hours: 8 },
    ],
  },
];

export const ACADEMIES: readonly string[] = [
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

export const ACADEMY_HOURS = 20;

export const BELIEVERS_CLASSES = [
  { title: "The New Covenant", videoId: "0IWX-fwHmu0" },
  { title: "Identity in Christ", videoId: "rebnFvX6r_8" },
  { title: "The Word: The Agent of Change", videoId: "4CzCbnx0eEU" },
  { title: "The Ministry of the Holy Spirit", videoId: "2EEpawrfzMM" },
  { title: "Spiritual Authority and Prayer", videoId: "-zxEVgYMbeU" },
  { title: "Purpose and Calling", videoId: "zRPiNwnmVbs" },
  { title: "Stewardship and Missional Lifestyle", videoId: "RLbRya09Mn8" },
] as const;
