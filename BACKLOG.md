# Prioritized backlog

This is Roost's root backlog and source of truth for delivery priority. Detailed historical product notes remain in `docs/PRODUCT_BACKLOG.md`.

| Priority | Item | Customer / operator value | Status |
| --- | --- | --- | --- |
| P0 | Saved searches / search preferences | Lets guests reuse high-intent searches without rebuilding filters | Completed — PR #53 |
| P0 | Repository standards adoption | Keeps development, documentation, badges, release policy, and validation consistent | Completed — PR #54 |
| P1 | Admin reservation reporting | Gives small operators visibility into volume, status, cancellations, and booking value | Completed — PR #55 |
| P1 | Critical-path automated tests | Reduces regression risk in reservation, auth, search, upload, and host workflows | In progress — reservation lifecycle + saved-search coverage |
| P1 | Structured observability | Speeds diagnosis while protecting credentials/tokens | Initial secure logging merged — PR #56 |
| P1 | Moderation audit history | Improves accountability for admin actions | Completed — PR #58 |
| P1 | SMB host pilot package | Creates the shortest path to real demand/willingness-to-pay feedback | In progress — runbook/smoke merged #65; live-image CI validation |
| P1 | Select an explicit open-source license | Clarifies reuse/contribution rights and enables an accurate license badge | Blocked — maintainer decision |
| P2 | Account security hardening | Adds optional MFA/recovery/rate-limit/security-event improvements | Backlog |
| P2 | Host multi-listing workflow polish | Reduces repetitive work for small property managers | Backlog |
| P3 | Payments discovery and state model | Defines safe authorization/capture/refund/webhook behavior before implementation | Backlog |
| P3 | Host economics / payout reporting | Adds revenue reporting only after payment records become authoritative | Blocked by payments |

## Commercialization backlog

**Target customer hypothesis:** independent vacation-rental hosts and property managers with approximately 1–20 properties.

**Pain hypothesis:** reservation coordination, availability management, guest communication, and operational reporting are fragmented across tools or handled manually.

**Value hypothesis:** a simpler direct-booking/host-operations workflow can save coordination time and reduce reservation mistakes without requiring an enterprise PMS.

**Pricing hypothesis to validate:** begin customer interviews around a low monthly SaaS price or managed-hosting fee. No price is considered validated until prospects demonstrate willingness to pay.

**Fastest path to first customer:**

1. Finish admin/operator reporting and critical-path tests.
2. Run the Docker/LAN demo through end-to-end host and guest workflows.
3. Create a short pilot onboarding/runbook.
4. Recruit a small operator for a time-boxed pilot.
5. Measure manual steps saved, defects, missing workflows, and willingness to pay before building payments.

## Completed recent backlog items

- Reservation lifecycle visibility — merged.
- Reservation email notifications — merged.
- Reservation status filters — merged.
- Consolidated reservation detail — merged.
- Host calendar overview — merged in PR #50.
- First-party listing photo uploads — merged in PR #51.
- Review sorting/pagination and host responses — merged in PR #52.
- Saved searches — merged in PR #53.
- Repository standards adoption — merged in PR #54.
- Admin reservation reporting and initial test suite — merged in PR #55.
- Structured/redacted logging security fix — merged in PR #56.
- Moderation audit history — merged in PR #58.
- Docker/local artifact hygiene — merged in PR #59.
- Pinned container Yarn/OpenSSL tooling — merged in PR #60.
- Reservation lifecycle/access test coverage — merged in PR #61.
- Saved-search normalization/scoping test coverage — merged in PR #62.
- Corrected container Yarn pinning — merged in PR #63.
- Database-backed application/container health monitoring — merged in PR #64.
- SMB pilot runbook and smoke tooling — merged in PR #65.

## Prioritization rules

- Broken builds, failed CI, migration failures, security regressions, and unusable test deployments outrank feature work.
- Prefer thin vertical slices that can be deployed and demonstrated.
- Defer features that do not materially improve customer value, reliability, commercialization, or product-market-fit learning.
- Never claim market validation, revenue, customer demand, or willingness to pay without evidence.
