import { currentStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { belongsToBelievers } from "@/lib/program-membership";
import { z } from "zod";

const churchDetails = z.object({
  church: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(200),
});

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student) return new Response("Sign in to download the assessment.", { status: 401, headers: noStore });
  if (!belongsToBelievers(await db.getEnrollmentsForStudent(student.id))) return new Response("Join Believers Training to download the assessment.", { status: 403, headers: noStore });
  const form = await request.formData().catch(() => null);
  const details = churchDetails.safeParse({
    church: form?.get("church"),
    location: form?.get("location"),
  });
  if (!details.success) {
    return new Response("Enter your church name and location before downloading.", { status: 400, headers: noStore });
  }

  // Use the current published exam and its existing download audit, without
  // exposing the service URL or forwarding student cookies or credentials.
  const upstream = await fetch(
    "https://seven-module-lms-beta.vercel.app/final-assessment/print/download",
    {
      method: "POST",
      body: new URLSearchParams(details.data),
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  ).catch(() => null);

  if (upstream?.status === 404) {
    return new Response("The printable assessment is not available yet.", { status: 404, headers: noStore });
  }
  if (!upstream?.ok || !upstream.headers.get("Content-Type")?.startsWith("text/html")) {
    return new Response("The assessment could not be downloaded. Please try again.", { status: 502, headers: noStore });
  }

  return new Response(upstream.body, {
    headers: {
      ...noStore,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'attachment; filename="BBT-Final-Assessment.html"',
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
