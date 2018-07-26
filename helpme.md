Tips:
- To test the app run in Windows PowerShell or CMD.

- To build and deploy the app run `buildozer` in Bash.
- Widgets events bubble from bottom up!
```python
class MyWidget(Widget):
    def on_touch_down(self, touch):
        If <some_condition>:
            # Do stuff here and kill the event
            return True
        else:
            return super(MyWidget, self).on_touch_down(touch)


class MyWidget(Label):
    def on_touch_down(self, touch, after=False):
        if after:
            print "Fired after the event has been dispatched!"
        else:
            Clock.schedule_once(lambda dt: self.on_touch_down(touch, True))
            return super(MyWidget, self).on_touch_down(touch)
```
