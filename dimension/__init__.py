from kivy.app import App

# Import components
# import dimension.main_menu.widget
# import dimension.code_block.widget
from dimension.code_editor.widget import CodeEditor


class DimensionApp(App):
    def build(self):
        # return main_menu.widget.MainMenu()
        return CodeEditor()
