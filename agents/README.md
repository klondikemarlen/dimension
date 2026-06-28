# AI Agents & Workflows

This directory contains Dimension-specific AI workflows, templates, references, and plans.

## Important

Directory READMEs under `agents/` are discovery documents.

Agents should use these READMEs to find relevant workflows, templates, or plans, then read the
underlying files directly. The individual workflow/template/plan files are the source of truth for
task-specific instructions.

## Directory Structure

```text
agents/
├── README.md              (this file)
├── codex-rules-guide.md   (Codex command approval guidance)
├── templates/             (reusable code or document templates)
│   ├── README.md
│   └── *-template.md
├── references/            (durable cross-workflow guidance)
│   ├── README.md
│   └── *-reference.md
├── workflows/             (reusable workflow documents)
│   ├── README.md
│   └── *-workflow.md
└── plans/                 (spec-first implementation plans)
    ├── README.md
    └── Type, Title, Date.md
```

## Templates

Templates provide copy-paste-ready examples or end-state patterns. Use
[`templates/README.md`](templates/README.md) to find relevant templates, then read the underlying
template file before using it.

## Workflows

Workflows are reusable, AI-readable procedures for complex, repeated tasks. Use
[`workflows/README.md`](workflows/README.md) to discover the right workflow, then read the actual
workflow file before acting.

When a task spans multiple concerns, combine the relevant workflows rather than treating the first
matching workflow as the only source of guidance.

## References

References capture durable project techniques and conventions that multiple workflows can point to.
They are background guidance, not step-by-step task procedures. Use
[`references/README.md`](references/README.md) for available reference material.

## Plans

Plans are spec-first implementation documents. They capture requirements first, design/spec
decisions second, and the current execution plan last so durable context survives branch churn. Use
[`plans/README.md`](plans/README.md) for the required structure and naming convention.

## Best Practices

1. Keep reusable procedures in `workflows/`.
2. Keep copyable examples in `templates/`.
3. Keep durable background guidance in `references/`.
4. Keep exploratory or multi-phase implementation plans in `plans/`.
5. Prefer discovery over long inventories: point agents to the relevant directory and naming
   convention.
6. Keep project-local agent data directly under `agents/`; do not create another nested
   `agents/.../agents` source of truth.
