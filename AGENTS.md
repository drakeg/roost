# Agent operating instructions

These instructions apply to Roost and complement the shared guidance in [drakeg/madmallard-repository-standards](https://github.com/drakeg/madmallard-repository-standards). Roost-specific architecture, security, deployment, and product requirements take precedence.

1. Use **Build → Deploy → Test → Fix → Redeploy → Continue**. Do not stop merely because a PR, Sprint, or deployment completed when another ready task can be advanced safely.
2. Read `README.md`, `SPRINTS.md`, `BACKLOG.md`, `CONTRIBUTING.md`, `RELEASES.md`, `SECURITY.md`, and workflows before substantive changes.
3. Keep Roost a single active Next.js application backed by PostgreSQL and Prisma. Do not reintroduce retired NestJS/Amplication or separate admin applications.
4. Use focused branches and reviewable PRs. Respect branch protection and required checks. Never report tests, builds, deployments, or fixes as successful unless verified.
5. Treat authorization as a server-side responsibility. Preserve reservation/account history, validate uploads and user input, and never expose secrets in logs, code, PRs, or documentation.
6. Keep the Docker Compose test environment working with configurable ports, persistent data, and LAN accessibility when appropriate. Preserve existing data during upgrades.
7. Maintain `SPRINTS.md`, `BACKLOG.md`, `RELEASES.md`, README capabilities, and setup docs as features and priorities change.
8. Keep README badges immediately below the H1. Badge claims must be supported by checked-in manifests, workflows, Docker configuration, releases, or license files. Never invent a passing status, release, license, or version.
9. Run `python3 scripts/validate_repository_standards.py` whenever repository standards or badges change. Update validation when the stack or workflow names change.
10. Prioritize customer value for independent hosts and small property managers: reduce manual work, reservation errors, coordination time, and operating friction. Treat pricing, demand, and willingness-to-pay as hypotheses until validated.
11. Keep this repository independent. Do not couple authentication, databases, services, or deployment state to other Mad Mallard applications unless explicitly requested.
12. When a build, CI job, test, migration, or deployment fails, treat the failure as high priority: diagnose it, fix it, rerun validation, and document any follow-up work.
