# Agile Delivery Model

Roost uses small, reviewable increments with a continuously prioritized backlog and a rapid **Build → Deploy → Test → Fix → Redeploy → Continue** loop.

## Cadence

- **Sprint length:** one week
- **Planning:** select the highest-value dependency-ready work
- **Execution:** keep WIP low, but continue to the next ready task after merges/Sprint completion
- **Review:** every change is delivered through a focused PR with required checks
- **Retrospective:** record shipped work, failures, carryover, and process improvements
- **Refinement:** defects, security findings, deployment failures, and customer-value evidence can reprioritize the backlog immediately

## Workflow

1. **Backlog**
2. **Ready**
3. **In progress**
4. **Review**
5. **Done**

Root `SPRINTS.md` and `BACKLOG.md` are the current delivery sources of truth.

## Definition of Ready

A backlog item is ready when value is clear, acceptance criteria are testable, security/authorization impact is understood, migrations/config changes are identified, dependencies are available, and the change fits a reviewable slice.

## Definition of Done

A change is done when it is merged to `master`, required checks pass, relevant validation is verified, server-side authorization/validation is preserved, migrations are included where needed, user/operator documentation is current, release impact is recorded, and follow-up work is captured in the backlog.

## Engineering principles

- Keep a single Next.js/PostgreSQL/Prisma application.
- Do not reintroduce retired NestJS/Amplication or separate React Admin applications.
- Prefer server components/actions and explicit server-side authorization.
- Preserve transactional and account history.
- Keep Node 24, Docker Compose, PostgreSQL, Prisma, and CI aligned.
- Preserve local data and make test deployments LAN-accessible where appropriate.
- Prioritize working operator workflows over speculative complexity.
- Treat failed builds, CI, migrations, and deployments as urgent defects.
- Follow `AGENTS.md`, `CONTRIBUTING.md`, and centralized Mad Mallard standards where they do not conflict with Roost requirements.

## Commercialization principle

Prioritize features that save independent hosts/property managers time, reduce reservation mistakes, improve visibility, or accelerate a credible pilot. Demand, pricing, revenue, and willingness-to-pay remain hypotheses until verified.
