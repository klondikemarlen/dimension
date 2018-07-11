from kivy.uix.widget import Widget
from kivy.uix.gridlayout import GridLayout
from kivy.properties import BooleanProperty


class CodeBlock(Widget):
    selected = BooleanProperty(False)

    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos):
            self.selected = True
            return True

    def on_touch_up(self, touch):
        self.selected = False

    def on_touch_move(self, touch):
        if self.selected:
            self.center = touch.x, touch.y
