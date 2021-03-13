from kivy.uix.layout import Widget
from kivy.properties import ObjectProperty


class StartBlock(Widget):
    connection = ObjectProperty(None, allownone=True)
