from kivy.app import App

# Import components
# import dimension.main_menu.widget
# import dimension.code_block.widget
from dimension.input_label.widget import InputLabel
from dimension.code_block.widget import CodeBlock
from dimension.start_block.widget import StartBlock
from dimension.code_editor.widget import CodeEditor

from kivy.config import Config
# Config.read("config.ini")
Config.set('postproc', 'double_tap_time', '350')
# Config.write()


class DimensionApp(App):
    def build(self):
        # return main_menu.widget.MainMenu()
        return CodeEditor()
