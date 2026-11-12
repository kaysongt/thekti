// The previous grace period ended at midnight in Nigeria (UTC+1).
const previousCutoff = new Date("2026-10-05T00:00:00+01:00");
const registrationWindowId = 1;
const oneDayMs = 24 * 60 * 60 * 1000;

export function isRegistrationOpen(now = new Date(), closesAt = previousCutoff): boolean {
  return now.getTime() < closesAt.getTime();
}

export function formatRegistrationDeadline(closesAt: Date): string {
  const time = new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "full",
    timeStyle: "short",
  }).format(closesAt);
  return `${time} WAT (Nigeria time)`;
}

export async function getRegistrationDeadline(): Promise<Date> {
  if (!process.env.DATABASE_URL) return previousCutoff;
  const { prisma } = await import("./db/prisma");
  const window = await prisma.registrationWindow.findUniqueOrThrow({
    where: { id: registrationWindowId },
  });
  return window.closesAt;
}

export async function openRegistrationForOneDay(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  const { prisma } = await import("./db/prisma");
  const now = new Date();
  const result = await prisma.registrationWindow.updateMany({
    where: { id: registrationWindowId, closesAt: { lte: now } },
    data: { closesAt: new Date(now.getTime() + oneDayMs) },
  });
  return result.count === 1;
}
