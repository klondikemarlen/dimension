# Testing Instructions Workflow

Use when writing or updating pull request testing instructions.

## Process

1. Read the PR body, diff, and any existing testing section.
2. Identify behavior a reviewer can actually verify.
3. Verify exact UI labels, routes, commands, and required setup from source or a running app. Do not guess.
4. Write steps in the order a reviewer should perform them.
5. Include expected outcomes for each scenario.
6. Separate independent scenarios with numbered test cases when the flow is complex.

## Rules

- Test behavior, not implementation details.
- Prefer user-visible verification over internal plumbing.
- Include setup commands only when they are needed for the scenario.
- Use exact labels for buttons, fields, tabs, pages, and messages.
- Do not include credentials, secrets, or local-only state values.
- If something was not verified, say so explicitly.

## Output Shape

```markdown
## Testing Instructions

1. Run `<focused check>`.
2. Start the app with `<project command>`.
3. Navigate to `<page>`.
4. Perform `<action>`.
5. Verify `<observable result>`.
```
