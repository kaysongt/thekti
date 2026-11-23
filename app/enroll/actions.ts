"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { BASIC_PASS, BASIC_OFFERS, ownsBasicPass, programOffer } from "@/lib/programs";
import { paidProgramCheckoutReady } from "@/lib/payments/stripe-client";
import { BELIEVERS } from "@/lib/program-membership";
import type { NewEnrollmentForStudent } from "@/lib/db/types";
import { currentStudent, hashPassword, startSession } from "@/lib/auth";
import { getPurchasableModules } from "@/lib/content";
import { PRICING } from "@/lib/curriculum";
import { db } from "@/lib/db";
import { StorageUnavailableError } from "@/lib/db/types";
import { getRegistrationDeadline, isRegistrationOpen } from "@/lib/registration";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254),
  country: z.string().trim().min(1, "Please select your country.").max(80),
  password: z.string().min(10, "Use at least 10 characters.").max(200),
  plan: z.enum(["certificate", "advanced"]),
  product: z.string().trim().max(80),
  privacyAccepted: z
    .string()
    .refine((value) => value === "yes", "Please confirm that you have read the privacy notice."),
  scholarshipIntent: z.union([z.literal(""), z.literal("apply")]),
});

export async function registerStudent(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const free = formData.get("program") === BELIEVERS;
  const offer = programOffer(formData.get("program"));
  if (offer?.product === BASIC_PASS.product) return { error: "Choose an individual Basic Certificate from the program catalog." };
  if (offer && !paidProgramCheckoutReady(offer.product)) return { error: "Payment enrollment is coming soon." };
  const session = await currentStudent();
  if (!free && !offer) {
    const deadline = await getRegistrationDeadline();
    if (!isRegistrationOpen(new Date(), deadline)) {
      return { error: "Registration is closed. Existing students can still sign in. For help, email kti@kingsword.org." };
    }
  }
  const scholarshipIntentEntry = formData.get("scholarshipIntent");
  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    country: String(formData.get("country") ?? ""),
    password: String(formData.get("password") ?? ""),
    plan: String(formData.get("plan") ?? "advanced"),
    product: String(formData.get("product") ?? ""),
    privacyAccepted: String(formData.get("privacyAccepted") ?? ""),
    scholarshipIntent:
      typeof scholarshipIntentEntry === "string" ? scholarshipIntentEntry.trim() : "",
    website: String(formData.get("website") ?? ""),
  };
  const values = {
    fullName: raw.fullName.trim(),
    email: raw.email.trim(),
    country: raw.country.trim(),
    plan: raw.plan,
    product: raw.product.trim(),
    privacyAccepted: raw.privacyAccepted,
    scholarshipIntent: raw.scholarshipIntent,
  };
  if (raw.website.trim()) {
    return { error: "We could not create your enrollment. Please try again." };
  }
  const schema = session ? registrationSchema.omit({ fullName: true, email: true, password: true, country: true }) : registrationSchema;
  const parsed = schema.safeParse(raw);
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { fieldErrors, values };
  }

  const { plan, product, scholarshipIntent } = parsed.data;
  const purchasableProducts = new Set(getPurchasableModules().map((module) => module.slug));
  if (!free && !offer && plan === "certificate" && !purchasableProducts.has(product)) {
    return {
      fieldErrors: { product: "Please choose a certificate from the published program." },
      values,
    };
  }

  let studentId: string;
  try {
    const price = plan === "advanced" ? PRICING.advanced : PRICING.certificate;
    const enrollment: NewEnrollmentForStudent = {
      product: offer?.product ?? (free ? BELIEVERS : plan === "advanced" ? "advanced" : product),
      plan: free || offer ? "certificate" : plan,
      status: free ? "active" : "pending", amount: offer?.amount ?? (free ? 0 : price.amount), currency: price.currency,
      provider: null, providerRef: null,
    };
    if (session) {
      studentId = session.id;
      const records = await db.getEnrollmentsForStudent(studentId);
      if (offer && BASIC_OFFERS.some((item) => item.product === offer.product) && ownsBasicPass(records)) {
        return { error: "Your existing Basic Certificates pass already covers this track. Open My studies." };
      }
      const existing = records.find((e) => (e.product === enrollment.product || (!free && !offer && e.product === "advanced")) && (e.status === "active" || e.status === "pending"));
      if (!existing) await db.joinProgram({ ...enrollment, studentId });
      else if (existing.accessSuspendedAt) return { error: "Please contact KTI about your suspended access." };
    } else {
      const account = registrationSchema.parse(raw);
      if (await db.getStudentByEmail(account.email)) {
        return { fieldErrors: { email: "An account with this email already exists." }, values };
      }
      const { student } = await db.createStudentWithEnrollment({
        fullName: account.fullName, country: account.country, email: account.email,
        passwordHash: await hashPassword(account.password),
      }, enrollment);
      studentId = student.id;
    }
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return {
        error: "Enrollment storage is unavailable. Please email kti@kingsword.org for help.",
        values,
      };
    }
    return { error: "We could not create your enrollment. Please try again.", values };
  }

  if (!session) await startSession(studentId);
  if (offer) redirect("/dashboard?program=" + offer.product);
  if (free) redirect("/dashboard?program=believers");
  redirect(scholarshipIntent === "apply" ? "/scholarship" : "/dashboard");
}
