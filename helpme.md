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

## To add a new Component:
1. make a new python package e.g. dimension/start_block
2. add a 'dimension/start_block/view.kv' file.
    ```python
    <StartBlock>:
        pass  # some code here.
    ```
3. add a 'dimension/start_block/widget.py' file.
    ```python
    from kivy.uix.layout import Widget
    
    
    class StartBlock(Widget):
        pass
    ```
4. Add an include statement in dimenstion/dimension.kv
`#:include dimension/start_block/view.kv`
5. Add an import statement in 'dimension/__init__.py'
`from dimension.start_block.widget import StartBlock`

**NOTE: the order of the includes and imports matter!**
