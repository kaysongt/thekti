import { programOffer } from "./programs";
import type { Enrollment } from "./db/types";

export const BELIEVERS = "believers-training";

export function belongsToBelievers(enrollments: Enrollment[]) {
  return enrollments.some((e) => e.product === BELIEVERS && e.status === "active" && !e.accessSuspendedAt);
}

export function currentAdvancedEnrollments(enrollments: Enrollment[]) {
  return enrollments.filter((e) => e.product !== BELIEVERS && !programOffer(e.product) && (e.status === "active" || e.status === "pending"));
}
