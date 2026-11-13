import nodemailer from "nodemailer";

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_FROM
  );
}

function createTransporter() {
  return nodemailer.createTransport({
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
}

async function sendTextEmail({ to, subject, text, developmentLog }) {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured.");
    }

    console.info(developmentLog);
    return;
  }

  await createTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  await sendTextEmail({
    to,
    subject: "Reset your Roost password",
    text: `A password reset was requested for your Roost account.

Use this link within 30 minutes:
${resetUrl}

If you did not request this, you can ignore this email.`,
    developmentLog: `[roost] Password reset for ${to}: ${resetUrl}`,
  });
}

export async function sendEmailVerification({ to, verificationUrl }) {
  await sendTextEmail({
    to,
    subject: "Verify your Roost email",
    text: `Verify your Roost email address using this link within 24 hours:

${verificationUrl}

If you did not create or update a Roost account, you can ignore this email.`,
    developmentLog: `[roost] Email verification for ${to}: ${verificationUrl}`,
  });
}

export async function sendReservationNotificationEmail({
  to,
  subject,
  message,
  reservationUrl,
}) {
  await sendTextEmail({
    to,
    subject,
    text: `${message}

View the reservation:
${reservationUrl}

This is a transactional notification from Roost.`,
    developmentLog: `[roost] Reservation notification for ${to}: ${subject} - ${reservationUrl}`,
  });
}
