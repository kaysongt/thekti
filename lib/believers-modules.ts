import "server-only";
import { notFound, redirect } from "next/navigation";
import modules from "@/content/believers-training/modules.json";
import { currentStudent } from "./auth";
import { db } from "./db";
import { belongsToBelievers } from "./program-membership";

export const believersPath = "/programs/believers-training";
export const believersModules = modules;

export async function getStudyAccess(slug: string, lessonSlug?: string) {
  const module = modules.find((entry) => entry.slug === slug);
  if (!module) notFound();
  const student = await currentStudent();
  const path = [believersPath, slug, lessonSlug].filter(Boolean).join("/");
  if (!student) redirect("/login?next=" + encodeURIComponent(path));
  if (!belongsToBelievers(await db.getEnrollmentsForStudent(student.id))) {
    redirect("/enroll?program=believers-training");
  }
  const results = await db.getBelieversResults(student.id);
  const scores = new Map(results.map((row) => [row.lessonId, row.correct]));
  const prerequisite = modules.find((entry) => entry.number < module.number && !scores.has(entry.slug));
  if (prerequisite) redirect(believersPath + "/" + prerequisite.slug + "/assessment");
  return { module, student, score: scores.get(module.slug) };
}

export async function getStudyModule(slug: string, lessonSlug?: string) {
  return (await getStudyAccess(slug, lessonSlug)).module;
}
