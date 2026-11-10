import Link from "next/link";
import { requestPasswordReset } from "@/app/password-reset-actions";

export default async function ForgotPasswordPage({ searchParams }) {
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-4xl font-bold">Reset your password</h1>
      <p className="mt-3 text-slate-500">
        Enter the email address on your Roost account.
      </p>

      {params?.sent ? (
        <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          If an account exists for that email, a reset link has been sent.
        </p>
      ) : null}

      {params?.error ? (
        <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      <form
        action={requestPasswordReset}
        className="mt-8 space-y-5 rounded-3xl bg-white p-7 shadow-sm"
      >
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          className="w-full rounded-xl border px-4 py-3"
        />
        <button className="w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
          Send reset link
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-sky-700">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
