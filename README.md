# Roost

<!-- madmallard-badges:start -->
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2023-F7DF1E?logo=javascript&logoColor=000000)](https://developer.mozilla.org/docs/Web/JavaScript) [![Next.js 15.5.28](https://img.shields.io/badge/Next.js-15.5.28-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/) [![React 18.2.0](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=000000)](https://react.dev/) [![Node.js 24](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/) [![Prisma 7.10.0](https://img.shields.io/badge/Prisma-7.10.0-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/) [![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

[![CI](https://github.com/drakeg/roost/actions/workflows/ci.yml/badge.svg)](https://github.com/drakeg/roost/actions/workflows/ci.yml) [![Repository standards](https://github.com/drakeg/roost/actions/workflows/repository-standards.yml/badge.svg)](https://github.com/drakeg/roost/actions/workflows/repository-standards.yml) [![Security policy](https://img.shields.io/badge/security-policy-4C1?logo=github)](SECURITY.md) [![Issues](https://img.shields.io/github/issues/drakeg/roost)](https://github.com/drakeg/roost/issues) [![Pull requests](https://img.shields.io/github/issues-pr/drakeg/roost)](https://github.com/drakeg/roost/pulls)
<!-- madmallard-badges:end -->

Roost is a modern full-stack stay discovery, hosting, and reservation application built with Next.js, PostgreSQL, and Prisma.

The project began as a fork of an Airbnb clone starter, but the application has since been substantially rebuilt around a unified architecture and independent product identity.

## Current capabilities

- Browse and search active stays
- Listing details and availability
- User registration, login, sessions, and account management
- Host listing creation and editing
- Pause/reactivate listings
- Wishlists
- Reservation requests with host approval
- Guest trip history and cancellation
- Host reservation management, messaging, lifecycle history, and status filters
- Read-only host calendar combining reservations and blackout dates
- First-party listing photo uploads with persistent Docker storage
- Verified-stay reviews with sorting, pagination, and host responses
- Admin dashboard for users, listings, reservations, and moderation
- Docker Compose development environment
- PostgreSQL persistence with Prisma migrations
- Node.js 24 CI and container builds

## Architecture

Roost is moving toward a single deployable Next.js application:

- **Next.js App Router** for UI and server actions
- **PostgreSQL** for persistent storage
- **Prisma ORM** for database access and migrations
- **First-party authentication** using scrypt password hashing and server-side sessions
- **Docker Compose** for local application and database services

The legacy Nest/Amplication server and separate React Admin application have been removed. Roost now ships as a single active Next.js application backed by PostgreSQL and Prisma.

## Local development

See [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

Quick start:

```bash
cp .env.example .env
docker compose up --build
```

By default, Roost is available at:

```
http://localhost:3000
```

## Project planning

Roost follows the Mad Mallard rapid-development loop: **Build → Deploy → Test → Fix → Redeploy → Continue**. Work is organized into small, reviewable PRs and one-week sprint slices.

- [Sprint plan](SPRINTS.md)
- [Prioritized backlog](BACKLOG.md)
- [Agile delivery model](docs/AGILE.md)
- [Release policy](RELEASES.md)
- [Contributing](CONTRIBUTING.md)
- [Agent instructions](AGENTS.md)
- [Security policy](SECURITY.md)

Project-specific requirements take precedence, while shared conventions follow [Mad Mallard Repository Standards](https://github.com/drakeg/madmallard-repository-standards).

## Commercial direction

**Target customer hypothesis:** independent vacation-rental hosts and small property managers operating roughly 1–20 properties who want a simple direct-booking workflow without enterprise property-management complexity.

**Value proposition hypothesis:** reduce manual reservation coordination by combining discovery, availability, guest messaging, reservation state, calendar visibility, reviews, and host operations in one self-hostable product.

The fastest validation path is a narrow pilot with a small host/operator. Pricing and willingness-to-pay are hypotheses until validated with real prospects; no revenue or customer validation is assumed.

## Modernization status

The legacy NestJS/Amplication backend and React Admin UI have been retired. See [docs/MODERNIZATION.md](docs/MODERNIZATION.md) for the completed migration history and remaining cleanup work.

## Project name

The product is **Roost**. The repository may still temporarily use its historical clone-oriented GitHub slug until the repository itself is renamed.
