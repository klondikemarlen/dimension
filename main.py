# __version__ = "0.1"
import kivy
import kivy.app
import kivy.uix.label
kivy.require("1.10.0")  # replace with current kivy version!


class TwoD(kivy.app.App):
    def build(self):
        return kivy.uix.label.Label(text="Hello World")


if __name__ == "__main__":
    TwoD().run()
