# Member 3 Testing Journal: Product CRUD Testing

Functionality Tested: Admin product management page and product search/read behavior

Objective of the Test: Verify that an admin/staff user can access the products area and search the product list.

Steps/Procedure:
1. Open the local React app.
2. Log in using an admin or staff test account.
3. Navigate to `/admin?section=products`.
4. Wait for the product table.
5. Search for a sample product keyword.
6. Confirm that the product table updates or shows a no-products message.

Test Data/Input:
- Admin email: `hb@gmail.com`
- Admin password: `12345678`
- Search keyword: `fridge`

Expected Result: Admin products page opens and the product list/search area works. The keyword `fridge` should match the seeded product `Smart Fridge Master 3000`.

Actual Result: To be filled after running the test. See `logs/product_crud_log.txt`.

Status: Passed/Failed after actual run.

Screenshot/Evidence Placeholder: `screenshots/product_crud_test_products_page.png`, `screenshots/product_crud_test_product_search.png`

Issues Encountered: Full create/update/delete automation needs stable product modal selectors and safe test data.

Improvements Made: Added TODO comments for extending the script to full product create, update, and delete steps.

Lessons Learned: CRUD tests need careful test data so they do not damage real product records.
