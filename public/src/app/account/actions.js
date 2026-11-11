"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { destroySession, getCurrentSession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { issueEmailVerification } from "@/lib/email-verification";

export async function updateProfile(formData) {
  const user = await requireUser();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/account?error=Enter%20a%20valid%20email%20address");
  }

  if (email) {
    const duplicate = await prisma.user.findFirst({
      where: {
        email,
        id: { not: user.id },
      },
      select: { id: true },
    });

    if (duplicate) {
      redirect("/account?error=Email%20address%20is%20already%20in%20use");
    }
  }

  const emailChanged = (user.email ?? "") !== email;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: email || null,
      emailVerifiedAt: emailChanged ? null : user.emailVerifiedAt,
      firstName: firstName || null,
      lastName: lastName || null,
    },
  });

  if (emailChanged && email) {
    await issueEmailVerification(user.id, email);
  }

  revalidatePath("/account");
  revalidatePath("/");

  if (emailChanged && email) {
    redirect("/account?verify=sent");
  }

  redirect("/account?saved=profile");
}

export async function changePassword(formData) {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 10) {
    redirect("/account?error=New%20password%20must%20be%20at%20least%2010%20characters");
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  if (!record || !(await verifyPassword(currentPassword, record.password))) {
    redirect("/account?error=Current%20password%20is%20incorrect");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(newPassword) },
  });

  await prisma.session.deleteMany({
    where: { userId: user.id },
  });
  await destroySession();

  redirect("/login");
}


export async function revokeSession(formData) {
  const user = await requireUser();
  const current = await getCurrentSession();
  const sessionId = String(formData.get("sessionId") ?? "");

  if (!sessionId) {
    redirect("/account?error=Session%20not%20found");
  }

  if (current?.id === sessionId) {
    await destroySession();
    redirect("/login");
  }

  await prisma.session.deleteMany({
    where: {
      id: sessionId,
      userId: user.id,
    },
  });

  revalidatePath("/account");
  redirect("/account?saved=session");
}

export async function revokeOtherSessions() {
  const user = await requireUser();
  const current = await getCurrentSession();

  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      ...(current ? { id: { not: current.id } } : {}),
    },
  });

  revalidatePath("/account");
  redirect("/account?saved=sessions");
}


export async function resendEmailVerification() {
  const user = await requireUser();

  if (!user.email) {
    redirect("/account?error=Add%20an%20email%20address%20first");
  }

  if (user.emailVerifiedAt) {
    redirect("/account?saved=email-verified");
  }

  await issueEmailVerification(user.id, user.email);
  redirect("/account?verify=sent");
}
