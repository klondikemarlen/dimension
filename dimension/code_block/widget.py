import pdb

from kivy.uix.widget import Widget
from kivy.uix.scatter import Scatter
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.gridlayout import GridLayout
from kivy.properties import BooleanProperty, ReferenceListProperty, NumericProperty, ObjectProperty


class CodeBlock(FloatLayout):
    scatter = ObjectProperty(None)
    selected = BooleanProperty(False)
    default_width = NumericProperty(0)
    default_height = NumericProperty(0)
    default_size = ReferenceListProperty(default_width, default_height)
    scale_factor = NumericProperty(0)

    def on_touch_down(self, touch):
        print("touch down")
        if self.collide_point(*touch.pos):
            print("Selected:", self.name)
            self.selected = True
        else:
            self.selected = False
        return super(CodeBlock, self).on_touch_down(touch)

    def on_touch_up(self, touch):
        print("touch up")
        self.selected = False
        return super(CodeBlock, self).on_touch_up(touch)

    # def on_touch_move(self, touch):
    #     print("touch move")
    #     if super(CodeBlock, self).on_touch_move(touch):
    #         if self.selected:
    #             self.center = self.center_x + touch.dx, self.center_y + touch.dy
    #     return super(CodeBlock, self).on_touch_move(touch)

    def apply_transform(self, *args, **kwargs):
        print("apply_transform")
        self.scatter.apply_transform(*args, **kwargs)
