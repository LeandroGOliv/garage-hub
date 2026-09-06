---
name: creating-github-tasks
description: Use when the user wants to create/file a GitHub issue or task for the garage-hub repo (backend, frontend, or general), or asks to open a ticket for a feature/bug/chore in this project.
---

# Creating GitHub Tasks

## Overview

Standardizes how tasks/issues get opened on `LeandroGOliv/garage-hub` via
`gh`. Every issue carries a TDD reminder and a documentation reminder,
regardless of area. Backend issues additionally get a **study path** —
concepts and technologies to research, never the solution — because the
user is learning Java/Spring through this project.

## Prerequisites

- `gh` CLI installed and authenticated — check with `gh auth status`. If
  it's missing or unauthenticated, stop and tell the user to install it
  (`winget install --id GitHub.cli`) and run `gh auth login`. Don't
  improvise a workaround (curl + PAT) unless they ask for one.
- Repo is `LeandroGOliv/garage-hub` — confirm with
  `gh repo view --json nameWithOwner` if unsure.

## Workflow

1. Gather what's missing: title, a short description/goal, the area
   (`backend` / `frontend` / `general`), and acceptance criteria if the
   user has any in mind. Don't demand a rigid template — ask only for
   what you actually need.
2. If area isn't stated, infer it from the paths/feature discussed; ask
   only if genuinely ambiguous.
3. Check labels with `gh label list`; create `backend`/`frontend` labels
   with `gh label create` if missing. Skip labeling for `general` tasks
   unless an existing label already fits. Never invent a label name and
   pass it to `--label` without confirming it exists first.
4. Build the issue body in **pt-BR** (issues are human-facing docs, per
   the repo's documentation-language rule) with these fixed sections:
   - `## Descrição` — the goal, in the user's own words.
   - `## Critérios de aceite` — bullets, only if the user gave any.
   - `## Testes (TDD)` — a reminder to write the failing test first,
     naming the applicable layers for the area: backend is
     unit → integration → E2E (see `backend/CLAUDE.md`), frontend is
     unit → E2E (see `frontend/CLAUDE.md`). Only omit this section for a
     task with genuinely no code (pure docs/config) — say so explicitly
     rather than silently dropping it.
   - `## Documentação` — a reminder to update the relevant `README.md`
     or docs if behavior or setup changes.
   - Don't reference this skill file, or any `CLAUDE.md`, anywhere in
     the issue body or comments — same rule as in the repo's own
     `CLAUDE.md`.
5. Create it: `gh issue create --repo LeandroGOliv/garage-hub --title "..." --body "..." [--label backend|frontend]`.
6. **If area is `backend`:** work out the study path (below), post it as
   a `gh issue comment` on the new issue, and summarize it in chat.
7. Report the issue URL back to the user.

## Study path (backend only) — concepts, never solutions

For every backend task, figure out from its actual content which
concepts/technologies it touches, then hand the user **only the trail**,
never the destination.

**Rule:** list concept/technology names and where to read about them
(official Spring docs section, guide, JLS chapter) — never a design
decision, code snippet, config value, class/annotation pairing, or step
order. If a line reads like "use X to do Y" or names a specific class
*and* what to put in it, that's the answer, not the study path — cut it
back to just the concept name.

Example, for "add a JWT-based login endpoint":

- ✅ Good: "Spring Security's filter chain and how it intercepts
  requests; JWT structure (header/payload/signature) and how signing
  works; password hashing (BCrypt) and why plaintext comparison is
  unsafe; how `@SpringBootTest` + MockMvc differ from a pure unit test
  with Mockito."
- ❌ Bad: "Add a `JwtAuthenticationFilter` extending
  `OncePerRequestFilter`, register it before
  `UsernamePasswordAuthenticationFilter` in `SecurityFilterChain`..." —
  that's the implementation, not a study path.

Keep it to 4-8 items, roughly ordered by when they'd first be needed.

## Quick reference

| Area     | Test layers to name           | Study path? |
| -------- | ------------------------------ | ----------- |
| backend  | unit → integration → E2E       | yes         |
| frontend | unit → E2E                     | no          |
| general  | only if the task involves code | no          |

## Common mistakes

- Writing the study path as a mini design doc — if it names a specific
  implementation shape, it's not a study path anymore.
- Skipping the TDD/docs sections for "small" tasks — every issue gets
  them; a one-line fix still starts with a test.
- Passing a label to `gh issue create` that doesn't exist in the repo
  yet — check/create first, or skip labeling.
