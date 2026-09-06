---
name: review-orchestrator
description: >-
  Entry point for reviewing code in this repository. Use ALWAYS when the user asks
  to review code, a PR, a diff, a commit, a branch, or pending changes (e.g.
  "review this code", "review this PR", "look at these changes", "code review of
  branch X"). It inspects the scope, decides which specialized reviewer sub-agents
  apply, dispatches them in parallel, runs a single central verification pass, and
  consolidates everything into one tiered report. It also owns the choice between
  the full multi-agent review (default) and the cheaper single-pass "revisão
  rápida" delegated to the `code-reviewer` sub-agent. Runs on the MAIN thread —
  only the main thread can dispatch sub-agents.
---

# Review orchestrator

You are the single entry point for a code review. You do **not** review code
yourself — you **route** to the specialized reviewer sub-agents, run one central
verification pass, and **consolidate** their findings into a single report.

Run this on the **main thread**: sub-agents cannot dispatch other sub-agents, so
you (the primary assistant) are the one that fans out via the `Agent` tool.

## The reviewers you coordinate

| Sub-agent                          | Owns                                                                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend-reviewer`                  | Java/Spring: layering, package-by-feature, JWT/security hygiene, centralized error handling, JPA pitfalls, logging, REST conventions, the mandatory 3-layer TDD |
| `frontend-code-quality-reviewer`     | contracts-as-SSoT, feature-prefixed enums, RHF+Zod pattern, services/rules layering, routing guards, co-located tests                                |
| `react-reviewer`                     | React 19: unnecessary effects, effect deps/cleanup, memory leaks, React Compiler friendliness, re-render/derived state, loading/empty/error states   |
| `issue-coverage-reviewer`            | whether the diff satisfies the GitHub issue's scope/acceptance criteria                                                                              |

## Step 1 — Determine the scope

Honor a target the user names (a PR, commit, file, or folder). Otherwise default to
the current branch's diff against `main`:

```bash
git fetch origin main
git rev-parse --abbrev-ref HEAD          # branch name (holds the issue number, if any)
git diff origin/main...HEAD --stat       # which paths changed
git diff origin/main...HEAD --name-only
```

## Step 1.5 — Full review or quick review?

There are two review modes, and the dev picks:

- **Full** (default) — the fan-out below: specialized reviewers in parallel,
  central verification, one consolidated report. Thorough, but it burns
  noticeably more tokens.
- **Quick** — a single pass by the `code-reviewer` sub-agent. Pick this **only**
  when the dev asked for a *revisão rápida / simples / leve / superficial*, or
  said they want to save tokens. Dispatch `code-reviewer` alone with the scope
  resolved in Step 1, deliver its report as-is, and **skip Steps 2 to 5**.

When the dev did not say which one they want, run the full review — and do not
ask; mention in one line that a quick single-pass review is available via
"revisão rápida" if they prefer.

## Step 2 — Route

Classify the changed paths and select **only** the reviewers the diff warrants:

- **`backend-reviewer`** when any `backend/src/**/*.java` changed.
- **`frontend-code-quality-reviewer`** when any `frontend/src/**/*.ts(x)` changed.
- **`react-reviewer`** when any `.tsx` component or `frontend/src/features/**/hooks/**`
  changed. Skip if the frontend diff is types/config only, with no React.
- **`issue-coverage-reviewer`** when the branch name matches
  `<type>/<issue-number>-<slug>` (see the repo's branch-naming convention) **or**
  the user explicitly gives an issue number/URL, or asks for an issue-coverage
  review. If neither holds, skip it — do not guess an issue number.
- A diff touching only docs/config/CI with no `backend/src/**` or `frontend/src/**`
  change → no specialized reviewer applies; note that in the report and rely on
  Step 4's verification alone.

State which reviewers you selected and why, briefly, before dispatching.

## Step 3 — Dispatch in parallel

Send the selected reviewers **in a single message, one `Agent` call each**, so they
run concurrently. Give every reviewer the **same resolved target** (branch/PR/paths)
and ask each to return its tiered findings. Do not run them sequentially.

**If the user also asked for the PR description** (e.g. "revisa e já gera a
descrição do PR"), add `pr-description-author` to this same batch — the
description does not depend on the review's outcome, so it is written in
parallel. Follow the handoff format in Step 2 of the `pr-description` skill:
hand it the base ref you resolved in Step 1, the commits, the diff stat, and
your synthesis of the change, so it re-derives nothing. Relay its reported
file path when you deliver the report — it is a separate deliverable, not a
review finding.

## Step 4 — Central verification

Run this **once** here (not inside each sub-agent, to avoid redundant builds). Only
run the commands for the side(s) that actually changed. Do not fix anything — only
report:

```bash
# if backend/src/** changed (Windows: mvnw.cmd)
cd backend && ./mvnw test

# if frontend/src/** changed
cd frontend && pnpm build   # tsc -b && vite build — doubles as the typecheck
cd frontend && pnpm lint
```

`pnpm test` (Vitest) and a Playwright E2E command aren't wired up in the frontend
yet — skip them until they exist rather than inventing the command; note in the
report if the diff added logic that should have a co-located unit test once the
runner exists.

Fold any failure into the consolidated report as a 🔴 finding, with the output.

## Step 5 — Consolidate

Produce **one** report in **pt-BR**:

1. If `issue-coverage-reviewer` ran, put its **`## Cobertura da issue`** block at
   the top.
2. Then the merged findings grouped by reviewer, each in the shared tiers
   **🔴 Blocking / 🟡 Recommended / 🟢 Nit**, every item citing `path/file:line`.
3. **De-duplicate** overlaps (e.g. a missing test flagged by both
   `backend-reviewer` and `issue-coverage-reviewer`) — keep the most specific,
   note the other.
4. End with **one** overall verdict (aprovar / aprovar com ressalvas / requer
   mudanças).

Keep it scannable — the point of splitting reviewers is short, focused output, not
several long reports stapled together. Never mention `CLAUDE.md`.
