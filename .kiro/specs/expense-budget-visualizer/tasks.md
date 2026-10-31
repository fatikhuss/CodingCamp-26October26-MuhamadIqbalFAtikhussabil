# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a single-page, client-side web application using plain HTML, CSS, and Vanilla JavaScript. No build step is required — the app opens directly in a browser. All state lives in an in-memory `transactions` array and is persisted to `localStorage`. Chart.js (CDN) renders the spending pie chart. Tests are written with Vitest + jsdom for unit tests and fast-check for property-based tests.

## Tasks

- [x] 1. Project scaffolding and core data structures
  - Create `index.html` with the HTML boilerplate, viewport meta tag (`width=device-width, initial-scale=1`), Chart.js CDN `<script>` tag, and placeholder sections for all UI regions (form, list, balance, chart, storage banner)
  - Create `style.css` as an empty linked stylesheet
  - Create `app.js` as an empty linked script (deferred)
  - Define the `Transaction` typedef and `FieldErrors` shape as JSDoc comments in `app.js`
  - Declare the in-memory application state object `{ transactions: [], chart: null }` in `app.js`
  - Set up a Vitest + jsdom test configuration (`vitest.config.js` or `package.json` `test` script) and install `vitest`, `jsdom`, and `fast-check` as dev dependencies
  - _Requirements: 6.4, 5.2_

- [x] 2. Storage adapter
  - [x] 2.1 Implement `loadFromStorage()` in `app.js`
    - Wrap `localStorage.getItem("transactions")` in `try/catch`
    - Parse JSON; if result is not an array, return `null`
    - Return the parsed array on success, `null` on any failure
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 2.2 Implement `saveToStorage(transactions)` in `app.js`
    - Wrap `JSON.stringify` + `localStorage.setItem` in `try/catch`
    - Catch `QuotaExceededError` and other exceptions; return `false` on failure, `true` on success
    - _Requirements: 5.1, 5.3_
  - [ ]* 2.3 Write property test for serialization round-trip (Property 1)
    - **Property 1: Serialization round-trip preserves transaction fields**
    - Generate arbitrary `Transaction[]` arrays with fast-check; serialize with `JSON.stringify`, deserialize with `JSON.parse`, assert field-by-field equality for `id`, `name`, `amount`, `category`
    - `// Feature: expense-budget-visualizer, Property 1: Serialization round-trip preserves transaction fields`
    - **Validates: Requirements 5.5**
  - [ ]* 2.4 Write unit tests for storage adapter
    - Mock `localStorage`; test `loadFromStorage` returns `null` on corrupt JSON, returns `null` on non-array JSON, returns array on valid data
    - Test `saveToStorage` returns `false` when `localStorage` throws, returns `true` on success
    - _Requirements: 5.2, 5.3, 5.4_

- [ ] 3. App initialization and error banner
  - [x] 3.1 Implement app initialization in `app.js`
    - On `DOMContentLoaded`, call `loadFromStorage()`; if result is `null` show `#storage-banner` with the appropriate message and set `transactions` to `[]`; otherwise set `transactions` to the loaded array
    - Add `showBanner(message)` and `hideBanner()` helpers that toggle the `hidden` attribute on `#storage-banner`
    - _Requirements: 2.4, 2.5, 5.2, 5.3, 5.4_
  - [ ]* 3.2 Write unit tests for app initialization
    - Test that a corrupt storage value triggers banner display and empty array initialization
    - Test that a valid storage value populates `transactions` without showing the banner
    - _Requirements: 2.4, 2.5, 5.3, 5.4_

- [x] 4. Input form — validation and submission
  - [x] 4.1 Implement `validateForm()` in `app.js`
    - Read `#item-name`, `#item-amount`, `#item-category` values
    - Return `{ errors }` if name is empty/whitespace-only, amount is non-numeric or outside `[0.01, 999999999.99]`, or category is unselected
    - Return `{ transaction }` with a new `Transaction` object (use `crypto.randomUUID()` with `Date.now() + Math.random()` fallback) on valid input
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 4.2 Write property test for whitespace-only name rejection (Property 2)
    - **Property 2: Whitespace-only names are rejected**
    - Generate arbitrary strings composed entirely of whitespace characters; pass through `validateForm` logic; assert rejection and no transaction created
    - `// Feature: expense-budget-visualizer, Property 2: Whitespace-only names are rejected`
    - **Validates: Requirements 1.3**
  - [ ]* 4.3 Write property test for amount boundary enforcement (Property 3)
    - **Property 3: Amount boundary enforcement**
    - Generate numbers outside `[0.01, 999999999.99]` (negative, zero, above max, NaN-coerced strings); assert all rejected by `validateForm`
    - `// Feature: expense-budget-visualizer, Property 3: Amount boundary enforcement`
    - **Validates: Requirements 1.3**
  - [ ]* 4.4 Write unit tests for validator
    - Test every boundary: name (empty, whitespace-only `"   "`, 1 char, 100 chars, 101 chars), amount (0, 0.009, 0.01, 999999999.99, 1000000000, NaN, `"abc"`), category (unselected, each of Food/Transport/Fun)
    - _Requirements: 1.1, 1.3_
  - [x] 4.5 Implement form submission handler in `app.js`
    - Attach `submit` listener to `#expense-form`; call `validateForm()`
    - On errors: display per-field inline error messages in `#err-name`, `#err-amount`, `#err-category`; do not add transaction
    - On success: clear all error spans, call `addTransaction(transaction)`, call `resetForm()`
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 4.6 Implement `resetForm()` in `app.js`
    - Reset `#item-name` to `""`, `#item-amount` to `""`, `#item-category` to the default `""` placeholder option
    - _Requirements: 1.4_

- [x] 5. Checkpoint — form and storage working end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Transaction list rendering
  - [x] 6.1 Implement `renderList(transactions)` in `app.js`
    - Clear `#transaction-list`; if array is empty show `#empty-msg` and hide the list; otherwise hide `#empty-msg` and render list items in reverse-chronological order (index 0 first)
    - Each `<li>` has `data-id`, spans for `.tx-name`, `.tx-amount`, `.tx-category`, and a delete `<button class="delete-btn" aria-label="Delete <name>">✕</button>`
    - _Requirements: 2.1, 2.2, 2.6_
  - [x] 6.2 Implement delete handler using event delegation on `#transaction-list`
    - Read `data-id` from the closest `<li>`; call `deleteTransaction(id)`
    - _Requirements: 2.3_
  - [ ]* 6.3 Write unit tests for list renderer
    - Test empty array renders `#empty-msg` and no `<li>` elements
    - Test single transaction renders one `<li>` with correct name, amount, category
    - Test multiple transactions render in reverse-chronological order
    - _Requirements: 2.1, 2.6_

- [x] 7. Balance display
  - [x] 7.1 Implement `renderBalance(transactions)` in `app.js`
    - Sum all `transaction.amount` values; skip entries where `isNaN(parseFloat(tx.amount))` and log `console.warn` with the transaction id
    - Set `#balance-amount` inner text to the sum formatted with `toFixed(2)`
    - _Requirements: 3.1, 3.4, 3.5_
  - [ ]* 7.2 Write property test for balance sum (Property 4)
    - **Property 4: Balance reflects sum of all transactions**
    - Generate `Transaction[]` with valid numeric amounts; compute expected sum independently; assert `renderBalance` output equals `expectedSum.toFixed(2)`
    - `// Feature: expense-budget-visualizer, Property 4: Balance reflects sum of all transactions`
    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [ ]* 7.3 Write property test for malformed amounts excluded from balance (Property 8)
    - **Property 8: Malformed amounts excluded from balance**
    - Generate mixed arrays with valid and non-numeric `amount` entries; assert balance equals sum of valid amounts only
    - `// Feature: expense-budget-visualizer, Property 8: Malformed amounts excluded from balance`
    - **Validates: Requirements 3.5**
  - [ ]* 7.4 Write unit tests for balance calculation
    - Test empty array yields `"0.00"`, single entry, multiple entries, entries with malformed amounts
    - _Requirements: 3.1, 3.4, 3.5_

- [x] 8. Spending chart
  - [x] 8.1 Implement `initChart()` in `app.js`
    - Create a single Chart.js pie chart instance on `#spending-chart` with labels `['Food', 'Transport', 'Fun']`, initial data `[0, 0, 0]`, colors `['#FF6384', '#36A2EB', '#FFCE56']`, `responsive: true`, legend at bottom, and the percentage tooltip callback
    - Assign the instance to `state.chart`
    - _Requirements: 4.1, 4.5_
  - [x] 8.2 Implement `updateChart(transactions)` in `app.js`
    - Aggregate amounts by category (Food, Transport, Fun); mutate `state.chart.data.datasets[0].data` and call `state.chart.update()`
    - If all category totals are zero, hide `#spending-chart` and show `#chart-empty-msg`; otherwise show `#spending-chart` and hide `#chart-empty-msg`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 8.3 Write property test for chart percentages sum to 100 (Property 7)
    - **Property 7: Chart percentages sum to 100**
    - Generate `Transaction[]` with at least one non-zero amount per category; compute chart percentages from category totals / grand total × 100; assert sum is 100 ± 0.1
    - `// Feature: expense-budget-visualizer, Property 7: Chart percentages sum to 100`
    - **Validates: Requirements 4.1**
  - [ ]* 8.4 Write unit tests for category aggregation
    - Test all-zero input hides chart and shows empty message
    - Test amounts correctly summed per category for chart data array
    - _Requirements: 4.1, 4.4_

- [x] 9. State manager — addTransaction and deleteTransaction
  - [x] 9.1 Implement `addTransaction(transaction)` in `app.js`
    - Prepend transaction to `state.transactions` (unshift)
    - Call `saveToStorage(state.transactions)`; if it returns `false` show `#storage-banner`
    - Call `renderList`, `renderBalance`, `updateChart`
    - _Requirements: 1.2, 3.2, 4.2, 5.1_
  - [x] 9.2 Implement `deleteTransaction(id)` in `app.js`
    - Filter `state.transactions` to remove the entry with matching `id`
    - Call `saveToStorage(state.transactions)`; if it returns `false` show `#storage-banner`
    - Call `renderList`, `renderBalance`, `updateChart`
    - _Requirements: 2.3, 3.3, 4.3, 5.1_
  - [ ]* 9.3 Write property test for delete removes transaction from list and storage (Property 5)
    - **Property 5: Delete removes transaction from list and storage**
    - Generate a list with at least one transaction; pick a random entry; call `deleteTransaction`; assert the entry is absent from `state.transactions` and from the deserialized storage value
    - `// Feature: expense-budget-visualizer, Property 5: Delete removes transaction from list and storage`
    - **Validates: Requirements 2.3, 5.1**
  - [ ]* 9.4 Write property test for add transaction persists to storage (Property 6)
    - **Property 6: Add transaction persists to storage round-trip**
    - Generate a valid transaction; call `addTransaction`; deserialize `localStorage.getItem("transactions")`; assert the entry is present with matching `name`, `amount`, `category`
    - `// Feature: expense-budget-visualizer, Property 6: Add transaction persists to storage round-trip`
    - **Validates: Requirements 1.2, 5.1, 5.5**

- [x] 10. Checkpoint — all state transitions, rendering, and persistence working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Responsive and mobile-friendly layout
  - [x] 11.1 Implement responsive CSS in `style.css`
    - Single-column stack at 320px–480px; two-column layout at 481px–1024px; multi-column layout at 1025px–1920px using CSS Grid or Flexbox with appropriate `@media` queries
    - No horizontal scrollbar at any viewport width in the supported range
    - _Requirements: 6.1_
  - [x] 11.2 Implement touch target and font-size rules in `style.css`
    - At ≤480px: all interactive elements (input fields, buttons, list items) have `min-height: 44px; min-width: 44px`
    - At ≤480px: all body text and input font size set to minimum `16px` to prevent browser auto-zoom on input focus
    - _Requirements: 6.2, 6.3_
  - [ ]* 11.3 Write unit tests for viewport meta and HTML structure
    - Parse `index.html` with jsdom; assert the viewport meta tag exists with `content="width=device-width, initial-scale=1"`
    - Assert all required DOM ids are present (`#expense-form`, `#transaction-list`, `#balance-display`, `#spending-chart`, `#storage-banner`, etc.)
    - _Requirements: 6.4, 6.5_

- [x] 12. Wire everything together and final integration
  - [x] 12.1 Wire all components in the `DOMContentLoaded` handler in `app.js`
    - Call `loadFromStorage` and initialize `state.transactions`
    - Call `initChart()`
    - Call `renderList`, `renderBalance`, `updateChart` with the initial state
    - Attach the form `submit` listener and the list delete event-delegation listener
    - _Requirements: 2.4, 3.4, 4.1, 5.2_
  - [ ]* 12.2 Write integration tests for full add/delete flow
    - Using jsdom: simulate a valid form submission, assert transaction appears in list and balance updates, assert `localStorage` contains the transaction
    - Simulate clicking delete, assert transaction removed from list, balance updated, `localStorage` updated
    - _Requirements: 1.2, 2.3, 3.2, 3.3, 5.1_

- [x] 13. Final checkpoint — all tests pass, full app functional
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- All 8 correctness properties from `design.md` are covered by property-based tests in tasks 2.3, 4.2, 4.3, 7.2, 7.3, 9.3, 9.4, and 8.3
- Each task references specific requirements for traceability
- The Chart.js instance is created once (`initChart`) and always updated via mutation (`updateChart`) — never destroyed and recreated — to avoid the "canvas already in use" error
- `crypto.randomUUID()` is used for transaction IDs with a `Date.now() + Math.random()` fallback for older browsers
- Run tests with `vitest --run` for single-pass execution (not watch mode)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["2.3", "2.4", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["4.6", "6.1", "7.1", "8.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.2", "7.3", "7.4", "8.2", "8.3", "8.4"] },
    { "id": 6, "tasks": ["9.1", "9.2", "11.1", "11.2"] },
    { "id": 7, "tasks": ["9.3", "9.4", "11.3"] },
    { "id": 8, "tasks": ["12.1"] },
    { "id": 9, "tasks": ["12.2"] }
  ]
}
```
