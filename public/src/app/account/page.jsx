import { getCurrentSession, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePassword, resendEmailVerification, revokeOtherSessions, revokeSession, updateProfile } from "./actions";

export const dynamic = "force-dynamic";

function describeSession(userAgent) {
  const value = userAgent ?? "";

  let browser = "Unknown browser";
  if (/Edg\//.test(value)) browser = "Microsoft Edge";
  else if (/Chrome\//.test(value) && !/Edg\//.test(value)) browser = "Chrome";
  else if (/Firefox\//.test(value)) browser = "Firefox";
  else if (/Safari\//.test(value) && !/Chrome\//.test(value)) browser = "Safari";

  let device = "Unknown device";
  if (/iPhone/i.test(value)) device = "iPhone";
  else if (/iPad/i.test(value)) device = "iPad";
  else if (/Android/i.test(value)) device = "Android";
  else if (/Macintosh|Mac OS X/i.test(value)) device = "Mac";
  else if (/Windows/i.test(value)) device = "Windows PC";
  else if (/Linux/i.test(value)) device = "Linux";

  return `${browser} on ${device}`;
}

function formatSessionDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default async function AccountPage({ searchParams }) {
  const user = await requireUser();
  const currentSession = await getCurrentSession();
  const params = await searchParams;

  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-semibold text-sky-700">Account</p>
      <h1 className="text-4xl font-bold tracking-tight">Profile & security</h1>
      <p className="mt-2 text-slate-500">@{user.username}</p>

      {params?.saved ? (
        <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          {params.saved === "profile"
            ? "Profile updated."
            : params.saved === "session"
              ? "Session revoked."
              : params.saved === "sessions"
                ? "Other sessions signed out."
                : params.saved === "email-verified"
                  ? "Email address verified."
                  : "Account updated."}
        </p>
      ) : null}

      {params?.verify ? (
        <p className="mt-5 rounded-xl bg-sky-50 p-3 text-sm text-sky-700">
          Verification email sent. Check your inbox for a link that expires in 24 hours.
        </p>
      ) : null}

      {params?.error ? (
        <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6">
        <form action={updateProfile} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div>
            <h2 className="text-xl font-bold">Profile</h2>
            <p className="mt-1 text-sm text-slate-500">Update the name shown around Roost.</p>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Email address</span>
            <input
              name="email"
              type="email"
              defaultValue={user.email ?? ""}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            {!user.email ? (
              <span className="mt-2 block text-xs text-amber-700">
                Add an email address to enable future account recovery.
              </span>
            ) : user.emailVerifiedAt ? (
              <span className="mt-2 block text-xs font-semibold text-emerald-700">
                Verified
              </span>
            ) : (
              <span className="mt-2 block text-xs font-semibold text-amber-700">
                Not verified — password recovery is disabled until this address is verified.
              </span>
            )}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold">First name</span>
              <input
                name="firstName"
                defaultValue={user.firstName ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">Last name</span>
              <input
                name="lastName"
                defaultValue={user.lastName ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
              Save profile
            </button>
            {user.email && !user.emailVerifiedAt ? (
              <button
                formAction={resendEmailVerification}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold"
              >
                Resend verification
              </button>
            ) : null}
          </div>
        </form>


        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Active sessions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review signed-in devices and revoke access you no longer recognize.
              </p>
            </div>
            {sessions.length > 1 ? (
              <form action={revokeOtherSessions}>
                <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                  Sign out everywhere else
                </button>
              </form>
            ) : null}
          </div>

          <div className="space-y-3">
            {sessions.map((session) => {
              const isCurrent = session.id === currentSession?.id;

              return (
                <article
                  key={session.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{describeSession(session.userAgent)}</p>
                      {isCurrent ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Current session
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Signed in {formatSessionDate(session.createdAt)} · Expires{" "}
                      {formatSessionDate(session.expiresAt)}
                    </p>
                  </div>

                  {!isCurrent ? (
                    <form action={revokeSession}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-red-300 hover:text-red-700">
                        Revoke
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>


        <form action={changePassword} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div>
            <h2 className="text-xl font-bold">Password</h2>
            <p className="mt-1 text-sm text-slate-500">
              Changing your password signs you out of existing sessions.
            </p>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Current password</span>
            <input
              name="currentPassword"
              type="password"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">New password</span>
            <input
              name="newPassword"
              type="password"
              minLength={10}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>
          <button className="rounded-xl border border-slate-300 px-5 py-3 font-semibold">
            Change password
          </button>
        </form>
      </div>
    </section>
  );
}
