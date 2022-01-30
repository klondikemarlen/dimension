# Design:

**Q**: What data does my application process?

**A**: My application is a code editor. It processes and manipulates computer code.

**Q**: How do I visually represent that data?

**A**: I represent it via "blocks". Initially 2D with each block representing a piece of text code. This will be one to one at first. Blocks should only be able to snap together if it doesn't create a syntax error.

**Q**: How does the user interact with that data?

**A**: The user interacts with the code block by dragging and dropping them. Possibly double tapping or shaking the device. Long presses might do something too. I am initially planning for this program to facilitate coding on a small touch enabled device such as a smartphone.

## Raw Concept Notes:
- Make these into Issues on GitHub.

## Minimal Viable Product

Stage 1: allow mapping the files in a project (at the file system level) into a 3 dimentional format
- file types represented by icons or shapes or colours
- file size represented as block size
- block layout is autofit for convenience and layout is remembered
- layout can be manually tweak and is remembered

Stage 2: allow adding custom linkages between files to represent connectivity outside of the file system
- an html file could be linked to an image asset or to another html file
- layout is remembered and written to an easily editable format
- it is possible to edit the layout format manually and have this show up in the visual editor

Stage 3: add a tool for secondary layout auto-detection of html files
