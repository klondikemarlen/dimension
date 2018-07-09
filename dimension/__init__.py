# __version__ = "0.1"
import kivy
from kivy.app import App
from kivy.uix.gridlayout import GridLayout
from kivy.uix.label import Label
kivy.require("1.10.0")  # replace with current kivy version!


class MainMenu(GridLayout):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.cols = 1
        self.add_widget(Label(text="Start new Project"))
        self.add_widget(Label(text="Continue current Project"))


class Dimension(App):
    def build(self):
        return MainMenu()


if __name__ == "__main__":
    Dimension().run()
