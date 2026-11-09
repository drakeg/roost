import Link from "next/link";
import { register } from "@/app/auth/actions";

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  return (
    <section className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-4xl font-bold">Create account</h1>
      {params?.error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error}</p> : null}
      <form action={register} className="mt-8 space-y-5 rounded-3xl bg-white p-7 shadow-sm">
        <input name="username" required minLength={3} placeholder="Username" className="w-full rounded-xl border px-4 py-3" />
        <input name="email" type="email" required placeholder="Email address" className="w-full rounded-xl border px-4 py-3" />
        <div className="grid grid-cols-2 gap-3">
          <input name="firstName" placeholder="First name" className="w-full rounded-xl border px-4 py-3" />
          <input name="lastName" placeholder="Last name" className="w-full rounded-xl border px-4 py-3" />
        </div>
        <input name="password" type="password" required minLength={10} placeholder="Password (10+ characters)" className="w-full rounded-xl border px-4 py-3" />
        <button className="w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">Create account</button>
      </form>
      <p className="mt-5 text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-sky-700">Sign in</Link></p>
    </section>
  );
}
