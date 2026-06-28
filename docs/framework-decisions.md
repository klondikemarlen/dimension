# Dimension Framework Decisions

## Current Decision

Dimension should keep Vue as the browser application shell for now and build a small Dimension-specific workspace kernel instead of adopting a large editor framework or switching to React only for library availability.

The workspace kernel is not a general-purpose public library at first. It is project code that owns pan, zoom, selection, hit testing, keyboard focus, graph-to-glyph layout, and inspector state for Dimension's visual language. Extract it into a reusable library only after the product proves which abstractions are real.

- **Primary language:** TypeScript across browser and server code.
- **Browser application shell:** Vue 3 and Vite remain the preferred shell because the project already uses them and the user prefers Vue.
- **Workspace kernel:** Custom Vue composables and rendering components for viewport state, pointer gestures, selection, graph layout, and accessibility.
- **Custom visual language:** Scalable Vector Graphics first, with D3 used for layout and shape utilities.
- **Interaction:** browser Pointer Events for pen, touch, and mouse gestures.
- **Server application:** Express 5 and TypeScript are acceptable for the source-import service.
- **Source import:** `ts-morph` remains the right first parser for converting uploaded TypeScript into Dimension graph data.
- **Source viewer:** Monaco Editor is the preferred read-only source inspection companion after the visual graph contract is stable.
- **Rust and WebAssembly:** Defer until a measured parser, analysis, or layout bottleneck appears. Do not use Rust or WebAssembly for the browser shell.

## Why This Stack

Dimension needs a semantic graph workspace with a paint-program feel. Generic node editors are useful references, but Dimension's core interaction is not a stock flowchart. The product needs custom glyphs, rings, leylines, semantic zoom, quality markers, and source-aware inspection.

Building a small workspace kernel is the better slow solution because the current required primitives are limited: viewport transform, pointer capture, selection state, edge path geometry, node hit boxes, focus management, and inspector updates. Pulling in a full graph editor too early risks fighting its data model and visual defaults.

Vue remains a good fit because the application shell and existing component structure are already Vue, while the hard part is not React versus Vue; it is the graph contract and visual grammar. Vue's composition model is sufficient for the workspace kernel if the mutable interaction state is kept explicit and small.

D3 still fits the visual goal because Dimension needs custom topology, ring layouts, scaled links, and data-bound visual states rather than boxed diagram nodes alone. D3 should provide geometry and scale utilities; Dimension should own interaction semantics and graph-to-spell layout.

Scalable Vector Graphics remains the first renderer because it keeps glyphs inspectable, accessible, and easy to style while the grammar changes. Canvas or WebGL rendering should only be introduced when the Scalable Vector Graphics implementation has measured rendering pressure.

Monaco Editor should be used as an inspector companion, not as the visual base. It is useful for read-only source preview, source spans, and later diff views.

Rust and WebAssembly are promising for later source analysis, parsing, or layout workers. Oxc is a Rust JavaScript and TypeScript parser, and SWC exposes browser WebAssembly packages. Those tools become interesting when Dimension needs fast client-side parsing or large-codebase analysis. They should not be the first user interface foundation because WebAssembly complements JavaScript rather than replacing browser application code.

## Frameworks Not Chosen For The First Minimum Viable Product

- **React Flow:** mature and useful as a reference point, but adopting it would require switching the browser shell to React before Dimension has proven its own visual grammar.
- **Vue Flow:** closer to the current stack and worth revisiting if custom pan, zoom, and selection become a distraction, but it should not own the visual model before the custom workspace kernel is tried.
- **Eclipse Theia:** too heavy for the first milestone. It is a full integrated development environment framework, while Dimension first needs to prove the visual graph language.
- **Blockly:** strong for block programming, but Dimension is currently a codebase visualization tool, not a block-language authoring tool.
- **Excalidraw:** strong open-source paint-like canvas, but it is less directly aligned with a semantic source graph data model. It can inspire spatial interaction, but it should not own the source graph.
- **tldraw:** strong infinite-canvas user experience, but current production use is source-available and license-key based rather than classic open-source. It should not be the default base unless that licensing tradeoff is accepted.

## Minimum Viable Product Framework Slice

The next implementation slice should build the smallest custom workspace kernel that can replace the static `SpellCanvas` without committing to a third-party graph editor:

1. Split the current `SpellCanvas` into graph data, layout helpers, viewport state, glyph rendering, edge rendering, and inspector state.
2. Add pan and zoom with browser Pointer Events.
3. Add node and edge selection with keyboard-focusable Scalable Vector Graphics elements.
4. Render the existing sample graph through the new primitives.
5. Keep Dimension glyphs, rings, leylines, parchment styling, and quality markers.
6. Keep the workspace read-only until the source graph contract is stable.
7. Compare the result against Vue Flow only if custom interaction work starts dominating the source-backed editor milestone.

## Legacy Content Policy

Remove framework starter and demonstration content, including Vue logo chrome, `HelloWorld`, `TheWelcome`, and placeholder Home and About views. Keep useful project code even if the surrounding framework changes: TypeScript parser code, source graph ideas, visual fixture data, styling direction, and local development helpers.

Do not treat package-lock peer metadata or commented compatibility snippets as legacy application content unless they affect the running application.
