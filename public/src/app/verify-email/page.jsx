import Link from "next/link";
import { verifyEmailToken } from "./actions";

export default async function VerifyEmailPage({ searchParams }) {
  const params = await searchParams;
  const token = String(params?.token ?? "");

  if (!token) {
    return (
      <section className="mx-auto max-w-md px-6 py-14">
        <h1 className="text-4xl font-bold">Verification link required</h1>
        <p className="mt-4 text-slate-500">
          This email verification link is missing its token.
        </p>
        <Link href="/account" className="mt-6 inline-block font-semibold text-sky-700">
          Open account settings
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-4xl font-bold">Verify your email</h1>
      <p className="mt-3 text-slate-500">
        Confirm this email address for password recovery and account security.
      </p>

      <form action={verifyEmailToken} className="mt-8 rounded-3xl bg-white p-7 shadow-sm">
        <input type="hidden" name="token" value={token} />
        <button className="w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
          Verify email address
        </button>
      </form>
    </section>
  );
}
