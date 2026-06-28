# Plans

This directory contains implementation planning documents for Dimension.

## Core Shape

Every new document in this directory should be a **spec-first plan**:

- **requirements first** — what must be true when the work is done
- **spec second** — how the system should behave and where it fits
- **plan last** — the implementation order for the current branch reality

That ordering keeps durable requirements and design decisions stable while the execution checklist can
change as code moves.

## Available Plans

See this directory for available documents. New documents are created as needed for complex
implementation work and follow the naming convention: `Type, Title, Date.md`.

## When to Create One

Create a spec-first plan when the work needs one or more of:

- multiple requirements or acceptance rules
- meaningful design choices or tradeoffs
- cross-file or cross-team coordination
- a handoff artifact that must survive branch churn

Skip it for small mechanical changes.

## Requirements Intake

The planning stage may be interactive.

If the request does not contain enough product requirements to write a credible `Requirements`
section, ask for the missing requirements before solutioning. Do not invent product rules that belong
to the requester.

If some requirements remain unknown after asking, list them under `Open Questions` and call out the
assumptions explicitly in `Decisions`.

## Required Structure

All new documents in this directory should follow this template:

```markdown
# Spec-First Plan: [Descriptive Title]

## Request

[One paragraph: what triggered this work]

## Requirements

### Goals

- [Outcome that must be true]

### Non-Goals

- [What this work explicitly will not do]

### Constraints

- [Technical, product, migration, or operational constraint]

### Acceptance Criteria

- [Observable proof the work is done]

## Current State

- [How the system works today]
- [Relevant files, existing behavior, existing pattern]

## Proposed Spec

### Design Summary

[Concise description of the chosen design]

### Behavior

- [Normal path]
- [Edge case / failure path]
- [Migration or compatibility rule]

### Interfaces and Data

- [Routes, models, events, component props, payloads, etc.]

### Risks and Tradeoffs

- [Risk]
- [Tradeoff]

## Open Questions

- [Question still needing answer]

## Decisions

- [Decision already made and why]

## Verification

- [Specific tests or scenarios to run]

## Execution Plan

### Current Branch State

- **Committed:** [what is already done]
- **Staged:** [what is staged]
- **Unstaged / Untracked:** [what still exists locally]

### Remaining Slices

1. [First implementation slice]
2. [Second implementation slice]
3. [Cleanup / docs / tests slice]

## Files to Review

1. `path/to/file1` - [Why it matters]

## Related Issues

- [Ticket, PR, or issue]
```

## Writing Rules

1. Requirements before solutions.
2. Spec before checklist.
3. Separate durable truth from branch state.
4. State non-goals explicitly.
5. Acceptance criteria must be observable.
6. Use current code, not imagined architecture.
7. Keep `Files Changed` out of planning docs.
8. Prefer one chosen design unless a real decision is pending.

## File Naming Convention

**Format:** `Type, Title, Date.md`

Examples:

- `Plan, Dimension Future Progress, 2026-06-28.md`
- `Frontend Feature, Source Import Workspace, 2026-06-28.md`
- `Backend Refactoring, Graph Contract Extraction, 2026-06-28.md`

Rules:

- Use commas to separate the three components.
- No brackets or special characters in the actual filename.
- Date must be ISO format: `YYYY-MM-DD`.
- Type should be a clear category that helps organize documents.
