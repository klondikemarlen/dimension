# __version__ = "0.1"
import kivy
from kivy.app import App

# Import components
import main_menu.widget

kivy.require("1.10.0")  # replace with current kivy version!


class Dimension(App):
    def build(self):
        return main_menu.widget.MainMenu()


if __name__ == "__main__":
    Dimension().run()
