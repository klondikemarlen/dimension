import pdb

from kivy.uix.widget import Widget
from kivy.uix.textinput import TextInput
from kivy.uix.scatter import Scatter
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.gridlayout import GridLayout
from kivy.properties import BooleanProperty, ReferenceListProperty, NumericProperty, ObjectProperty


class CodeBlock(FloatLayout):
    """Basic code block entity.

    NOTE: the codeblock never moves from its original location.
    Only its Scatter object moves. Therefore all collision detection must be
    against the Scatter object. I will hopefully fix that at some point ...
    """
    scatter = ObjectProperty(None)
    input_label = ObjectProperty(None)
    selected = BooleanProperty(False)
    default_width = NumericProperty(0)
    default_height = NumericProperty(0)
    default_size = ReferenceListProperty(default_width, default_height)
    scale_factor = NumericProperty(0)

    def on_touch_down(self, touch):
        if self.scatter.collide_point(*touch.pos):
            print("Touching a block!")
            if touch.is_double_tap:
                self.input_label.switch_mode()
                return True
            self.selected = True
        else:
            self.selected = False
        return super(CodeBlock, self).on_touch_down(touch)

    def on_touch_up(self, touch):
        self.selected = False
        return super(CodeBlock, self).on_touch_up(touch)

    # def on_touch_move(self, touch):
    #     print("touch move")
    #     if super(CodeBlock, self).on_touch_move(touch):
    #         if self.selected:
    #             self.center = self.center_x + touch.dx, self.center_y + touch.dy
    #     return super(CodeBlock, self).on_touch_move(touch)

    def apply_transform(self, *args, **kwargs):
        self.scatter.apply_transform(*args, **kwargs)
