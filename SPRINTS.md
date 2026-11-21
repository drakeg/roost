# Sprint plan

Roost uses one-week delivery sprints, but execution continues across Sprint boundaries whenever ready work remains.

## Current Sprint — 2026-W47: Operational readiness and SMB host pilot

**Goal:** turn the completed reservation and host-management foundation into a testable product that a small independent host could realistically evaluate.

### Completed this Sprint

- [x] Saved searches / search preferences — PR #53
- [x] Repository standards adoption and badge validation — PR #54
- [x] Admin reservation reporting and initial Node test suite — PR #55
- [x] Structured/redacted application logging security fix — PR #56
- [x] Moderation audit history — PR #58
- [x] Docker/local artifact hygiene — PR #59
- [x] Pinned container Yarn/OpenSSL tooling — PR #60
- [x] Reservation lifecycle/access test coverage — PR #61
- [x] Saved-search rules/scoping test coverage — PR #62
- [x] Corrected container Yarn pinning — PR #63
- [x] Database-backed application/container health monitoring — PR #64
- [x] SMB pilot runbook and smoke tooling — PR #65

### In progress

- [ ] Expand automated coverage across critical reservation/admin workflows
  - reservation lifecycle/access rules complete
  - saved-search normalization/scoping complete
  - listing photo URL/storage security and cleanup coverage complete
- [x] Validate the built Docker image end-to-end in CI
  - PostgreSQL 17 service
  - full Prisma migration deployment
  - production container startup
  - database-backed health wait
  - pilot smoke command

### Completed deployment validation

- [x] Refresh the LAN-accessible Docker test environment after merged migrations/features
- [x] Run the full pilot smoke test against the refreshed LAN deployment
  - database-backed health passed
  - home/search/login/register smoke checks passed at `http://192.168.0.155:8031`

### Ready next

- [ ] Expand automated coverage for listing uploads and remaining host/admin workflows
- [ ] Begin host multi-listing workflow polish for small operators

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
