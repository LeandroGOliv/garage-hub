# Garage Hub

Personal app to centralize a car's history: maintenance records, part
replacements, and upgrades over time.

**Status:** early scaffold. Both `backend/` and `frontend/` are
freshly generated projects with no domain code yet. Everything in
this file and in the sub-project `CLAUDE.md` files describes the
*intended* architecture — expect it to be refined as real features
land.

## Repo layout

This is a two-project repo, not a package-manager workspace/monorepo
tool (no Turborepo/Nx) — `backend/` and `frontend/` are independent
projects that happen to live side by side.

```
garage-hub/
├── backend/    # Spring Boot API — see backend/CLAUDE.md
├── frontend/   # React SPA — see frontend/CLAUDE.md
└── README.md
```

## Tech stack at a glance

| Layer    | Stack                                                             |
| -------- | ------------------------------------------------------------------ |
| Backend  | Java 25, Spring Boot 4.1, Spring Data JPA, PostgreSQL, Maven        |
| Frontend | React 19, Vite, TypeScript, TanStack Router/Query, Tailwind, shadcn/ui, pnpm |

Details, commands, and environment variables for each side live in
their own `CLAUDE.md` — this file only covers what's shared.

## Development workflow

**TDD is mandatory on both sides**, for every task: write the failing
test first, then the implementation. Each side also carries its own
E2E suite (Playwright) for full user-flow coverage on top of unit
tests — see `backend/CLAUDE.md` and `frontend/CLAUDE.md` for how the
test pyramid is split there.

### Branch naming

A branch that addresses a tracked GitHub issue is named
`<type>/<issue-number>-<slug>` — e.g. `feature/12-jwt-login-endpoint`,
`fix/8-null-pointer-on-car-list`. `<type>` is a short verb (`feature`,
`fix`, `chore`, `refactor`, ...). A branch with no associated issue
(a spike, a one-off cleanup) can skip the number.

### Agents and skills

- `creating-github-tasks` (skill) — opens GitHub issues for this repo.
- `review-orchestrator` (skill) — entry point for code review; routes
  to `backend-reviewer`, `frontend-code-quality-reviewer`,
  `react-reviewer`, and `issue-coverage-reviewer` as the diff warrants,
  or to the cheaper single-pass `code-reviewer` for a quick review.
- `pr-description` (skill) — drafts a PR description to
  `.code-reviews/<branch>.md` (git-ignored, local only) from
  `.github/pull_request_template.md`; dispatches
  `pr-description-author` in parallel when bundled with a review.

## Documentation language

Two languages, split by audience:

- **Portuguese (pt-BR)** — anything a human dev on this project
  reads: `README.md` files, docs, commit messages, comments in
  config files explaining a decision to the team.
- **English (en-US)** — anything a code agent reads primarily: this
  file, the sub-project `CLAUDE.md` files, and any future
  `.claude/agents/**` or `.claude/skills/**`.

**Identifiers stay in English** regardless of audience — class,
function, variable, and file names follow normal Java/TS convention.
The language split applies to prose, not symbol names.

When unsure, ask "who reads this first?" — a teammate browsing the
repo → pt-BR; an agent loading it as context → en-US.

## Code comments

Comment the **why**, never the **what** — the code already says what
it does.

A comment earns its place when the reason isn't recoverable from the
code itself: a library quirk, a deliberate deviation from a
convention, a genuinely non-obvious edge case. Everything else ships
uncommented. Write the rule once, in the file that owns it — a rule
copied into three files is three copies to keep in sync.

Once a comment earns its place: plain words, one line where one line
does, one idea per comment, written for the next developer rather
than a spec.

## Never reference this file

Don't mention `CLAUDE.md` in code, comments, commit messages, or PR
descriptions — it's a private operating context for the coding agent,
not part of the project's public documentation.

- Don't link to it from any committed `.md` file or JSDoc/Javadoc.
- Don't cite it in commit messages ("as documented in CLAUDE.md").
- If a rule needs to be visible to humans or PR reviewers, promote it
  to a public doc (a `README.md`, a doc under `docs/`) and reference
  *that* instead.
