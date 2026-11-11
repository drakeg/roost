"use server";

import { redirect } from "next/navigation";
import { consumeEmailVerification } from "@/lib/email-verification";

export async function verifyEmailToken(formData) {
  const token = String(formData.get("token") ?? "");
  const verified = await consumeEmailVerification(token);

  if (!verified) {
    redirect("/account?error=Verification%20link%20is%20invalid%20or%20expired");
  }

  redirect("/account?saved=email-verified");
}
