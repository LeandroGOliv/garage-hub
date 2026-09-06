---
name: pr-description
description: >-
  Generate a pull request description for the current branch following this
  repository's PR template and writing conventions. Use whenever the user asks
  to "generate a PR description", "write PR description", "create PR text",
  etc. — including when the request bundles it with other work on the same
  diff ("review the last commit and generate the PR description"), where it
  dispatches the `pr-description-author` sub-agent so the description is
  written in parallel with that work.
---

# PR Description Generator

Generate a GitHub PR description for the current branch by inspecting the git
diff, then filling in this repository's PR template. This only **drafts** the
text to a local, git-ignored file — it never runs `gh pr create`/`gh pr edit`
itself. The user pastes it in when they open the PR (or asks you to, as a
separate, explicit step).

---

## Step 1 — Determine the comparison scope

The user may specify the scope in the request. Honor it in this order:

1. **Explicit base branch** — e.g. "against `release/1.4`" → use that branch.
2. **Commit count** — e.g. "last 3 commits", "the past 2 commits" →
   use `HEAD~N` as the base.
3. **Default** — no scope given → use `main`.

```bash
# Example commands — substitute $BASE with the resolved ref

# Commits in scope
git log $BASE..HEAD --oneline

# Diff stat
git diff $BASE --stat

# Full diff — only when you are writing the description yourself (see Step 2);
# in dispatch mode the sub-agent reads it in its own context
git diff $BASE
```

If the branch name carries an issue number — `<type>/<issue-number>-<slug>`
(this repo's branch-naming convention, e.g. `feature/12-jwt-login`) — extract
it; the issue reference in the description is just `#<number>` (GitHub
auto-links and, with `Closes #<number>`, auto-closes it on merge). No issue
number in the branch → treat as "no issue" for Step 3.

---

## Step 2 — Decide: write it inline, or dispatch the sub-agent

**If you are already running as a sub-agent** (you cannot dispatch agents):
skip this step entirely and write the description yourself.

Otherwise, on the main thread, pick a mode:

| Situation | Mode |
| --- | --- |
| The PR description is the **only** thing asked | **Inline** — go to Step 3 yourself |
| It is **bundled with other work** on the same diff (review, tests, typecheck, docs) | **Dispatch** `pr-description-author` |

Why dispatch when bundled: the description does not depend on the other task's
outcome, so it should be written **concurrently**, not after. And the raw diff
stays in the sub-agent's context instead of yours.

Dispatch it with `Agent` (`subagent_type: pr-description-author`) **in the same
message as the other work** — alongside the reviewer sub-agents dispatched by
`review-orchestrator`, for example — so everything runs at once.

### The handoff prompt

Pass the context you have **already read** so the sub-agent re-derives nothing.
Fill every field you know; it will derive only what is missing:

```
Base ref resolvido: <ref>
Branch: <branch name>
Issue: <#número, ou "nenhuma">

Commits em escopo:
<git log $BASE..HEAD --oneline output>

Diff stat:
<git diff $BASE --stat output>

Síntese da mudança:
- <intent: what problem this solves>
- <mechanism: how it works, conceptually>
- <whether a significant part is mechanical refactor>
- <anything the diff alone does not reveal — a design decision, a constraint,
  a rule captured elsewhere>
```

The **synthesis** is the part that cannot be recovered from git — it is your
reading of the change (and of the conversation that led to it). If you already
have the full diff in context, do not paste it back: summarize it here and let
the sub-agent pull the raw diff itself.

When the sub-agent reports back, **relay its result to the user** (its report is
not shown to them): the file path, plus anything it flagged. Do not wait on it
before continuing with the other work.

---

## Step 3 — Fill in the template

Use `.github/pull_request_template.md` as the exact structural base. Replace
every placeholder/instruction text with real content.

### Writing rules (apply to every section)

1. **No file paths** — never quote a relative or absolute path (`src/…`,
   `backend/…`, `./…`). Refer only to the **name** of the thing: the endpoint
   (`POST /cars`), the component (`CarForm`), the service (`CarService`), the
   hook (`useCars`), the schema (`carSchema`), etc.

2. **How & why, not what** — describe the intent and the approach, not a
   line-by-line recap of the diff. The reviewer can read the diff; they need
   to understand *why* the change was made and *how* it works conceptually.

3. **Assume a reader who knows the codebase — cut what they already know.**
   The audience is a teammate (future-you) fluent in the project's
   conventions who can read the diff. Keep the description tight (ideally one
   screen). Do **not** spend prose on:

   - **Established repo conventions.** e.g. "campo opcional `?:` porque o
     backend usa Jackson NOT_NULL", enums com prefixo de feature (`CAR_`,
     `MTN_`, ...), `contracts/` como fonte única de tipos no frontend,
     package-by-feature e JWT stateless no backend. These are understood.
     Mention one *only* when the PR **deviates from or changes** it.
   - **Rationale already written in the code.** If a comment already explains
     *why* (an intentional edge-case guard, a workaround), do not restate
     that reasoning — the reviewer sees it in context.
   - **Anything self-evident from the diff.** Implementation details a
     reviewer infers at a glance need no narration.

   When in doubt, name *what* changed and let the diff (and its comments)
   carry the *why*. If a sentence would make a teammate think "obviously — I
   know that", delete it.

4. **Refactor warning** — when the diff contains a **significant portion** of
   mechanical changes across multiple files (import/export reordering,
   variable/type renaming, barrel restructuring, whitespace normalization,
   etc.) — even if mixed with functional changes — add a prominent callout
   **near the top of `## O que muda`**:

   > ⚠️ **Parte deste PR contém refatorações mecânicas** em vários arquivos
   > (renomeações, reorganização de imports/exports, ajustes de barril). Lint
   > e typecheck locais já cobrem essas mudanças — não é necessário revisão
   > linha a linha desses arquivos; concentre a revisão nas mudanças de
   > lógica e comportamento.

   If the diff is *entirely* mechanical (no logic changes at all), place the
   callout at the very top of the description instead, and set **Tipos de
   mudança** to `REFACTOR` only.

5. **Language** — write all prose in **pt-BR**. Keep identifiers (class,
   component, function, endpoint names) in their original casing/English form
   inside the prose.

6. **Test plan realism** — only list steps a reviewer can actually execute.
   If there is nothing to manually test (pure type/lint/config change), write
   "N/A — mudança puramente estrutural; lint/typecheck cobrem."

7. **`## Testes (TDD)` is rarely empty.** TDD is mandatory in this repo — this
   section should almost always describe the test(s) written before the
   implementation and what layer they're at (unit/integration/E2E on the
   backend, unit/E2E on the frontend). Only write "N/A" for a genuinely
   test-free change (docs/config only) — say so explicitly rather than
   leaving the section thin.

8. **Checklist items** — leave the pre-review checklist (`## Antes de
   solicitar uma revisão...`) intact but **remove the instruction line**
   ("_remova esta linha..._") from the final output; the checkboxes
   themselves stay.

9. **Remove unfilled optional sections** — if there is no related issue,
   remove the `## Issue relacionada` section entirely (don't leave the
   placeholder text).

---

## Step 4 — Write to `.code-reviews/`

Save the final Markdown to `.code-reviews/<branch>.md`, where `<branch>` is
the current branch name with every `/` replaced by `-`
(e.g. `feature/12-jwt-login` → `feature-12-jwt-login.md`).

```bash
BRANCH=$(git branch --show-current)
FILENAME="${BRANCH//\//-}.md"
# File will be written to .code-reviews/$FILENAME
```

Use the **Write** tool to create or overwrite the file. `.code-reviews/` is
git-ignored — this is always a local draft, never a live GitHub action.

After writing, tell the user:
- The full file path that was written.
- That `.code-reviews/` is git-ignored, so the file is local only, and they
  paste it in (or ask you to) when they actually open/update the PR.

Do **not** print the full Markdown body to the conversation — the file is
the deliverable. A one-line confirmation is enough.
