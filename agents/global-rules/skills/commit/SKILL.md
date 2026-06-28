---
name: commit
description: Create intentional git commits from staged or relevant local changes. Use when the user asks Codex to commit, commit staged files, commit relevant files, amend a commit, or otherwise turn current repository changes into a commit while following repo-local commit guidance such as COMMITTING.md.
---

# Commit

Create the smallest honest commit that matches the user's requested scope.

## Workflow

1. Read repo-local commit guidance first, especially `COMMITTING.md` when present.
2. Check `git status --short`.
3. Inspect the staged diff with `git diff --cached --name-status` and `git diff --cached --stat`.
4. If the user asked for `commit staged`, commit only the index. Do not stage extra files.
5. If the user asked for `commit relevant files`, stage only files that clearly belong to the requested logical change. Avoid `git add .`.
6. Review enough of the staged diff to understand the purpose. Use `git diff --cached -- <paths>` for the files being committed.
7. If the purpose is unclear, ask rather than guessing.
8. Commit with the repo's message style.
9. Report the commit hash and subject, then mention any remaining unstaged or untracked files.

## Guardrails

- Never commit without an explicit user request.
- Never include unrelated user changes to make the tree clean.
- Prefer one logical change per commit.
- Keep staged docs/plans separate from behavior changes unless the user explicitly wants them together.
- If tests or checks were not run in this turn, do not imply they passed.
- If a command produces a commit but terse output, verify with `git log -1 --oneline`.

## Message Selection

Use the repository's `COMMITTING.md` over these defaults.

When no stronger local guidance exists, use:

```text
:emoji: Imperative outcome.
```

Useful emoji defaults:

- `:sparkles:` for new features
- `:bug:` or `:beetle:` for fixes
- `:recycle:` for structural cleanup
- `:fire:` for removed code
- `:memo:` for documentation or plan-only changes
- `:white_check_mark:` for tests
- `:label:` for type-only changes
- `:ok_hand:` for small adjustments

For complex commits, add one or two short body sentences explaining the non-obvious context.
