from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.properties import ObjectProperty, StringProperty
from kivy.clock import Clock


class InputLabel(BoxLayout):
    label = ObjectProperty(None, allownone=True)
    input = ObjectProperty(None, allownone=True)
    name = StringProperty('')

    def on_text(self, instance, value):
        self.name = value

    def set_focus(self, dt):
        if self.input is not None:
            self.input.focus = True

    def on_lose_focus(self, instance, value):
        if not value:
            self.switch_mode()

    def switch_mode(self):
        if self.label is not None:
            print("Switching to TextInput mode.")
            self.remove_widget(self.label)
            self.label = None

            input = SwappableInput(text=self.name, multiline=False)
            input.bind(focus=self.on_lose_focus)
            self.add_widget(input)
            self.input = input
            Clock.schedule_once(self.set_focus, 0.2)
        elif self.input is not None:
            print("Switching to Label mode.")
            self.name = self.input.text
            self.remove_widget(self.input)
            self.input = None

            label = SwappableLable(text=self.name, size=self.size, size_hint=self.size_hint)
            self.add_widget(label)
            self.label = label


class SwappableInput(TextInput):
    pass


class SwappableLable(Label):
    pass
