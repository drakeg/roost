ALTER TABLE "User"
ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "loginFailureWindowStartedAt" TIMESTAMP(3),
ADD COLUMN "loginLockedUntil" TIMESTAMP(3),
ADD COLUMN "lastLoginAt" TIMESTAMP(3);
