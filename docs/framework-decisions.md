# Dimension Framework Decisions

## Current decision

Dimension should stay on the existing split TypeScript stack and add D3 as the visual-layout layer:

- **Web app:** Vue 3 + Vite + TypeScript.
- **Routing:** Vue Router, retained for future editor/workspace routes.
- **Visualization:** SVG-first rendering driven by D3 layout/shape utilities. Canvas/WebGL remains a later optimization after the glyph grammar and interaction model stabilize.
- **Interaction:** browser Pointer Events for pen/touch/mouse gestures.
- **API:** Express 5 + TypeScript.
- **Source import:** `ts-morph` for converting uploaded TypeScript into Dimension graph data.

## Why this stack

Vue and Vite are already installed and configured, so replacing them would slow the reboot without proving the visual language. D3 fits the project goal better than a generic diagramming framework because Dimension needs custom topology, ring layouts, scaled links, and data-bound visual states rather than boxed UML nodes.

SVG is the first renderer because it keeps glyphs inspectable, accessible, and easy to style while the grammar changes. Canvas or WebGL should only be introduced when the SVG implementation has measurable rendering pressure.

## Legacy content policy

Remove framework starter/demo content, including Vue logo chrome, `HelloWorld`, `TheWelcome`, and the placeholder Home/About views. Keep the actual framework baseline: Vue, Vite, TypeScript, Vue Router, Express, multer, and `ts-morph`.

Do not treat package-lock peer metadata or commented compatibility snippets as legacy application content unless they affect the running app.
