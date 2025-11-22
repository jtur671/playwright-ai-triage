Title: Add/Remove Elements - wrong expectations (the-internet.herokuapp.com)

Base URL: https://the-internet.herokuapp.com

As a user, I want to add and remove elements so I can manage the list of Delete buttons.

Acceptance criteria (intentionally incorrect to force a failing test):
- Navigate to `/add_remove_elements/`
- Click the `Add Element` button two times
- Expect there to be exactly **three** `Delete` buttons visible
- Click one of the `Delete` buttons
- Expect exactly **two** `Delete` buttons to remain visible

