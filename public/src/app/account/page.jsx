import { requireUser } from "@/lib/auth";
import { changePassword, updateProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }) {
  const user = await requireUser();
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-semibold text-sky-700">Account</p>
      <h1 className="text-4xl font-bold tracking-tight">Profile & security</h1>
      <p className="mt-2 text-slate-500">@{user.username}</p>

      {params?.saved ? (
        <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          Profile updated.
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
            ) : null}
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
          <button className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
            Save profile
          </button>
        </form>

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
