from kivy.uix.widget import Widget
# from kivy.uix.floatlayout import FloatLayout
from kivy.properties import ObjectProperty
from code_block.widget import CodeBlock


class CodeEditor(Widget):
    block = ObjectProperty(None)

    def on_touch_down(self, touch):
        for child in self.children:
            if child.on_touch_down(touch):
                break
        if touch.is_double_tap:
            block = CodeBlock()
            block.center = (touch.x, touch.y)
            self.add_widget(block)
