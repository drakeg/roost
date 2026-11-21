import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_AUDIT_ACTIONS,
  auditActionLabel,
  auditDetailsSummary,
  auditTargetLabel,
  normalizeAuditFilter,
} from "@/lib/admin-audit";

export const dynamic = "force-dynamic";

const ACTION_FILTERS = ["ALL", ...Object.values(ADMIN_AUDIT_ACTIONS)];
const TARGET_FILTERS = ["ALL", "USER", "LISTING"];

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(value);
}

export default async function AdminAuditPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const action = normalizeAuditFilter(params?.action, ACTION_FILTERS);
  const targetType = normalizeAuditFilter(params?.targetType, TARGET_FILTERS);

  const events = await prisma.adminAuditEvent.findMany({
    where: {
      ...(action === "ALL" ? {} : { action }),
      ...(targetType === "ALL" ? {} : { targetType }),
    },
    include: {
      actor: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <Link href="/admin" className="text-sm font-semibold text-sky-700">
        ← Back to admin
      </Link>

      <div className="mt-6">
        <p className="text-sm font-semibold text-sky-700">Administration</p>
        <h1 className="text-4xl font-bold tracking-tight">Moderation audit history</h1>
        <p className="mt-2 max-w-3xl text-slate-500">
          Append-only history of admin role and listing-feature changes. Audit records are created in the same database transaction as the moderated change.
        </p>
      </div>

      <form className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto]">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Action
          </span>
          <select
            name="action"
            defaultValue={action}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            <option value="ALL">All actions</option>
            {Object.values(ADMIN_AUDIT_ACTIONS).map((value) => (
              <option key={value} value={value}>
                {auditActionLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Target
          </span>
          <select
            name="targetType"
            defaultValue={targetType}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            <option value="ALL">All targets</option>
            <option value="USER">Users</option>
            <option value="LISTING">Listings</option>
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white">
            Apply
          </button>
          <Link
            href="/admin/audit"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {["When", "Admin", "Action", "Target", "Target ID", "Details"].map((label) => (
                  <th key={label} className="px-4 py-3 font-semibold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {events.map((event) => {
                const actorName =
                  [event.actor?.firstName, event.actor?.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                  (event.actor?.username ? `@${event.actor.username}` : "Deleted admin");

                return (
                  <tr key={event.id}>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(event.createdAt)}</td>
                    <td className="px-4 py-3">{actorName}</td>
                    <td className="px-4 py-3 font-semibold">{auditActionLabel(event.action)}</td>
                    <td className="px-4 py-3">{auditTargetLabel(event.targetType)}</td>
                    <td className="max-w-48 truncate px-4 py-3 font-mono text-xs">{event.targetId}</td>
                    <td className="min-w-72 px-4 py-3 text-slate-600">
                      {auditDetailsSummary(event.details) || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!events.length ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No audit events match the selected filters.
          </p>
        ) : null}

        {events.length === 200 ? (
          <p className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Showing the newest 200 matching events.
          </p>
        ) : null}
      </div>
    </section>
  );
}
