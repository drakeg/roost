"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

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

  await createSession(user.id);
  redirect("/");
}

export async function login(formData) {
  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !(await verifyPassword(password, user.password))) {
    redirect("/login?error=Invalid%20username%20or%20password");
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
