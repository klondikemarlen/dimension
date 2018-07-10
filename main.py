# __version__ = "0.1"
import kivy
from kivy.app import App

# Import components
import main_menu.widget
import code_block.widget
import code_editor.widget

kivy.require("1.10.0")  # replace with current kivy version!


class DimensionApp(App):
    def build(self):
        # return main_menu.widget.MainMenu()
        return code_editor.widget.CodeEditor()


if __name__ == "__main__":
    DimensionApp().run()
