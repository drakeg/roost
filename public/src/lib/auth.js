import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { excessSessionIdsForNewSession } from "@/lib/session-security";
import { SECURITY_EVENT_TYPES } from "@/lib/security-events";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "roost_session";
const SESSION_DAYS = 30;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const derived = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(hash, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000
  );

  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 500) || null;

  await prisma.session.deleteMany({
    where: { expiresAt: { lte: now } },
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await prisma.$transaction(
        async (tx) => {
          const activeSessions = await tx.session.findMany({
            where: {
              userId,
              expiresAt: { gt: now },
            },
            select: {
              id: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          });

          const excessSessionIds =
            excessSessionIdsForNewSession(activeSessions);

          if (excessSessionIds.length) {
            await tx.session.deleteMany({
              where: {
                userId,
                id: { in: excessSessionIds },
              },
            });

            await tx.securityEvent.create({
              data: {
                userId,
                type: SECURITY_EVENT_TYPES.SESSION_LIMIT_EVICTION,
                details: { count: excessSessionIds.length },
              },
            });
          }

          await tx.session.create({
            data: {
              tokenHash: hashToken(token),
              userId,
              expiresAt,
              userAgent,
            },
          });
        },
        { isolationLevel: "Serializable" }
      );
      break;
    } catch (error) {
      if (error?.code !== "P2034" || attempt === 3) throw error;
    }
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  store.delete(SESSION_COOKIE);
}

export async function getCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) return null;

  const { password, ...user } = session.user;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}


export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
