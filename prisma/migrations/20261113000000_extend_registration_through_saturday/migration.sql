-- Saturday, November 14 ends at midnight Pacific Standard Time.
UPDATE "RegistrationWindow"
SET "closesAt" = GREATEST("closesAt", TIMESTAMP '2026-11-15 08:00:00')
WHERE "id" = 1;
