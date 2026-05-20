# JavaScript Automated Tests for E-commerce System

This folder contains the automated testing activity for a React + Vite frontend and Node.js + Express backend e-commerce project.

The project is a solo project, but this folder is structured as if 5 different member contributions were assigned for academic documentation. The member labels are only contribution labels.

## Tools Used

- JavaScript
- Node.js
- Playwright browser automation
- React + Vite app running locally
- Express backend running locally

## Install Test Dependencies

From the project root:

```bash
npm install --prefix automated_tests
npx --prefix automated_tests playwright install chromium
```

Start the app before running browser tests:

```bash
npm run dev
```

Default app URL:

```text
http://localhost:5173
```

You can change the URL at the top of each test script:

```js
const BASE_URL = "http://localhost:5173";
```

## Run Tests

From the project root:

```bash
npm run test
```

The command opens a simple menu:

1. Run Login Test
2. Run Registration/Input Validation Test
3. Run Product CRUD Test
4. Run Search/Filter Test
5. Run Checkout/Order Flow Test
6. Run All Tests

You can also run a single script directly:

```bash
node automated_tests/test_login.mjs
```

Or from inside this folder:

```bash
npm run test:login
```

## Test Scripts

| Script | Assigned Contribution | Main Feature |
| --- | --- | --- |
| `test_login.mjs` | Member 1 | Login functionality |
| `test_registration_validation.mjs` | Member 2 | Registration/input validation |
| `test_product_crud.mjs` | Member 3 | Product CRUD/admin products |
| `test_search_filter.mjs` | Member 4 | Search/filtering |
| `test_checkout_order_flow.mjs` | Member 5 | Checkout/order flow |

## Logs and Screenshots

Each test writes a result log inside `logs/`.

Screenshots are saved inside `screenshots/` when possible. These can be attached as evidence for the laboratory activity.

## Notes

- The current customer test account is `angela@gmail.com` / `12345678`.
- The current admin test account is `hb@gmail.com` / `12345678`.
- The current sample product keyword is `fridge`, based on the seeded product name `Smart Fridge Master 3000`.
- Product CRUD and checkout tests need prepared local data such as valid accounts and cart items.
- These scripts are intentionally simple and readable. The goal is to apply automated testing concepts, not build a perfect enterprise testing framework.
