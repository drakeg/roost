"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { destroySession, hashPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mail";

const RESET_MINUTES = 30;

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

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

export async function requestPasswordReset(formData) {
  const email = normalizeEmail(formData.get("email"));

  const user = email
    ? await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, emailVerifiedAt: true },
      })
    : null;

  if (user?.email && user.emailVerifiedAt) {
    const recent = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
      select: { id: true },
    });

    if (recent) {
      redirect("/forgot-password?sent=1");
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000);

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: {
          tokenHash: hashToken(token),
          userId: user.id,
          expiresAt,
        },
      }),
    ]);

    const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      });
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      console.error("[roost] Password reset delivery failed.", error);
    }
  }

  redirect("/forgot-password?sent=1");
}

export async function resetPassword(formData) {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("password") ?? "");

  if (newPassword.length < 10) {
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&error=Password%20must%20be%20at%20least%2010%20characters`
    );
  }

  const tokenHash = hashToken(token);
  const record = token
    ? await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
        },
      })
    : null;

  if (!record || record.expiresAt <= new Date()) {
    if (record) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } });
    }
    redirect("/forgot-password?error=Reset%20link%20is%20invalid%20or%20expired");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: await hashPassword(newPassword) },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId },
    }),
    prisma.session.deleteMany({
      where: { userId: record.userId },
    }),
  ]);

  await destroySession();
  redirect("/login?reset=success");
}
