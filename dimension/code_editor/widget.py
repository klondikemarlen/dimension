import pdb

from kivy.uix.widget import Widget
# from kivy.uix.floatlayout import FloatLayout
from kivy.properties import ObjectProperty, NumericProperty
from dimension.code_block.widget import CodeBlock


class CodeEditor(Widget):
    selected_block = ObjectProperty(None, allownone=True)
    grid_scale = NumericProperty(0)
    half_scale = NumericProperty(0)
    block_scale = NumericProperty(0)

    def on_touch_down(self, touch):
        if touch.is_double_tap:
            block = CodeBlock(name="Block {}".format(len(self.children)+1), scale_factor=self.block_scale)
            block.center = touch.pos
            self.add_widget(block)

        for child in self.children:
            if child.on_touch_down(touch):
                self.selected_block = child
                break

    def on_touch_up(self, touch):
        # Prevent intersection/blocks can't stop on top of each other?
        if self.selected_block:
            self.snap_to_grid(self.selected_block)

            # work out how to prevent overlap ...
            unselected_children = (child for child in self.children if child is not self.selected_block)
            for child in unselected_children:
                if self.selected_block.collide_widget(child):
                    print(child.name)
                    # Decide whether to nudge both or just the selected or child?

        for child in self.children:
            if child.on_touch_up(touch):
                break

        self.selected_block = None

    def snap_to_grid(self, child):
        x, y = child.pos

        # Snap child to grid positions.
        # There is probably a better way?
        x_grid = x // self.grid_scale
        y_grid = y // self.grid_scale
        x = x_grid * self.grid_scale if x % self.grid_scale < self.half_scale else (x_grid + 1) * self.grid_scale
        y = y_grid * self.grid_scale if y % self.grid_scale < self.half_scale else (y_grid + 1) * self.grid_scale

        # Keep child inside of border
        if x + child.width > self.width:
            x = self.width - child.width
        if x < 0:
            x = 0
        if y + child.height > self.height:
            y = self.height - child.height
        if y < 0:
            y = 0
        child.pos = x, y
