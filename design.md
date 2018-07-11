### Design:

**Q**: What data does my application process?

**A**: My application is a code editor. It processes and manipulates computer code.

**Q**: How do I visually represent that data?

**A**: I represent it via "blocks". Initially 2D with each block representing a piece of text code. This will be one to one at first. Blocks should only be able to snap together if it doesn't create a syntax error.

**Q**: How does the user interact with that data?

**A**: The user interacts with the code block by dragging and dropping them. Possibly double tapping or shaking the device. Long presses might do something too. I am initially planning for this program to facilitate coding on a small touch enabled device such as a smartphone.

#### Concept Notes:
1. I need to figure out how to make blocks snap to a particular location?
2. I need to figure out how to make blocks snap to nearest block? "Nudge" when overlapping?
3. I need to design a Start block location ... maybe a immovable start block or indent?
4. I need to add editable labeling to blocks ... and maybe editable colours?
5. I need a side drawer to create multiple types of blocks. Open when swiping in from the left ... close by swiping other way or double tapping.
6. You should be able to select a block type to create. Then create it either via Double Tapping in the main area ... or dragging from sidebar into main area.
7. I need mulple types of blocks?
8. I need to work out how to compose Big Blocks from smaller ones.
9. I need to convert current on screen blocks to code.
10. I need to work out how to Reference Blocks without cloning them? e.g. `bar = foo()` 'foo' should be a reference to a function 'foo' defined elsewhere not a copy of that function. Any changes made locally should change the main version.
11. I need to work out how to build using modular design with Kivy! I'm thinking I could use 'main.py' as a stub?
12. Make these into Issues on GitHub?
