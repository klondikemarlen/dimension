from kivy.uix.widget import Widget
from kivy.properties import ObjectProperty


class CodeEditor(Widget):
    block = ObjectProperty(None)

    # def on_touch_move(self, touch):
    #     touch.ud['line'].points += [touch.x, touch.y]
