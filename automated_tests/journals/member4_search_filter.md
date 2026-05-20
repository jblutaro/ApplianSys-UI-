# Member 4 Testing Journal: Search/Filter Testing

Functionality Tested: Product search/filtering

Objective of the Test: Verify that searching from the header redirects to the search results page and shows results or a no-results state.

Steps/Procedure:
1. Open the local React app.
2. Type a keyword into the header search box.
3. Press Enter.
4. Confirm the URL contains the search query.
5. Confirm the search results heading appears.

Test Data/Input:
- Search keyword: `fridge`

Expected Result: The search results page appears and displays matching products or a proper no-results message. The keyword `fridge` should match the seeded product `Smart Fridge Master 3000`.

Actual Result: To be filled after running the test. See `logs/search_filter_log.txt`.

Status: Passed/Failed after actual run.

Screenshot/Evidence Placeholder: `screenshots/search_filter_test_before_search.png`, `screenshots/search_filter_test_results.png`

Issues Encountered: Search results depend on product data from the local database.

Improvements Made: The script accepts either real results or the app's no-products-found message.

Lessons Learned: Search tests should cover both matching results and empty result behavior.
