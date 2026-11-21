"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_AUDIT_ACTIONS, sanitizeAuditDetails } from "@/lib/admin-audit";

export async function setListingFeatured(formData) {
  const admin = await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "");
  const featured = String(formData.get("featured") ?? "") === "true";

  if (!listingId) return;

  await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id: listingId },
      select: { id: true, featured: true, title: true },
    });

    if (!listing || listing.featured === featured) return;

    await tx.listing.update({
      where: { id: listingId },
      data: { featured },
    });

    await tx.adminAuditEvent.create({
      data: {
        actorId: admin.id,
        action: ADMIN_AUDIT_ACTIONS.LISTING_FEATURED_CHANGED,
        targetType: "LISTING",
        targetId: listing.id,
        details: sanitizeAuditDetails({
          title: listing.title,
          fromFeatured: listing.featured,
          toFeatured: featured,
        }),
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
}

export async function setUserRole(formData) {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || !["USER", "ADMIN"].includes(role) || userId === admin.id) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, username: true },
    });

    if (!target || target.role === role) return;

    await tx.user.update({
      where: { id: userId },
      data: { role },
    });

    await tx.adminAuditEvent.create({
      data: {
        actorId: admin.id,
        action: ADMIN_AUDIT_ACTIONS.USER_ROLE_CHANGED,
        targetType: "USER",
        targetId: target.id,
        details: sanitizeAuditDetails({
          username: target.username,
          fromRole: target.role,
          toRole: role,
        }),
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/audit");
}
