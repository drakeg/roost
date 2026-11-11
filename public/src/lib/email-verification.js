import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmailVerification } from "@/lib/mail";

const VERIFY_HOURS = 24;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function appUrl() {
  const configured = String(process.env.APP_URL ?? "").trim().replace(/\/$/, "");

  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL is required in production.");
  }

  return "http://localhost:3000";
}

export async function issueEmailVerification(userId, email) {
  const recent = await prisma.emailVerificationToken.findFirst({
    where: {
      userId,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
    select: { id: true },
  });

  if (recent) return false;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFY_HOURS * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: {
        tokenHash: hashToken(token),
        email,
        userId,
        expiresAt,
      },
    }),
  ]);

  const verificationUrl = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  try {
    await sendEmailVerification({ to: email, verificationUrl });
    return true;
  } catch (error) {
    await prisma.emailVerificationToken.deleteMany({ where: { userId } });
    console.error("[roost] Email verification delivery failed.", error);
    return false;
  }
}

export async function consumeEmailVerification(token) {
  const tokenHash = hashToken(String(token ?? ""));
  const record = token
    ? await prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          email: true,
          expiresAt: true,
          user: { select: { email: true } },
        },
      })
    : null;

  if (
    !record ||
    record.expiresAt <= new Date() ||
    record.user.email !== record.email
  ) {
    if (record) {
      await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    }
    return false;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: record.userId },
    }),
  ]);

  return true;
}
