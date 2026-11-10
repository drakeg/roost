import Link from "next/link";
import { resetPassword } from "@/app/password-reset-actions";

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;
  const token = String(params?.token ?? "");

  if (!token) {
    return (
      <section className="mx-auto max-w-md px-6 py-14">
        <h1 className="text-4xl font-bold">Reset link required</h1>
        <p className="mt-4 text-slate-500">
          This password reset link is missing its token.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block font-semibold text-sky-700"
        >
          Request a new reset link
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-4xl font-bold">Choose a new password</h1>
      <p className="mt-3 text-slate-500">
        Reset links expire after 30 minutes and can only be used once.
      </p>

      {params?.error ? (
        <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      <form
        action={resetPassword}
        className="mt-8 space-y-5 rounded-3xl bg-white p-7 shadow-sm"
      >
        <input type="hidden" name="token" value={token} />
        <input
          name="password"
          type="password"
          required
          minLength={10}
          placeholder="New password (10+ characters)"
          className="w-full rounded-xl border px-4 py-3"
        />
        <button className="w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
          Reset password
        </button>
      </form>
    </section>
  );
}
