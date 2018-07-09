from kivy.uix.gridlayout import GridLayout
from kivy.uix.label import Label


class MainMenu(GridLayout):
    def __init__(self, **kwargs):
        # For whatever reason I can't use Python3 super().__init__ call.
        super(MainMenu, self).__init__(**kwargs)
        self.cols = 1
        self.add_widget(Label(text="Start new Project"))
        self.add_widget(Label(text="Continue current Project"))
