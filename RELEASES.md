# Releases and versioning

Roost follows Semantic Versioning.

- **MAJOR** — incompatible application behavior, data model/API contracts, deployment assumptions, or migration requirements that cannot be adopted backward-compatibly.
- **MINOR** — backward-compatible user-visible capabilities such as new host, guest, admin, reporting, or search workflows.
- **PATCH** — backward-compatible defect, security, reliability, documentation, or deployment fixes where a release is warranted.

The application manifest currently contains version `0.1.0`. That value alone is **not** evidence of a published GitHub release. A release badge must not be added until an actual GitHub release is verified.

## Release triggers

Create a release when a meaningful, tested increment is ready for operators/users—not simply because a PR or Sprint completed. Typical triggers:

- a coherent user-visible capability set is ready for pilot/demo use;
- a security or reliability fix should be traceable as a deployed version;
- a deployment/migration change needs explicit operator guidance;
- a stable pilot milestone is ready to reproduce.

## Release checklist

- required CI and repository-standards checks pass;
- relevant tests/builds and Docker startup are verified;
- database migrations are reviewed and documented;
- README, SPRINTS, BACKLOG, and setup/deployment docs are current;
- no credentials or sensitive user data appear in artifacts/logs;
- compatibility and rollback considerations are documented;
- release notes summarize user-visible changes and migration/configuration needs;
- version/tag choice is manually reviewed before publishing.

Pre-stable releases may use `v0.x.y`. A future `v1.0.0` should represent a deliberately supported pilot/production contract, not an arbitrary milestone.
