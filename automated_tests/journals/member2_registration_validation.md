# Member 2 Testing Journal: Registration/Input Validation Testing

Functionality Tested: Registration form validation

Objective of the Test: Verify that the registration form shows an error when the password and confirm password fields do not match.

Steps/Procedure:
1. Open the local React app.
2. Click Sign in.
3. Switch to Sign up mode.
4. Enter first name, last name, email, password, and a different confirm password.
5. Submit the form.
6. Check if the validation message appears.

Test Data/Input:
- First name: `Test`
- Last name: `User`
- Email: `invalid-registration@example.com`
- Password: `123456`
- Confirm password: `654321`

Expected Result: The form shows `Passwords do not match.`

Actual Result: To be filled after running the test. See `logs/registration_validation_log.txt`.

Status: Passed/Failed after actual run.

Screenshot/Evidence Placeholder: `screenshots/registration_validation_test_validation_message.png`

Issues Encountered: UI validation can change if the auth modal text or CSS classes are renamed.

Improvements Made: Used real field IDs from the registration form.

Lessons Learned: Negative tests help confirm that invalid user input is blocked early.
