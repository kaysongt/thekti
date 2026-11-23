import "server-only";
import { notFound, redirect } from "next/navigation";
import modules from "@/content/believers-training/modules.json";
import { currentStudent } from "./auth";
import { db } from "./db";
import { belongsToBelievers } from "./program-membership";

export const believersPath = "/programs/believers-training";
export const believersModules = modules;

export async function getStudyModule(slug: string, lessonSlug?: string) {
  const module = modules.find((entry) => entry.slug === slug);
  if (!module) notFound();
  const student = await currentStudent();
  const path = [believersPath, slug, lessonSlug].filter(Boolean).join("/");
  if (!student) redirect("/login?next=" + encodeURIComponent(path));
  if (!belongsToBelievers(await db.getEnrollmentsForStudent(student.id))) {
    redirect("/enroll?program=believers-training");
  }
  return module;
}
