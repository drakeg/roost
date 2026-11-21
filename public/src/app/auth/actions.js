"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { issueEmailVerification } from "@/lib/email-verification";
import {
  DUMMY_LOGIN_PASSWORD_HASH,
  isLoginLocked,
  nextLoginFailureState,
  successfulLoginState,
} from "@/lib/login-security";
import { logger } from "@/lib/logger";

function normalizeUsername(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function register(formData) {
  const username = normalizeUsername(formData.get("username"));
  const email = normalizeEmail(formData.get("email"));
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (username.length < 3 || password.length < 10 || !isValidEmail(email)) {
    redirect("/register?error=Enter%20a%20valid%20email%2C%20username%203%2B%20characters%2C%20and%20password%2010%2B");
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
    select: { username: true, email: true },
  });

  if (existing?.username === username) {
    redirect("/register?error=Username%20already%20exists");
  }

  if (existing?.email === email) {
    redirect("/register?error=Email%20already%20exists");
  }

  const user = await prisma.user.create({
    data: {
      username,
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      password: await hashPassword(password),
    },
  });

  await issueEmailVerification(user.id, user.email);
  await createSession(user.id);
  redirect("/account?verify=sent");
}

async function recordLoginFailure(userId, now) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const current = await tx.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              failedLoginAttempts: true,
              loginFailureWindowStartedAt: true,
              loginLockedUntil: true,
            },
          });

          if (!current || isLoginLocked(current, now)) {
            return { lockTriggered: false };
          }

          const next = nextLoginFailureState(current, now);
          await tx.user.update({
            where: { id: current.id },
            data: {
              failedLoginAttempts: next.failedLoginAttempts,
              loginFailureWindowStartedAt: next.loginFailureWindowStartedAt,
              loginLockedUntil: next.loginLockedUntil,
            },
          });

          return { lockTriggered: next.lockTriggered };
        },
        { isolationLevel: "Serializable" }
      );
    } catch (error) {
      if (error?.code !== "P2034" || attempt === 3) throw error;
    }
  }

  return { lockTriggered: false };
}

export async function login(formData) {
  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const now = new Date();

  const user = username
    ? await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          password: true,
          failedLoginAttempts: true,
          loginFailureWindowStartedAt: true,
          loginLockedUntil: true,
        },
      })
    : null;

  const passwordMatches = await verifyPassword(
    password,
    user?.password ?? DUMMY_LOGIN_PASSWORD_HASH
  );
  const locked = user ? isLoginLocked(user, now) : false;

  if (!user || locked || !passwordMatches) {
    if (user && !locked) {
      const failure = await recordLoginFailure(user.id, now);
      if (failure?.lockTriggered) {
        logger.warn("auth.login_temporarily_locked", { userId: user.id });
      }
    }

    redirect("/login?error=Invalid%20username%20or%20password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: successfulLoginState(now),
  });

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
