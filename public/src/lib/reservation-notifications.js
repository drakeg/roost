import { prisma } from "@/lib/prisma";
import { sendReservationNotificationEmail } from "@/lib/mail";

function appUrl() {
  const configured = String(process.env.APP_URL ?? "").trim().replace(/\/$/, "");

  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL is required in production.");
  }

  return "http://localhost:3000";
}

export async function notifyReservationUser({
  tripId,
  userId,
  subject,
  message,
}) {
  if (!tripId || !userId) return false;

  try {
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        emailVerifiedAt: true,
      },
    });

    if (!recipient?.email || !recipient.emailVerifiedAt) {
      return false;
    }

    const reservationUrl = `${appUrl()}/reservations/${encodeURIComponent(
      tripId
    )}/messages`;

    await sendReservationNotificationEmail({
      to: recipient.email,
      subject,
      message,
      reservationUrl,
    });

    return true;
  } catch (error) {
    console.error("[roost] Reservation notification delivery failed.", error);
    return false;
  }
}
