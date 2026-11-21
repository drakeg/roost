# Security policy

Do not report credentials, personal data, session tokens, working exploits, or other sensitive material in public GitHub issues or pull requests. Use GitHub private vulnerability reporting when enabled, or contact the repository owner privately before sharing sensitive details.

## Security expectations

- Authentication and authorization decisions are enforced server-side.
- Login password verification uses constant-cost scrypt work for unknown usernames, and repeated failed logins are temporarily throttled server-side.
- Passwords remain scrypt-hashed; session and verification tokens must never be logged.
- PostgreSQL credentials and SMTP credentials belong in environment configuration, never source control.
- Listing uploads must remain type/size/signature validated and stored outside the repository.
- Reservation and account lifecycle history should be preserved instead of destructively rewritten.
- Workflow permissions should use least privilege; PR workflows should not expose production secrets to untrusted code.
- Dependency, container, and GitHub Action upgrades require review and validation.

## Supported versions

Until the first verified GitHub release is published, security support applies to the current `master` branch only. Supported release lines will be documented here after releases exist.
