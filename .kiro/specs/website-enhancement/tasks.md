# Implementation Plan: Website Enhancement

## Overview

Extend the existing single-file vanilla-JS Expense & Budget Visualizer (`app.js`, `index.html`, `style.css`, `app.test.js`) with five features: Transaction Type (income/expense), improved localStorage persistence, Dark/Light Mode toggle, Custom Categories, and Sort Transactions. The implementation follows the unidirectional data-flow architecture already in place. Property-based tests use `fast-check` (already in devDependencies); unit tests use Vitest + jsdom.

---

## Tasks

- [x] 1. Extend data model, state, and TypeDefs in `app.js`
  - Add `type: 'income' | 'expense'` to the `Transaction` typedef
  - Add `type` to the `FieldErrors` typedef
  - Add `categories`, `theme`, and `sortConfig` fields to `state` with correct defaults (`categories: ['Food', 'Transport', 'Fun']`, `theme: 'light'`, `sortConfig: { field: 'none', direction: 'asc' }`)
  - Add `SortConfig` typedef
  - _Requirements: 1.1, 2.9, 3.4, 4.7, 5.9, 5.10_

- [x] 2. Extend StorageAdapter — new load/save functions
  - [x] 2.1 Modify `loadFromStorage()` to exclude entries missing a valid `type` field
    - After parsing the JSON array, filter out any entry where `tx.type !== 'income' && tx.type !== 'expense'`
    - _Requirements: 1.9_
  - [ ]* 2.2 Write property test for `loadFromStorage` entry filtering (Property 5)
    - **Property 5: Entries without a `type` field are excluded on load**
    - **Validates: Requirements 1.9**
    - File: `app.storage.test.js`
    - Tag: `// Feature: website-enhancement, Property 5: Entries without a type field are excluded on load`
  - [x] 2.3 Implement `loadCategories()` — reads `localStorage["categories"]`; returns `[]` on missing/invalid value
    - _Requirements: 4.7_
  - [x] 2.4 Implement `saveCategories(cats)` — writes `JSON.stringify(cats)` under key `"categories"`; returns `boolean`
    - _Requirements: 4.6_
  - [x] 2.5 Implement `loadTheme()` — reads `localStorage["theme"]`; returns `"light"` if value is not `"light"` or `"dark"`
    - _Requirements: 3.4_
  - [x] 2.6 Implement `saveTheme(theme)` — writes theme string under key `"theme"`; returns `boolean`
    - _Requirements: 3.3_
  - [x] 2.7 Implement `loadSortConfig()` — reads `localStorage["sortConfig"]`; returns `{ field: 'none', direction: 'asc' }` on missing or invalid value
    - _Requirements: 5.9, 5.10_
  - [x] 2.8 Implement `saveSortConfig(cfg)` — writes SortConfig JSON under key `"sortConfig"`; returns `boolean`
    - _Requirements: 5.9_
  - [ ]* 2.9 Write property test for storage round-trip with `type` field (Property 6)
    - **Property 6: Storage round-trip preserves all transaction data**
    - **Validates: Requirements 2.9**
    - File: `app.storage.test.js`
    - Tag: `// Feature: website-enhancement, Property 6: Storage round-trip preserves all transaction data`
  - [ ]* 2.10 Write property test for delete removes target from storage (Property 7)
    - **Property 7: Delete removes the target transaction from storage**
    - **Validates: Requirements 2.2**
    - File: `app.storage.test.js`

- [x] 3. Extend `validateForm()` with `type` field
  - [x] 3.1 Read `#item-type` value in `validateForm()` and populate `errors.type` when empty
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Include `type` on the returned Transaction object when validation passes
    - _Requirements: 1.1_
  - [ ]* 3.3 Write property test for type preserved in validated output (Property 1)
    - **Property 1: Transaction type is preserved in validated output**
    - **Validates: Requirements 1.1**
    - File: `app.types.test.js`
    - Tag: `// Feature: website-enhancement, Property 1: Transaction type is preserved in validated output`
  - [ ]* 3.4 Write property test for missing type triggers validation error (Property 2)
    - **Property 2: Missing type field triggers validation error**
    - **Validates: Requirements 1.2**
    - File: `app.types.test.js`

- [x] 4. Implement `validateCategoryName(name, existingCategories)`
  - [x] 4.1 Return `{ error }` for empty/whitespace-only names and names exceeding 50 characters
    - _Requirements: 4.2_
  - [x] 4.2 Return `{ error }` for case-insensitive duplicate names (including built-ins)
    - _Requirements: 4.3_
  - [x] 4.3 Return `{ valid: true }` for a non-empty, non-duplicate, ≤50-char name
    - _Requirements: 4.2, 4.3_
  - [ ]* 4.4 Write property test for whitespace/over-length rejection (Property 10)
    - **Property 10: Category validator rejects whitespace and over-length names**
    - **Validates: Requirements 4.2**
    - File: `app.categories.test.js`
    - Tag: `// Feature: website-enhancement, Property 10: Category validator rejects whitespace and over-length names`
  - [ ]* 4.5 Write property test for case-insensitive duplicate rejection (Property 11)
    - **Property 11: Category validator rejects case-insensitive duplicates**
    - **Validates: Requirements 4.3**
    - File: `app.categories.test.js`

- [x] 5. Implement `sortTransactions(transactions, sortConfig)`
  - [x] 5.1 Implement `sortTransactions()` — returns a sorted copy without mutating `state.transactions`
    - `field: 'none'` → return `[...transactions]`
    - `field: 'amount'` → numeric sort; `direction: 'desc'` → reverse
    - `field: 'category'` → `localeCompare` case-insensitive stable sort; `direction: 'desc'` → reverse
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7_
  - [ ]* 5.2 Write property test for sort by amount (Property 16)
    - **Property 16: Sort by amount produces numerically ordered output**
    - **Validates: Requirements 5.3, 5.4**
    - File: `app.sort.test.js`
    - Tag: `// Feature: website-enhancement, Property 16: Sort by amount produces numerically ordered output`
  - [ ]* 5.3 Write property test for sort by category (Property 17)
    - **Property 17: Sort by category produces case-insensitive alphabetical order**
    - **Validates: Requirements 5.3, 5.5**
    - File: `app.sort.test.js`
  - [ ]* 5.4 Write property test for sort with field "none" (Property 18)
    - **Property 18: Sort with field "none" returns original order**
    - **Validates: Requirements 5.6**
    - File: `app.sort.test.js`

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass with `npm test`, ask the user if questions arise.

- [x] 7. Update `index.html` — add new UI elements
  - [x] 7.1 Add `<select id="item-type">` (Income / Expense) with a placeholder option to the Add Transaction form, plus `<span id="err-type" class="error-msg" aria-live="polite"></span>`
    - _Requirements: 1.1, 1.2_
  - [x] 7.2 Add `<button id="theme-toggle">` in the `<main>` header area (above the balance display)
    - _Requirements: 3.1_
  - [x] 7.3 Add a Custom Category section: `<input id="new-category-name">`, `<button id="add-category-btn">`, `<span id="err-category-name" class="error-msg" aria-live="polite"></span>`, and `<ul id="custom-category-list">` for displaying/deleting custom categories
    - _Requirements: 4.1_
  - [x] 7.4 Add Sort controls: `<select id="sort-field">` (options: none / amount / category) and `<select id="sort-direction">` (options: asc / desc) inside `#list-section`
    - _Requirements: 5.1, 5.2_
  - [x] 7.5 Update `#balance-display` label text from "Total Spent:" to "Net Balance:"
    - _Requirements: 1.7_

- [x] 8. Update `style.css` — new visual rules
  - [x] 8.1 Add `.income` and `.expense` class rules on `#transaction-list li` for visual differentiation (e.g. left border colour)
    - _Requirements: 1.4_
  - [x] 8.2 Add `.tx-type` span style (small badge, similar to `.tx-category`)
    - _Requirements: 1.3_
  - [x] 8.3 Add `body.dark-mode` CSS variable overrides: dark background (`#121212`), light text (`#e0e0e0`), and adjusted card colours
    - _Requirements: 3.7, 3.8_
  - [x] 8.4 Style the theme toggle button (`#theme-toggle`) and custom category section (`#custom-category-list li`, delete button)
    - _Requirements: 3.1, 4.1_
  - [x] 8.5 Style sort controls (`#sort-field`, `#sort-direction`) inline with the existing `select` rules
    - _Requirements: 5.1, 5.2_

- [x] 9. Extend `renderList(transactions, sortConfig)` and add `<span class="tx-type">`
  - [x] 9.1 Update `renderList` signature to accept `sortConfig` and call `sortTransactions(transactions, sortConfig)` before building list items
    - _Requirements: 5.3, 5.8_
  - [x] 9.2 Add `<span class="tx-type">` with text `"Income"` or `"Expense"` to each `<li>`
    - _Requirements: 1.3_
  - [x] 9.3 Apply class `"income"` or `"expense"` to each `<li>` based on `tx.type`
    - _Requirements: 1.4_
  - [ ]* 9.4 Write property test for rendered list items carry correct type class and label (Property 4)
    - **Property 4: Rendered list items carry correct type class and label**
    - **Validates: Requirements 1.3, 1.4**
    - File: `app.types.test.js`
    - Tag: `// Feature: website-enhancement, Property 4: Rendered list items carry correct type class and label`

- [x] 10. Implement `renderBalance(transactions)` as NetBalance
  - [x] 10.1 Rewrite `renderBalance()` to compute `netBalance = Σ income − Σ expense`; display with two decimal places; prefix `-` for negative values, no prefix for zero/positive
    - _Requirements: 1.5, 1.6, 1.7_
  - [ ]* 10.2 Write property test for NetBalance equals income minus expense (Property 3)
    - **Property 3: NetBalance equals income minus expense**
    - **Validates: Requirements 1.7**
    - File: `app.types.test.js`
    - Tag: `// Feature: website-enhancement, Property 3: NetBalance equals income minus expense`

- [x] 11. Implement `renderTheme(theme)` and `handleThemeToggle()`
  - [x] 11.1 Implement `renderTheme(theme)` — toggles `dark-mode` class on `<body>` and sets button text (`"🌙 Dark Mode"` / `"☀️ Light Mode"`)
    - _Requirements: 3.2, 3.5, 3.6_
  - [x] 11.2 Implement `handleThemeToggle()` — flips `state.theme`, calls `saveTheme()`, calls `renderTheme()`
    - _Requirements: 3.1, 3.3_
  - [ ]* 11.3 Write property test for theme toggle switches body class and button label (Property 8)
    - **Property 8: Theme toggle switches body class and button label**
    - **Validates: Requirements 3.2, 3.5, 3.6**
    - File: `app.theme.test.js`
    - Tag: `// Feature: website-enhancement, Property 8: Theme toggle switches body class and button label`
  - [ ]* 11.4 Write property test for theme toggle persists new theme to storage (Property 9)
    - **Property 9: Theme toggle persists the new theme to storage**
    - **Validates: Requirements 3.3**
    - File: `app.theme.test.js`

- [x] 12. Implement `renderCategorySelect(categories)`, `handleCategoryAdd()`, `handleCategoryDelete()`
  - [x] 12.1 Implement `renderCategorySelect(categories)` — rebuilds `<select id="item-category">` options: placeholder first, then built-ins (Food, Transport, Fun), then custom categories
    - _Requirements: 4.5, 4.8_
  - [x] 12.2 Implement `handleCategoryAdd(event)` — prevents default, calls `validateCategoryName()`, on error shows `#err-category-name` without clearing input; on success pushes to `state.categories`, calls `saveCategories()`, calls `renderCategorySelect()`, clears input
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.10_
  - [x] 12.3 Implement `handleCategoryDelete(event)` — removes the custom category from `state.categories`, calls `saveCategories()`, calls `renderCategorySelect()`; does NOT mutate existing transactions
    - _Requirements: 4.9_
  - [ ]* 12.4 Write property test for invalid category add leaves state.categories unchanged (Property 12)
    - **Property 12: Invalid category add leaves state.categories unchanged**
    - **Validates: Requirements 4.4**
    - File: `app.categories.test.js`
    - Tag: `// Feature: website-enhancement, Property 12: Invalid category add leaves state.categories unchanged`
  - [ ]* 12.5 Write property test for built-in categories always appear first in the select (Property 13)
    - **Property 13: Built-in categories always appear first in the select**
    - **Validates: Requirements 4.8**
    - File: `app.categories.test.js`
  - [ ]* 12.6 Write property test for category deletion preserves transaction category names (Property 14)
    - **Property 14: Category deletion preserves transaction category names**
    - **Validates: Requirements 4.9**
    - File: `app.categories.test.js`
  - [ ]* 12.7 Write property test for loaded categories merge with built-ins (Property 15)
    - **Property 15: Loaded categories merge with built-ins**
    - **Validates: Requirements 4.7**
    - File: `app.categories.test.js`

- [x] 13. Implement `handleSortChange()` and `renderSortControls(sortConfig)`
  - [x] 13.1 Implement `renderSortControls(sortConfig)` — sets the selected value on `#sort-field` and `#sort-direction` to match the current `state.sortConfig`
    - _Requirements: 5.1, 5.2_
  - [x] 13.2 Implement `handleSortChange()` — reads `#sort-field` and `#sort-direction`, updates `state.sortConfig`, calls `saveSortConfig()`, calls `renderList(state.transactions, state.sortConfig)`; re-render completes within 200ms
    - _Requirements: 5.3, 5.8, 5.9_

- [x] 14. Update `updateChart(transactions)` to use only expense transactions
  - [x] 14.1 Change the aggregation loop in `updateChart()` to only sum amounts from entries where `tx.type === 'expense'`; expand the `totals` map to cover all categories in `state.categories` (built-in + custom)
    - _Requirements: 4.1, 4.5_

- [x] 15. Update `handleFormSubmit()` to handle the new `type` field and error span
  - [x] 15.1 Add clearing and population of `#err-type` span alongside existing `#err-name`, `#err-amount`, `#err-category` spans in `handleFormSubmit()`
    - _Requirements: 1.2_

- [x] 16. Wire up all new event listeners and load calls in `DOMContentLoaded`
  - [x] 16.1 In the `DOMContentLoaded` listener, load categories via `loadCategories()`, merge with built-ins into `state.categories`, and load theme via `loadTheme()` into `state.theme`, and load sort config via `loadSortConfig()` into `state.sortConfig`
    - _Requirements: 3.4, 4.7, 5.9, 5.10_
  - [x] 16.2 Call `renderTheme(state.theme)` and `renderCategorySelect(state.categories)` and `renderSortControls(state.sortConfig)` on load
    - _Requirements: 3.4, 4.7, 5.9_
  - [x] 16.3 Attach `handleThemeToggle` to `#theme-toggle` click, `handleCategoryAdd` to category add form submit, `handleCategoryDelete` via event delegation on `#custom-category-list`, and `handleSortChange` to both `#sort-field` and `#sort-direction` change events
    - _Requirements: 3.1, 4.1, 4.9, 5.3_
  - [x] 16.4 Update the `DOMContentLoaded` initial render calls: replace `renderList(state.transactions)` with `renderList(state.transactions, state.sortConfig)` and `renderBalance(state.transactions)`
    - _Requirements: 1.7, 5.3_

- [x] 17. Final checkpoint — Ensure all tests pass
  - Run `npm test` (i.e. `vitest --run`). All existing tests in `app.test.js` must still pass, and all new property tests in `app.types.test.js`, `app.storage.test.js`, `app.theme.test.js`, `app.categories.test.js`, `app.sort.test.js` must pass.

---

## Notes

- Tasks marked with `*` are optional property-based or unit tests and can be skipped for a faster MVP. Core behaviour is fully covered by the non-optional tasks.
- All property tests use `fast-check` with `{ numRuns: 100 }` minimum. Each test file is tagged with the design document property number it validates.
- `sortTransactions()` must never mutate `state.transactions`; always work on a `[...transactions]` spread copy.
- `renderList` is called with `state.sortConfig` everywhere after Task 9.1 — update all existing call sites (`addTransaction`, `deleteTransaction`, `DOMContentLoaded`) at the same time to avoid a broken intermediate state.
- The three built-in categories (Food, Transport, Fun) are hardcoded in `state` and **not** persisted to `localStorage["categories"]`; `loadCategories()` only stores and retrieves custom categories.
- Existing tests in `app.test.js` cover the old `renderList(transactions)` signature — those tests will need a DOM that matches the new `<li>` structure (including `.tx-type`). Update the affected `renderList` tests in `app.test.js` as part of Task 9.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8"] },
    { "id": 2, "tasks": ["2.2", "2.9", "2.10", "3.1", "4.1", "4.2", "4.3", "5.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "4.4", "4.5", "5.2", "5.3", "5.4", "7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 4, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "9.1", "9.2", "9.3", "10.1", "11.1", "11.2", "12.1", "12.2", "12.3", "13.1", "13.2", "14.1", "15.1"] },
    { "id": 5, "tasks": ["9.4", "10.2", "11.3", "11.4", "12.4", "12.5", "12.6", "12.7", "16.1", "16.2", "16.3", "16.4"] }
  ]
}
```
