import nodemailer from "nodemailer";

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_FROM
  );
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured.");
    }

    console.info(`[roost] Password reset for ${to}: ${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT, 10),
    secure: String(process.env.SMTP_SECURE ?? "").toLowerCase() === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Reset your Roost password",
    text: `A password reset was requested for your Roost account.

Use this link within 30 minutes:
${resetUrl}

If you did not request this, you can ignore this email.`,
  });
}
