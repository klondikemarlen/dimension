# Dimension Feature List

Dimension is a browser-first visual code editor concept. The first product target is a minimum viable product that helps a developer understand a codebase spatially, with a paint-program feeling and a block-based data view style.

## Feature Status Key

- **Now:** belongs in the first minimum viable product path.
- **Next:** likely follows after the first source-backed visual workspace works.
- **Later:** useful, but should not steer the first implementation.

## Now

### Source-backed visual workspace

Import a TypeScript source file and render a read-only visual graph from real code structure.

Acceptance criteria:

- A user can upload or select a TypeScript file.
- The application parses classes, methods, variables, return paths, and error paths.
- The browser renders a visual code map without relying only on a hard-coded fixture.
- Every rendered edge references an existing rendered node.

### Shared graph contract

Create one contract between the parser and the visual workspace.

Acceptance criteria:

- The server-side parser emits a source graph with stable identifiers and semantic node kinds.
- The browser transforms the source graph into a visual graph with positions, sizes, rings, and edge kinds.
- The renderer consumes the visual graph only.

### Custom visual workspace kernel

Provide pan, zoom, selection, and spatial movement patterns through Dimension-owned Vue components and composables, with a paint-program feeling instead of a stock node-editor surface.

Acceptance criteria:

- A user can pan and zoom the workspace.
- A user can select a visual node.
- Selection updates an inspector panel.
- The canvas keeps Dimension's parchment, glyph, ring, and leyline visual direction.
- The workspace behavior is small enough to understand: viewport state, pointer gestures, selection, hit testing, focus, graph layout, and inspector updates.

### Code quality visualization

Visually distinguish healthy code from risky code without pretending the tool can judge everything perfectly.

Acceptance criteria:

- Good code and risky code use distinct visual channels that are still accessible without color alone.
- The inspector explains why a node was marked healthy, risky, or unknown.
- Quality markers are based on explicit signals, not hidden opinion.
- Unknown quality is shown as unknown, not as good.

Initial quality signals:

- Type checking result when available.
- Linting result when available.
- Method length.
- Branching complexity.
- Number of inputs and outputs.
- Number of error paths.
- Missing return path where one is expected.
- Large dependency fan-in or fan-out.
- Presence or absence of nearby tests when that can be detected.

Initial visual language:

- Healthy code: calm stroke, stable ring, low visual noise.
- Risky code: broken ring, warning glyph, rougher texture, stronger contrast.
- Unknown code: muted neutral ring with inspector explanation.
- Error path: dedicated error leyline and error glyph.

### Inspector panel

Show details for the selected visual node or edge.

Acceptance criteria:

- The inspector shows the selected node name, kind, source location, and quality signals.
- The inspector can show source text in a read-only code viewer.
- The inspector does not expose fake runtime controls before runtime behavior exists.

### Sample codebase path

Keep a built-in sample so the visual workspace can be demonstrated before file import is complete.

Acceptance criteria:

- The sample uses the same visual graph contract as imported source.
- The sample is clearly labeled as sample data.

## Next

### Multi-file codebase map

Expand from one source file to a small project map.

Acceptance criteria:

- The application can show relationships between files, classes, methods, and imports.
- A user can move from a high-level codebase map into a class or method view.

### Semantic zoom

Support app-to-controller-to-method-to-helper navigation as semantic levels, not only visual scale.

Acceptance criteria:

- A user can enter a node to see a more detailed view.
- A user can return to the parent view.
- Breadcrumbs show the current location.

### Search and filtering

Help users find symbols and hide low-value detail.

Acceptance criteria:

- A user can search for a symbol by name.
- A user can filter by node kind, quality state, or dependency direction.

### Code quality rules configuration

Allow the user to tune what counts as risky code.

Acceptance criteria:

- Quality rules are visible and editable.
- Rule changes update the visual state.
- Rule output remains explainable in the inspector.

## Later

### Source editing

Allow changes to source code from the visual workspace.

Reason to defer:

- Editing requires a stronger source graph, reversible transformations, and conflict handling.

### Collaborative editing

Allow multiple users to inspect or edit the same visual code map.

Reason to defer:

- Collaboration adds identity, synchronization, persistence, and conflict concerns before the core visual language is proven.

### Runtime debugging view

Connect runtime traces to the visual graph.

Reason to defer:

- Runtime data needs instrumentation and a stable graph identity model first.

### Canvas or Web Graphics Library renderer

Move beyond Scalable Vector Graphics only if rendering pressure is measured.

Reason to defer:

- Scalable Vector Graphics keeps glyphs inspectable and easier to style while the visual grammar changes.
