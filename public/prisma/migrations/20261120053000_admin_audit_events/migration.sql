CREATE TABLE "AdminAuditEvent" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditEvent_createdAt_idx"
ON "AdminAuditEvent"("createdAt");

CREATE INDEX "AdminAuditEvent_actorId_createdAt_idx"
ON "AdminAuditEvent"("actorId", "createdAt");

CREATE INDEX "AdminAuditEvent_targetType_targetId_createdAt_idx"
ON "AdminAuditEvent"("targetType", "targetId", "createdAt");

ALTER TABLE "AdminAuditEvent"
ADD CONSTRAINT "AdminAuditEvent_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
