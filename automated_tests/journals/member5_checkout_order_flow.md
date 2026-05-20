# Member 5 Testing Journal: Checkout/Order Flow Testing

Functionality Tested: Customer cart and checkout/order flow

Objective of the Test: Verify that a logged-in customer can reach the cart page and open checkout when cart items are available.

Steps/Procedure:
1. Open the local React app.
2. Log in using a customer test account.
3. Navigate to `/cart`.
4. Confirm the cart page loads.
5. If a checkout button is available, click it.
6. Confirm the checkout modal appears.

Test Data/Input:
- Customer email: `angela@gmail.com`
- Customer password: `12345678`
- Existing cart item is recommended for full checkout evidence.

Expected Result: The cart page loads. If the cart has items, the checkout modal opens successfully.

Actual Result: To be filled after running the test. See `logs/checkout_order_log.txt`.

Status: Passed/Failed after actual run.

Screenshot/Evidence Placeholder: `screenshots/checkout_order_flow_test_cart_page.png`, `screenshots/checkout_order_flow_test_checkout_modal.png`

Issues Encountered: Full checkout testing depends on a customer account with items in the cart.

Improvements Made: The test still records cart access evidence even if the cart is empty.

Lessons Learned: Checkout tests often need prepared data before running automation.
