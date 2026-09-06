# Garage Hub — Backend

Spring Boot API for Garage Hub. See the repo root `CLAUDE.md` for the
project-wide overview, documentation-language rule, and comment
philosophy — this file covers backend-specific architecture, commands,
and conventions.

**Status:** fresh scaffold (`GaragehubApplication` + one placeholder
test). No domain code, no persistence, no auth wired up yet. The
structure and conventions below are the intended target, not what
exists today.

## Tech stack

- **Java 25**, **Spring Boot 4.1.0** (Maven, `spring-boot-starter-parent`)
- **Spring Data JPA** — persistence
- **Spring Web MVC** — REST controllers
- **Spring RestClient** — outbound HTTP calls (if/when needed)
- **PostgreSQL** — target database (not yet added as a Maven dependency)
- **JUnit 5 + Mockito** — unit tests (`spring-boot-starter-*-test` starters)
- **Testcontainers** — planned, for integration tests against a real Postgres (not yet a dependency)

## Essential commands

Run from `backend/`:

```bash
./mvnw spring-boot:run     # start the API (dev)
./mvnw test                # run unit + integration tests
./mvnw clean package        # build the jar
```

On Windows use `mvnw.cmd` instead of `./mvnw`.

## Environment variables

None of these are wired into `application.properties` yet — it
currently only sets `spring.application.name`. This table documents
the variables the app will read once persistence and auth land, so
they're planned ahead of the code.

| Variable          | Purpose                                   | Default                                    |
| ------------------ | ------------------------------------------ | -------------------------------------------- |
| `SERVER_PORT`       | Port the API listens on                    | `8080`                                        |
| `DB_URL`            | JDBC connection string for PostgreSQL      | `jdbc:postgresql://localhost:5432/garagehub`  |
| `DB_USERNAME`       | PostgreSQL username                        | `garagehub`                                   |
| `DB_PASSWORD`       | PostgreSQL password                        | *(none — must be set, no safe default)*       |
| `JWT_SECRET`        | HMAC signing secret for access tokens       | *(none — must be set, no safe default)*       |
| `JWT_EXPIRATION_MS` | Access token lifetime in milliseconds       | `3600000` (1 hour)                            |

A `docker-compose.yml` for local Postgres doesn't exist yet — add one
alongside the JPA/Postgres dependency when persistence is implemented.

## Architecture: package-by-feature

Packages are organized by feature (vertical slices), not by technical
layer (no top-level `controllers/`, `services/`, `repositories/`).
Each feature package holds its own `Controller`/`Service`/`Repository`
side by side. A feature that only makes sense nested inside another
(e.g. maintenance records only exist for a specific car) gets a
sub-package instead of its own top-level module. Cross-cutting concerns
(security config, global exception handling, generic utilities) live
under `shared/`.

```
com.garagehub.garagehub/
├── car/
│   ├── Car.java
│   ├── CarController.java
│   ├── CarService.java
│   ├── CarRepository.java
│   │
│   └── maintenance/              # sub-package — only exists in the context of a Car
│       ├── Maintenance.java
│       ├── MaintenanceController.java   # routes like /cars/{carId}/maintenance
│       ├── MaintenanceService.java
│       └── MaintenanceRepository.java
│
├── user/
│   └── ...
│
├── part/                          # first-class module (mirrors the frontend's part feature)
│   ├── Part.java
│   ├── PartController.java        # supports GET /parts and GET /parts?carId=X
│   ├── PartService.java
│   └── PartRepository.java
│
├── event/
│   └── ...
│
└── shared/
    ├── config/                    # SecurityConfig, CorsConfig, ...
    ├── exception/                  # GlobalExceptionHandler
    └── util/
```

This isn't final — if a feature outgrows a flat package or a
sub-feature turns out to deserve first-class status (like `part/`
did), restructure it rather than forcing it to fit.

## Authentication

JWT-based, stateless, from the start (mirrors the frontend's
authenticated/unauthenticated route split): a `POST` login endpoint
issues an access token, protected endpoints read it from the
`Authorization: Bearer <token>` header. No refresh-token flow, roles,
or `SecurityConfig` exist yet — this is the target shape, not current
state.

## Testing strategy (TDD, three layers)

TDD is mandatory: write the failing test before the implementation.
Tests are co-located with the class they cover (`CarServiceTest.java`
next to `CarService.java`).

Three layers, each answering a different question:

1. **Unit** (JUnit 5 + Mockito) — one class in isolation, dependencies
   mocked (e.g. `CarService` with a mocked `CarRepository`). No Spring
   context, no database. Fast, the bulk of the suite.
2. **Integration** (`@SpringBootTest` + MockMvc + Testcontainers) —
   boots the real Spring context against a real Postgres in Docker.
   Verifies controller → service → repository → database wiring:
   query correctness, JPA mapping, request/response serialization.
   No browser, no frontend involved.
3. **E2E** (Playwright, lives in the frontend project) — drives a real
   browser against the fully running stack (frontend + this API + a
   real database) for critical user flows end to end.

Integration tests are *not* a substitute for E2E and vice versa:
integration tests catch backend wiring/query bugs cheaply and without
a browser; E2E is the only layer that proves the whole system works
for an actual user flow. Reach for integration tests liberally, and
reserve Playwright for the flows that matter most — it's the slowest
and most expensive layer to run.
