import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileStore } from "../lib/db/file-store";
import { ADMIN_INITIAL_PASSWORD, adminAccountSchema, adminModuleSlugsSchema } from "../lib/admin-accounts";
import { hashPassword, verifyPassword } from "../lib/auth-core";
import { hasActiveAccess } from "../lib/access";
import { getCurriculum } from "../lib/curriculum";

const dir = await mkdtemp(path.join(os.tmpdir(), "kti-admin-check-"));
Object.assign(process.env, { NODE_ENV: "test", KTI_TEST_STORE_PATH: path.join(dir, "store.json") });
try {
  const [first, second, third] = getCurriculum().modules;
  assert(!adminModuleSlugsSchema.safeParse(["advanced"]).success);
  assert(!adminAccountSchema.safeParse({ fullName: "A", email: "bad", country: "" }).success);
  const student = await fileStore.saveAdminModuleAccess({
    account: { student: { fullName: "Test Student", email: " STUDENT@example.test ", country: "US", passwordHash: await hashPassword(ADMIN_INITIAL_PASSWORD) } },
    moduleSlugs: [first.slug, third.slug, third.slug], actorId: "test-admin",
  });
  assert.equal(student.role, "student");
  assert.equal(student.email, "student@example.test");
  assert(await verifyPassword("password123", student.passwordHash));
  let enrollments = await fileStore.getEnrollmentsForStudent(student.id);
  assert.equal(enrollments.length, 2);
  assert(hasActiveAccess(enrollments, first.slug));
  assert(hasActiveAccess(enrollments, third.slug));
  assert(!hasActiveAccess(enrollments, second.slug));
  assert(enrollments.every((e) => e.amount === 0 && e.provider === "admin-grant"));
  const paid = await fileStore.createEnrollment({ studentId: student.id, product: second.slug, plan: "certificate", status: "pending", amount: 100, currency: "USD", provider: null, providerRef: null });
  await fileStore.activateEnrollment(paid.id, "test-receipt", "manual");
  await fileStore.saveAdminModuleAccess({ account: { studentId: student.id }, moduleSlugs: [], actorId: "test-admin" });
  enrollments = await fileStore.getEnrollmentsForStudent(student.id);
  assert(!hasActiveAccess(enrollments, first.slug));
  assert(hasActiveAccess(enrollments, second.slug));
  assert(!hasActiveAccess(enrollments, third.slug));
  await fileStore.saveAdminModuleAccess({ account: { studentId: student.id }, moduleSlugs: [third.slug], actorId: "test-admin" });
  enrollments = await fileStore.getEnrollmentsForStudent(student.id);
  assert.equal(enrollments.length, 3, "regrant reuses the original grant");
  assert(hasActiveAccess(enrollments, third.slug));
  await assert.rejects(fileStore.saveAdminModuleAccess({ account: { student: { ...student } }, moduleSlugs: [first.slug], actorId: "test-admin" }));
  assert.equal((await fileStore.listStudents()).length, 1);
  console.log("Admin account checks passed: password, validation, selected modules, revoke/regrant, duplicate email, paid enrollment preservation.");
} finally {
  await rm(dir, { recursive: true, force: true });
}
