# Spec-First Plan: Dimension Future Progress

## Request

Investigate the Dimension project, produce a concrete plan in the project agent-plan style, and begin the first implementation slices with atomic commits. The first implementation concern is to flatten the agent data layout so Dimension follows the WRAP-style `agents/` structure instead of nesting agent data under `agents/global-rules/agents/`.

## Requirements

### Goals

- Agent data uses a flat project-local structure: `agents/plans/`, `agents/workflows/`, `agents/templates/`, and `agents/references/`.
- The future-progress plan is a spec-first plan artifact under `agents/plans/`.
- The plan names the current project state, chosen direction, risks, verification, and execution slices.
- The first implementation slices are small enough to commit independently.
- The roadmap moves Dimension from static fixture canvas to source-backed visual code workspace, and no current framework choice is sacred if a better tool serves that goal.

### Non-Goals

- Do not build the full editor in this first slice.
- Do not introduce Canvas or WebGL rendering before Scalable Vector Graphics rendering has measured pressure.
- Do not implement source-code mutation, drag/drop editing, or runtime execution controls yet.
- Do not preserve the confusing `agents/global-rules/agents/` path as a second source of truth.
- Do not copy or document committed credential values.

### Constraints

- Keep imported global-rule documents under `agents/global-rules/` unless a later cleanup intentionally removes that snapshot.
- Keep reusable agent material under `agents/` following the WRAP layout.
- Use `docs/framework-decisions.md` as the current tool decision record: TypeScript stays central, Vue remains the browser shell, a custom Dimension workspace kernel is the first interaction approach, D3 supports geometry, Scalable Vector Graphics remains the first renderer, and Express with `ts-morph` remains acceptable for source import.
- Treat package-local build failures as current-state signal until dependency ownership and installation are fixed.
- Use atomic commits: one logical change per commit.

### Acceptance Criteria

- `agents/global-rules/agents/` no longer exists.
- `agents/plans/README.md` remains available.
- This plan follows the WRAP spec-first structure and uses the `Type, Title, Date.md` filename convention.
- The first committed slice contains the flattened agent layout and this plan artifact.
- Later cleanup slices do not mix behavior changes with documentation or secret hygiene.

## Current State

- `agents/global-rules/agents/` was a real nested directory containing plans, workflows, templates, references, `README.md`, and `codex-rules-guide.md`.
- WRAP uses a flatter structure:
  - `agents/README.md`
  - `agents/codex-rules-guide.md`
  - `agents/plans/`
  - `agents/workflows/`
  - `agents/templates/`
  - `agents/references/`
- Dimension now needs the same pattern so project agent data is discoverable without `agents/.../agents` nesting.
- Dimension has a split TypeScript stack:
  - `web/`: Vue 3, Vite, TypeScript, Vue Router, D3.
  - `api/`: Express 5, TypeScript, Vite plugin node, multer, `ts-morph`.
- Current frontend behavior is fixture-only:
  - `/` renders `web/src/views/HomeView.vue`.
  - `HomeView` renders `web/src/components/SpellCanvas.vue`.
  - `SpellCanvas` uses `web/src/fixtures/usersControllerIndex.ts`.
- Current backend behavior is importer seed work:
  - `GET /` returns `Hello World!`.
  - `POST /graphs` accepts one uploaded `file` field.
  - `api/src/services/graphs/create-service.ts` parses classes, methods, variable statements, returns, and catch clauses.
- Current graph models do not line up:
  - The API emits `DimGraph` with `nodes` and `links`.
  - Web fixture renders `SpellDiagram` with positioned runes, edge kinds, rings, radii, title, and subtitle.
- Current tooling is uneven:
  - `web/package.json` has build, type-check, lint, and format scripts.
  - `api/package.json` has dev, build, and preview only.
  - Root `package.json` is shared formatting/lint dependencies only.
  - Root and web READMEs are still mostly Vite boilerplate.
  - `bin/dev` includes test helpers for services not present in `docker-compose.development.yml`.
- Current health checks found blockers:
  - `web npm run type-check` fails on missing `d3` type resolution and implicit `any` destructuring in `SpellCanvas.vue`.
  - `web npm run build` and `api npm run build` fail while Vite writes `.vite-temp` files under root-owned `node_modules` directories.
- Security hygiene issue:
  - The local ignored `.envrc` contained a literal GitHub token value. Project setup should keep `.envrc` ignored and require token rotation outside this repo.

## Proposed Spec

### Design Summary

Dimension should use WRAP's agent-data layout and plan shape as the project convention. Agent-facing project material belongs directly under `agents/`, while imported global-rule snapshots may remain under `agents/global-rules/` only as source material. Future product progress should move through a source-backed read-only graph milestone, but the browser framework and interaction shell should be chosen by fit rather than by the current starter application.

### Behavior

- Agents looking for project plans read `agents/plans/README.md`, then specific plan files under `agents/plans/`.
- Agents looking for reusable procedures read `agents/workflows/README.md`, then specific workflow files under `agents/workflows/`.
- Agents looking for templates or references use `agents/templates/` and `agents/references/`.
- The Dimension product path moves from fixture-only Scalable Vector Graphics to imported TypeScript source rendered through a shared graph contract.
- The first UI milestone remains read-only: upload or sample source in, spell diagram out.

### Interfaces and Data

- Agent-data directories:
  - `agents/plans/`
  - `agents/workflows/`
  - `agents/templates/`
  - `agents/references/`
- Product graph stages:
  - `TypeScript source -> SourceGraph`
  - `SourceGraph -> SpellDiagram`
  - `SpellDiagram -> Scalable Vector Graphics`
- Current API route to evolve:
  - `POST /graphs`
- Current frontend renderer to evolve:
  - `web/src/components/SpellCanvas.vue`

### Risks and Tradeoffs

- Moving agent files can break relative links if any documents still point through `agents/global-rules/agents/`.
- Keeping `agents/global-rules/` as an imported snapshot avoids deleting useful source material but can still confuse readers if docs do not distinguish imported rules from project-local agent data.
- Fixing local `node_modules` ownership is necessary for builds, but that state should not be committed.
- The API and browser graph contracts are currently divergent; adding UI on top of the mismatch would create adapter churn.

## Open Questions

- Should `agents/global-rules/` remain as an imported source snapshot long-term, or should future cleanup copy only the useful root files and remove the snapshot directory?
- Should Dimension introduce a real root workspace package, or keep package-local `web/` and `api/` commands for now?
- Should shared graph types live in a small shared package or stay duplicated until the contract stabilizes?

## Decisions

- Use WRAP's flat `agents/` structure for project-local agent data.
- Use WRAP's spec-first plan shape for new Dimension plans.
- Keep the first product milestone read-only and source-backed.
- Treat the browser framework as changeable, but keep Vue for now because the user prefers it and the better first bet is a small custom workspace kernel rather than a React migration.
- Keep Scalable Vector Graphics and D3 as the renderer path per `docs/framework-decisions.md`.
- Treat local token exposure as a security cleanup item; never reproduce its value in docs, commits, or plan text.

## Verification

- Inspect `agents/` to confirm there is no `agents/global-rules/agents/` directory.
- Inspect `agents/plans/README.md` and this plan file after flattening.
- Run `git status --short` before each commit and commit only the intended slice.
- For product/tooling slices, re-run package-local checks when dependency ownership is fixed:
  - `cd web && npm run type-check`
  - `cd web && npm run build`
  - `cd api && npm run build`

## Execution Plan

### Current Branch State

- **Committed:** `224875e` flattens project-local agent material into `agents/`; `f178152` documents spec-first agent plans and WRAP-style discovery READMEs; `123a0e0` keeps local direnv secrets out of versioned setup.
- **Staged:** Nothing should be staged before each atomic commit is prepared.
- **Unstaged / Untracked:** The current intended slice adds a durable Dimension feature list and records a tool-selection direction that keeps Vue while building a custom Dimension workspace kernel first.

### Remaining Slices

1. Stabilize package-local checks.
   - Fix frontend type-check errors.
   - Repair local dependency ownership outside versioned files.
2. Build the custom Vue workspace kernel.
   - Split the current `SpellCanvas` into graph data, layout helpers, viewport state, glyph rendering, edge rendering, and inspector state.
   - Add pan, zoom, selection, and keyboard-focusable Scalable Vector Graphics elements.
   - Compare against Vue Flow only if custom interaction work starts dominating the source-backed editor milestone.
3. Define the shared graph contract.
   - Add source graph and visual graph types.
   - Add a named layout/transform step between parser and renderer.
4. Connect source import to read-only rendering.
   - Call `POST /graphs` from the browser application.
   - Render returned visual graph.
   - Keep sample fixture as a demonstration path.

## Files to Review

1. `agents/README.md` - Project-local agent-data entrypoint.
2. `agents/plans/README.md` - Plan artifact conventions.
3. `agents/plans/Plan, Dimension Future Progress, 2026-06-28.md` - This plan.
4. `agents/global-rules/` - Imported source snapshot that should not contain another `agents/` directory after flattening.
5. `.gitignore` - Ensures `.envrc` stays local and unversioned.
6. `docs/framework-decisions.md` - Existing and proposed stack decisions.
7. `docs/dimension-feature-list.md` - Product feature list, including visual code quality signals.
8. `web/src/components/SpellCanvas.vue` - Current Scalable Vector Graphics renderer.
9. `web/src/fixtures/usersControllerIndex.ts` - Current visual graph fixture.
10. `api/src/services/graphs/create-service.ts` - Current TypeScript source parser seed.

## Related Issues

- None identified during this investigation.