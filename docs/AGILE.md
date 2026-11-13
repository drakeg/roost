# Agile Delivery Model

Roost uses small, reviewable increments with a continuously prioritized product backlog.

## Cadence

- **Sprint length:** one week
- **Sprint planning:** select a small set of highest-value, dependency-ready backlog items
- **Daily execution:** keep work-in-progress low; finish and validate one slice before starting another
- **Review:** every change is delivered through a pull request with CI passing
- **Retrospective:** at the end of each sprint, capture what shipped, what slipped, and any process or technical improvements
- **Backlog refinement:** reorder upcoming work when product needs, defects, security findings, or dependencies change

## Workflow

1. **Backlog** — prioritized but not yet committed.
2. **Ready** — sufficiently understood, dependency-ready, and small enough for a sprint.
3. **In progress** — implementation has started.
4. **Review** — pull request is open; CI and review feedback are being resolved.
5. **Done** — merged to the default branch with required validation complete.

Avoid carrying multiple large features in progress at the same time. Prefer thin vertical slices that leave the product usable after every merge.

## Definition of Ready

A backlog item is ready when:

- user or operator value is clear;
- acceptance criteria are testable;
- security and authorization implications are understood;
- required schema or migration work is identified;
- dependencies are available;
- the item can reasonably be delivered as one focused pull request, or is intentionally split into sequenced slices.

## Definition of Done

An item is done when:

- implementation is merged to `master`;
- CI passes;
- relevant automated tests are added or updated;
- server-side validation and authorization are enforced where applicable;
- database changes include a Prisma migration and backward-compatibility considerations;
- user-visible behavior is documented when it changes setup or operation;
- no known critical regression is introduced;
- follow-up work discovered during delivery is added to the backlog rather than silently expanding scope.

## Engineering principles

- Keep Roost a single active Next.js application backed by PostgreSQL and Prisma.
- Do not reintroduce the retired NestJS/Amplication server or separate React Admin application.
- Prefer server components, server actions, and route handlers when they simplify trusted data access.
- Treat authorization checks as server-side responsibilities.
- Preserve reservation and account history instead of destructively deleting lifecycle records.
- Prefer secure defaults, explicit validation, and least privilege.
- Keep Node.js 24, lockfiles, Docker Compose, and CI aligned.
- Add tests alongside migrated or newly introduced behavior.
- Keep pull requests focused enough to review confidently.

## Current sprint

### Sprint goal

Strengthen reservation communication and lifecycle transparency without adding payment complexity.

### In review

- Reservation status history — PR #45

### Next ready items

1. Reservation notification preferences and event-driven email notifications.
2. Reservation list filtering by lifecycle status for guests and hosts.
3. Host-facing reservation detail improvements that consolidate guest, pricing, messaging, and status-history context.
4. Reservation data export/admin operational reporting.

The product backlog in [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md) is the source of truth for priority beyond the current sprint.

## Retrospective checklist

At sprint close, record:

- shipped pull requests;
- unfinished items and why they moved;
- CI, testing, or deployment pain discovered;
- defects or security findings;
- backlog priority changes;
- one or two concrete process improvements for the next sprint.
