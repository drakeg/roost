# Prioritized backlog

This is Roost's root backlog and source of truth for delivery priority. Detailed historical product notes remain in `docs/PRODUCT_BACKLOG.md`.

| Priority | Item | Customer / operator value | Status |
| --- | --- | --- | --- |
| P0 | Saved searches / search preferences | Lets guests reuse high-intent searches without rebuilding filters | In review — PR #53 |
| P0 | Repository standards adoption | Keeps development, documentation, badges, release policy, and validation consistent | In progress |
| P1 | Admin reservation reporting | Gives small operators visibility into volume, status, cancellations, and booking value | Ready next |
| P1 | Critical-path automated tests | Reduces regression risk in reservation, auth, search, upload, and host workflows | Ready |
| P1 | Structured observability | Speeds diagnosis while protecting credentials/tokens | Ready |
| P1 | Moderation audit history | Improves accountability for admin actions | Planned |
| P1 | SMB host pilot package | Creates the shortest path to real demand/willingness-to-pay feedback | Planned |
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

## Prioritization rules

- Broken builds, failed CI, migration failures, security regressions, and unusable test deployments outrank feature work.
- Prefer thin vertical slices that can be deployed and demonstrated.
- Defer features that do not materially improve customer value, reliability, commercialization, or product-market-fit learning.
- Never claim market validation, revenue, customer demand, or willingness to pay without evidence.
