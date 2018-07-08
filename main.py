# __version__ = "0.1"
import kivy
kivy.require("1.10.0")  # replace with current kivy version!

from kivy.app import App
from kivy.uix.label import Label


class TwoD(App):
    def build(self):
        return Label(text="Hello World")


if __name__ == "__main__":
    TwoD().run()
