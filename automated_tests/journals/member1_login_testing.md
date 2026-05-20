# Member 1 Testing Journal: Login Testing

Functionality Tested: Login functionality

Objective of the Test: Verify that a registered user can open the login modal, enter credentials, and reach the logged-in account state.

Steps/Procedure:
1. Open the local React app.
2. Click the Sign in button.
3. Enter test email and password.
4. Submit the login form.
5. Check if the user account/avatar button appears.

Test Data/Input:
- Email: `angela@gmail.com`
- Password: `12345678`

Expected Result: The user logs in successfully and the account menu/avatar appears.

Actual Result: To be filled after running the test. See `logs/login_test_log.txt`.

Status: Passed/Failed after actual run.

Screenshot/Evidence Placeholder: `screenshots/login_test_before_submit.png`, `screenshots/login_test_after_login.png`

Issues Encountered: The test needs the `angela@gmail.com` customer account to exist in the local database.

Improvements Made: Added logging and screenshots before and after form submission.

Lessons Learned: Login tests are useful because many customer features depend on a valid session.
