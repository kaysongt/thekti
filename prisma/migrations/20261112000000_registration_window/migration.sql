CREATE TABLE "RegistrationWindow" (
    "id" INTEGER NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RegistrationWindow_pkey" PRIMARY KEY ("id")
);

INSERT INTO "RegistrationWindow" ("id", "closesAt")
VALUES (1, TIMESTAMP '2026-10-04 23:00:00');
