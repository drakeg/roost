# Product Backlog

This backlog is ordered by current product value, dependency readiness, security impact, and fit with Roost's existing architecture.

Priority is expected to change during refinement. Items should be delivered as small vertical slices and moved into a sprint only when they meet the Definition of Ready in [AGILE.md](AGILE.md).

## P0 — Immediate

### Reservation lifecycle visibility

**Status:** In review in PR #45.

Provide an append-only timeline of reservation state transitions so guests and hosts can understand how a booking changed over time.

Acceptance outcomes:

- pending, confirmed, declined, and cancelled transitions are recorded;
- actor and timestamps are preserved;
- unauthorized/no-op actions create no false history;
- the timeline is visible in the reservation conversation/detail context;
- older reservations without events degrade gracefully.

## P1 — Next

### Reservation email notifications

Send transactional email notifications for meaningful reservation events while respecting verified account email and avoiding notification spam.

Initial slice:

- reservation request submitted;
- reservation confirmed or declined;
- reservation cancelled;
- new reservation message notification;
- links return the user to the relevant Roost reservation conversation.

Guardrails:

- only verified destination emails;
- no secrets or sensitive session data in links;
- notification failure must not roll back the underlying reservation action;
- development behavior remains usable when SMTP is not configured;
- duplicate events should not generate duplicate sends.

### Reservation status filters

Allow guests and hosts to filter reservation lists by lifecycle status.

Acceptance outcomes:

- All, Pending, Confirmed, Declined, and Cancelled views;
- filtering is server-authoritative;
- empty states are useful;
- counts and unread-message indicators remain correct;
- filters remain usable with existing reservation history.

### Consolidated reservation detail

Evolve the conversation page into the canonical reservation detail surface.

Include:

- listing and dates;
- party size;
- pricing snapshot;
- current status;
- status timeline;
- guest/host identity context appropriate to the viewer;
- reservation-scoped messaging;
- permitted lifecycle actions.

Avoid duplicating business rules already enforced in server actions.

## P2 — Product depth

### Host calendar overview

Provide a calendar-oriented view combining:

- confirmed/pending reservations;
- blackout ranges;
- availability boundaries.

The first slice should be read-only. Editing can continue through existing focused controls until calendar interaction is proven useful.

### Listing photo upload

Replace URL-only listing photo entry with first-party upload/storage integration while preserving existing URL-backed records during migration.

Requirements should include file type/size validation, authorization, deletion lifecycle, and production storage configuration.

### Review quality improvements

Add review sorting/pagination and host responses without weakening the verified-stay rule.

### Saved search / search preferences

Allow authenticated users to preserve useful search criteria without introducing broad notification behavior in the first slice.

## P3 — Operations and trust

### Admin reservation reporting

Add operational reporting for reservation volume, lifecycle state, cancellations, and booking value snapshots.

Prefer derived reporting over denormalizing transactional truth unless performance proves it necessary.

### Moderation audit history

Record important admin moderation actions with actor, target, action, timestamp, and optional reason.

### Account security hardening

Evaluate:

- optional TOTP MFA;
- recovery-code handling;
- rate-limit improvements around auth/recovery endpoints;
- security event visibility.

Implement only with tests and careful recovery design.

## P4 — Commercial readiness

### Payments discovery and architecture

Do not add payments as an ad-hoc form feature.

Before implementation, define:

- payment provider abstraction;
- authorization/capture timing relative to host approval;
- cancellation/refund semantics;
- taxes/fees;
- webhook verification and idempotency;
- payout model;
- dispute handling;
- PCI scope boundaries.

The first implementation slice should follow an agreed transaction-state model.

### Host economics

After payment architecture is established, add host revenue/payout reporting from immutable transaction records rather than inferred listing prices.

## Technical backlog

### Test coverage expansion

Prioritize automated coverage around:

- reservation concurrency;
- lifecycle authorization;
- messaging visibility/read state;
- email-token flows;
- listing availability and blackout interaction;
- admin authorization boundaries.

### Observability

Add structured application logging and production error reporting with careful redaction of credentials, tokens, and sensitive user data.

### Dependency and security maintenance

Keep Node.js 24, Next.js, Prisma, PostgreSQL, container images, and CI dependencies current within supported secure releases. Resolve security findings through focused PRs rather than bundling unrelated upgrades.

## Backlog refinement rules

During refinement:

- split items that cannot be reviewed confidently in one PR;
- move defects/security regressions ahead of feature work when risk warrants it;
- do not begin a dependency-blocked item merely because it is high priority;
- attach newly discovered work to this backlog instead of silently expanding an active PR;
- remove items that no longer support the product direction.
