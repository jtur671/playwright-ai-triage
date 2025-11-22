Title: Login - valid credentials (the-internet.herokuapp.com)

Base URL: https://the-internet.herokuapp.com

As a user, I want to log in with valid credentials so I can access the secure area.

Acceptance criteria:
- Navigate to `/login`
- Fill in the username `tomsmith`
- Fill in the password `SuperSecretPassword!`
- Click the Login button
- Expect to be redirected to `/secure`
- Expect the success flash message to be visible and contain the text: `You logged into a secure area!`
