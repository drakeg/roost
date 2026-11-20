# Contributing

Roost welcomes focused human- and AI-authored contributions that improve customer value, reliability, security, usability, or commercialization readiness.

## Workflow

1. Start from the current `master` branch and associate ordinary work with `SPRINTS.md` or `BACKLOG.md`.
2. Create a focused feature/fix branch. Urgent break/fix work may be expedited but must still be documented.
3. Prefer Conventional Commit prefixes: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `build:`, or `ci:`.
4. Update tests and documentation with behavior changes.
5. Run the relevant local validation before opening a PR.
6. Open a reviewable PR describing the value, scope, validation, migrations/configuration, risks, rollback considerations, and intentional follow-up.
7. Do not merge while required checks are failing. Respect branch protection and required reviews.
8. Delete merged feature branches when repository policy permits.

## Local validation

From the repository root:

```bash
python3 scripts/validate_repository_standards.py
cp .env.example .env
docker compose up --build
```

From `public/`:

```bash
yarn install --frozen-lockfile
yarn prisma:generate
yarn build
```

Roost does not currently claim a dedicated automated test-suite badge. Add one only after a real test command and CI test job exist.

## Definition of Ready

A change is ready when user/operator value is clear, acceptance criteria are testable, authorization/security implications are understood, required migrations/config changes are known, dependencies are available, and the work fits a focused PR.

## Definition of Done

- acceptance criteria are met;
- CI and repository-standards validation pass;
- relevant tests/builds/deployments are verified;
- server-side authorization/validation is preserved;
- migrations are included and reviewed when needed;
- README/Sprints/Backlog/Release impact are updated when applicable;
- badge claims remain supported by checked-in evidence;
- no credentials or sensitive user data are exposed;
- follow-up work is added to the backlog rather than hidden in scope growth.

## README badge maintenance

Badges belong immediately below the README H1 inside the bounded Mad Mallard marker block. Technology versions must be verified from manifests or deployment configuration. Workflow, issue, and PR badges must be dynamic. Do not add license, release, test, or security-success badges without evidence.

Shared conventions follow [Mad Mallard Repository Standards](https://github.com/drakeg/madmallard-repository-standards), while Roost-specific requirements remain authoritative.
