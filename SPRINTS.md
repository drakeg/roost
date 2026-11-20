# Sprint plan

Roost uses one-week delivery sprints, but execution continues across Sprint boundaries whenever ready work remains.

## Current Sprint — 2026-W47: Operational readiness and SMB host pilot

**Goal:** turn the completed reservation and host-management foundation into a testable product that a small independent host could realistically evaluate.

### In review

- [ ] Saved searches / search preferences — PR #53
- [ ] Repository standards adoption, badge validation, and governance synchronization

### Ready next

- [ ] Admin reservation reporting: reservation volume, status mix, cancellations, booking-value snapshots
- [ ] Automated coverage for reservation authorization, saved searches, and critical host workflows
- [ ] Structured application logging with credential/token redaction
- [ ] Refresh the LAN-accessible Docker test environment after merged migrations/features

### Acceptance

- Required repository-governance files exist and pass automated validation.
- Current README badges are evidence-based and dynamic where status can change.
- CI remains green and Docker Compose remains usable for local/LAN testing.
- A host can manage listings, availability, reservations, messages, reviews, and calendar state without relying on retired applications.
- The next operator-facing reporting slice is ready for demonstration.

## Next Sprint — 2026-W48: Operations and trust

**Goal:** give hosts/admins operational visibility and improve confidence in daily use.

Planned scope:

- admin reservation reporting and export-friendly views;
- moderation audit history;
- critical-path automated tests;
- dependency/security maintenance;
- observability and failure diagnostics.

## Planned Sprint — 2026-W49: Commercial pilot readiness

**Goal:** prepare a narrow pilot for independent hosts/property managers.

Planned scope:

- pilot onboarding/runbook;
- usability fixes discovered through end-to-end testing;
- host workflow polish for multi-listing operators;
- deployment packaging/documentation;
- pricing hypothesis and prospect interview checklist;
- explicit go/no-go criteria for payment architecture.

## Completed delivery milestones

Recent completed work includes reservation lifecycle history, notification emails, status filters, consolidated reservation detail, host calendar, first-party photo uploads, and review sorting/pagination/host responses.

## Sprint close checklist

At each Sprint close:

- record merged PRs and validation results;
- move unfinished work with a reason;
- capture CI/deployment/testing pain;
- update backlog priority;
- record release impact;
- immediately continue the next ready task when safe.
