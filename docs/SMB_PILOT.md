# SMB host pilot package

Roost’s first commercial validation target is an **independent vacation-rental host or small property manager with roughly 1–20 properties**. This is a hypothesis to test, not proof of demand.

## Problem and value hypotheses

Target operators often coordinate listing details, availability, reservation requests, guest messages, cancellations, reviews, and reporting across multiple tools or manual processes.

Roost’s value hypothesis is that a simpler direct-booking and host-operations workflow can reduce reservation coordination time, reduce double-booking/status mistakes, keep guest communication attached to reservation context, and provide a self-hostable/open-source path without enterprise PMS complexity.

## Pilot boundaries

The initial pilot validates workflows Roost already implements. It does **not** claim to replace a mature payment processor, tax engine, channel manager, or enterprise property-management system. Payments remain out of scope until transaction-state, refund, webhook, payout, dispute, and PCI boundaries are designed and validated.

## Deployment readiness

Before every demo or pilot session:

1. Confirm the current default branch is deployed.
2. Confirm PostgreSQL is healthy and migrations are current.
3. Run the public smoke test:

    python3 scripts/pilot_smoke_test.py --base-url http://HOST:PORT

4. Require all checks to report `PASS`.
5. Confirm SMTP behavior for the intended environment; production pilots should configure SMTP.
6. Confirm listing uploads use persistent storage.
7. Confirm an admin account is available without sharing credentials in tickets, chat logs, or documentation.

The smoke command checks the database-backed `/health` endpoint plus the public home, search, login, and registration pages. It intentionally does not log in or mutate pilot data.

## End-to-end demo workflow

Use two normal accounts (host and guest) plus a separate admin account.

### Host setup

- create or edit a listing;
- upload listing photos;
- configure amenities, guest capacity, price, and active status;
- add a blackout range;
- review the host calendar.

### Guest journey

- search by destination/type/dates/guests/amenities;
- save and rerun a search;
- open a listing;
- submit a reservation request;
- exchange reservation messages.

### Host operations

- inspect the pending request;
- review reservation details, pricing snapshot, messages, and status history;
- confirm or decline the request;
- verify the calendar reflects active reservation state.

### Lifecycle and trust

- exercise guest or host cancellation on an appropriate test reservation;
- complete a historical confirmed stay and submit a verified-stay review;
- post a host response to the review;
- inspect admin reservation reporting and CSV export;
- change an admin-managed setting and verify moderation audit history records it.

Do not alter real customer reservations merely to demonstrate a lifecycle action.

## Pilot success metrics

Capture evidence instead of impressions where possible:

- time to create and publish the first usable listing;
- time to find availability and submit a reservation request;
- time for a host to understand and act on a pending reservation;
- number of manual/off-platform steps required per reservation;
- number and severity of defects encountered;
- number of support interventions required;
- whether calendar/status history prevents an operator mistake;
- whether admin reporting answers basic daily questions;
- blocking features versus desirable features;
- explicit willingness to pay and the conditions attached to it.

Never record assumed savings, revenue, demand, or willingness to pay as validation.

## Pricing hypothesis to test

A starting interview hypothesis is **$29–$59/month for a small managed-hosting/operator tier covering roughly 1–5 properties**, with larger operators priced separately. This is a research anchor, not a committed price.

For an early assisted pilot, also test willingness to pay a modest one-time onboarding/setup fee in exchange for deployment help and migration of initial listing data.

Do not build billing solely to test pricing. First ask prospects what they pay today, what manual work Roost replaces, and what price would make adoption an easy decision versus a non-starter.

## Competitive discovery

During interviews, ask which category currently solves each job: marketplace-only hosting, direct-booking/PMS software, spreadsheets/shared calendars, email/text messaging, separate analytics/reporting, or custom/self-hosted software. Record the actual products a prospect uses and why; do not infer competitor usage or satisfaction.

## Interview questions

- Walk through the last reservation from inquiry to checkout.
- Where did you copy the same information more than once?
- What causes the most booking mistakes or guest follow-up?
- How do you know a date is truly available?
- What information do you check every morning?
- What happens when a guest or host cancels?
- How do you answer “what happened to this reservation?”
- Which current tool would be hardest to replace, and why?
- What would Roost have to do before you would use it for a real booking?
- If those blockers were solved, what would you expect to pay?

## Pilot exit criteria

A pilot is ready to advance toward a paid production customer when:

- deployment health remains reliable during the pilot;
- core listing/search/reservation/message/calendar workflows complete without a P0/P1 defect;
- operator data remains intact across restart/update testing;
- the operator can complete routine daily workflows without developer intervention;
- missing features are documented and prioritized by observed customer impact;
- willingness-to-pay evidence is explicit rather than inferred.

A failed criterion becomes backlog input. Avoid expanding scope during the pilot unless the issue blocks the validation goal.
