import { z } from "zod";
import { getCurriculum } from "./curriculum";

export const ADMIN_INITIAL_PASSWORD = "password123";
export const adminAccountSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(254),
  country: z.string().trim().min(2).max(100),
});
export const adminModuleSlugsSchema = z.array(z.string()).max(5).refine(
  (slugs) => slugs.every((slug) => getCurriculum().modules.some((m) => m.slug === slug)),
  "Choose valid modules.",
).transform((slugs) => [...new Set(slugs)]);
