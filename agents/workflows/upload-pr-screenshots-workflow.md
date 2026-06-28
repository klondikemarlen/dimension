# Upload Pull Request Screenshots Workflow

Use when a pull request needs screenshots or visual evidence.

## Process

1. Identify reviewer-relevant UI states from the diff or PR body.
2. Capture stable states only; avoid transient spinners, snackbars, or partially loaded screens.
3. Store temporary screenshots outside the repository unless the user explicitly wants files committed.
4. Upload screenshots to the PR host when possible so the branch does not carry temporary image files.
5. Add captions that explain what each screenshot proves.

## Rules

- Do not commit temporary screenshots by default.
- Redact secrets, credentials, personal data, and tokens.
- If screenshots are expected but blocked, leave captioned placeholders and explain the blocker.

## PR Body Pattern

```markdown
# Screenshots

## <State name>

<uploaded image or placeholder>

Shows <specific reviewer-relevant result>.
```
