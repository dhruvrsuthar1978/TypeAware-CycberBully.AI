# TODO: Add Forgot Password Link and Password Validation

## Pending Tasks
- [x] Add "Forgot Password?" link to Login.jsx links section
- [x] Create ForgotPassword.jsx page with email input form
- [x] Add route for /forgot-password in App.jsx
- [x] Update Signup.jsx to include password strength validation (at least 1 uppercase, 1 special char, 3+ numbers)
- [x] Update backend/validators/authValidators.js to enforce new password requirements
- [ ] Test the changes to ensure validation works and links navigate correctly

## Files to Edit
- frontend/src/pages/Login.jsx
- frontend/src/pages/ForgotPassword.jsx (new)
- frontend/src/App.jsx
- frontend/src/pages/Signup.jsx
- backend/validators/authValidators.js

## Password Requirements
- At least one capital letter (A-Z)
- At least one special character (!@#$%^&*)
- At least three numbers (0-9)
