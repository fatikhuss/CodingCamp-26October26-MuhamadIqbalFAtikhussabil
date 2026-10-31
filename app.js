// Expense & Budget Visualizer — main application script

/**
 * A single spending entry.
 * @typedef {Object} Transaction
 * @property {string} id       - UUID (crypto.randomUUID() or Date.now().toString() + Math.random() fallback)
 * @property {string} name     - 1–100 non-whitespace-only characters
 * @property {number} amount   - float, 0.01 – 999,999,999.99
 * @property {string} category - "Food" | "Transport" | "Fun"
 * @property {'income' | 'expense'} type - Whether this entry is income or an expense
 */

/**
 * Per-field validation errors returned by validateForm().
 * @typedef {Object} FieldErrors
 * @property {string} [name]     - e.g. "Item name is required."
 * @property {string} [amount]   - e.g. "Amount must be between 0.01 and 999,999,999.99."
 * @property {string} [category] - e.g. "Please select a category."
 * @property {string} [type]     - e.g. "Please select a transaction type."
 */

/**
 * Sort configuration for the transaction list.
 * @typedef {Object} SortConfig
 * @property {'amount' | 'category' | 'none'} field     - The field to sort by; 'none' preserves insertion order
 * @property {'asc' | 'desc'}                 direction - Sort direction
 */

/**
 * In-memory application state.
 * `transactions` is the single source of truth; the DOM and localStorage are projections of it.
 *
 * @type {{
 *   transactions: Transaction[],
 *   chart: import('chart.js').Chart | null,
 *   categories: string[],
 *   theme: 'light' | 'dark',
 *   sortConfig: SortConfig
 * }}
 */
export const state = {
  transactions: [],
  chart: null,
  categories: ['Food', 'Transport', 'Fun'],
  theme: 'light',
  sortConfig: { field: 'none', direction: 'asc' },
};

// ---------------------------------------------------------------------------
// Storage Adapter
// ---------------------------------------------------------------------------

/**
 * Loads the transaction array from localStorage.
 *
 * Reads the value stored under the key "transactions", parses it as JSON,
 * and returns the resulting array. Returns `null` if localStorage is
 * unavailable, the stored value is not valid JSON, or the parsed value is
 * not an array.
 *
 * @returns {Transaction[] | null}
 */
export function loadFromStorage() {
  try {
    const raw = localStorage.getItem('transactions');
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(tx => tx.type === 'income' || tx.type === 'expense');
  } catch {
    return null;
  }
}

/**
 * Loads the active theme from localStorage.
 *
 * Reads the value stored under the key "theme". Returns it as-is if it is
 * exactly `"light"` or `"dark"`. Returns `"light"` for any other value,
 * including `null` (key absent), `undefined`, or any unrecognised string.
 *
 * @returns {'light' | 'dark'}
 */
export function loadTheme() {
  const value = localStorage.getItem('theme');
  if (value === 'light' || value === 'dark') {
    return value;
  }
  return 'light';
}

/**
 * Persists the active theme to localStorage.
 *
 * Writes the given theme string under the key "theme". Returns `true` on
 * success. Returns `false` if localStorage is unavailable, the quota is
 * exceeded, or any other exception is thrown during the write.
 *
 * @param {'light' | 'dark'} theme
 * @returns {boolean}
 */
export function saveTheme(theme) {
  try {
    localStorage.setItem('theme', theme);
    return true;
  } catch {
    return false;
  }
}

/**
 * Persists the transaction array to localStorage.
 *
 * Serializes the given array to a JSON string and writes it under the key
 * "transactions". Returns `true` on success. Returns `false` if localStorage
 * is unavailable, the quota is exceeded, or any other exception is thrown
 * during serialization or storage.
 *
 * @param {Transaction[]} transactions
 * @returns {boolean}
 */
export function saveToStorage(transactions) {
  try {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads the custom categories array from localStorage.
 *
 * Reads the value stored under the key "categories", parses it as JSON,
 * and returns the resulting array. Returns `[]` if localStorage is
 * unavailable, the key is missing, the stored value is not valid JSON,
 * or the parsed value is not an array.
 *
 * Note: built-in categories (Food, Transport, Fun) are NOT stored here;
 * this function only retrieves user-defined custom categories.
 *
 * @returns {string[]}
 */
export function loadCategories() {
  try {
    const raw = localStorage.getItem('categories');
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Persists the custom categories array to localStorage.
 *
 * Serializes the given array to a JSON string and writes it under the key
 * "categories". Returns `true` on success. Returns `false` if localStorage
 * is unavailable, the quota is exceeded, or any other exception is thrown
 * during serialization or storage.
 *
 * @param {string[]} cats
 * @returns {boolean}
 */
export function saveCategories(cats) {
  try {
    localStorage.setItem('categories', JSON.stringify(cats));
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads the sort configuration from localStorage.
 *
 * Reads the value stored under the key "sortConfig", parses it as JSON,
 * and validates that the parsed object has:
 *   - `field` that is one of `'amount'`, `'category'`, or `'none'`
 *   - `direction` that is one of `'asc'` or `'desc'`
 *
 * Returns the parsed config if valid. Returns `{ field: 'none', direction: 'asc' }`
 * if the key is absent, the value is not valid JSON, or the parsed object
 * fails validation.
 *
 * @returns {SortConfig}
 */
export function loadSortConfig() {
  const VALID_FIELDS = ['amount', 'category', 'none'];
  const VALID_DIRECTIONS = ['asc', 'desc'];
  const DEFAULT = { field: 'none', direction: 'asc' };

  try {
    const raw = localStorage.getItem('sortConfig');
    if (raw === null) return DEFAULT;

    const parsed = JSON.parse(raw);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !VALID_FIELDS.includes(parsed.field) ||
      !VALID_DIRECTIONS.includes(parsed.direction)
    ) {
      return DEFAULT;
    }

    return { field: parsed.field, direction: parsed.direction };
  } catch {
    return DEFAULT;
  }
}

/**
 * Persists the sort configuration to localStorage.
 *
 * Serializes the given SortConfig object to a JSON string and writes it
 * under the key "sortConfig". Returns `true` on success. Returns `false`
 * if localStorage is unavailable, the quota is exceeded, or any other
 * exception is thrown during serialization or storage.
 *
 * @param {SortConfig} cfg
 * @returns {boolean}
 */
export function saveSortConfig(cfg) {
  try {
    localStorage.setItem('sortConfig', JSON.stringify(cfg));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Banner Helpers
// ---------------------------------------------------------------------------

/**
 * Displays the storage banner with the given message.
 *
 * Sets the text content of `#storage-banner` and removes its `hidden`
 * attribute so the element becomes visible.
 *
 * @param {string} message - The message to display inside the banner.
 */
export function showBanner(message) {
  const banner = document.getElementById('storage-banner');
  if (!banner) return;
  banner.textContent = message;
  banner.removeAttribute('hidden');
}

/**
 * Hides the storage banner by adding the `hidden` attribute back.
 */
export function hideBanner() {
  const banner = document.getElementById('storage-banner');
  if (!banner) return;
  banner.setAttribute('hidden', '');
}

// ---------------------------------------------------------------------------
// Form Validation
// ---------------------------------------------------------------------------

/**
 * Generates a unique ID using crypto.randomUUID() when available, falling back
 * to a Date.now() + Math.random() composite string for older browsers.
 *
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString() + Math.random();
}

/**
 * Reads the current values of #item-name, #item-amount, and #item-category
 * from the DOM and validates them against the input rules.
 *
 * Returns `{ transaction }` with a new Transaction object on success, or
 * `{ errors }` with a FieldErrors object describing every invalid field.
 *
 * Validation rules:
 *  - name:     must contain at least 1 non-whitespace character
 *  - amount:   must be numeric and in the range [0.01, 999999999.99]
 *  - category: must not be empty (i.e. a valid option must be selected)
 *
 * @returns {{ transaction: Transaction } | { errors: FieldErrors }}
 */
export function validateForm() {
  const nameEl     = document.getElementById('item-name');
  const amountEl   = document.getElementById('item-amount');
  const categoryEl = document.getElementById('item-category');
  const typeEl     = document.querySelector('#item-type');

  const nameVal     = nameEl     ? nameEl.value     : '';
  const amountVal   = amountEl   ? amountEl.value   : '';
  const categoryVal = categoryEl ? categoryEl.value : '';
  const typeVal     = typeEl?.value ?? '';

  /** @type {import('./app.js').FieldErrors} */
  const errors = {};

  // Validate name
  if (nameVal.trim() === '') {
    errors.name = 'Item name is required.';
  }

  // Validate amount
  const amountNum = parseFloat(amountVal);
  if (amountVal.trim() === '' || isNaN(amountNum)) {
    errors.amount = 'Amount must be a number between 0.01 and 999,999,999.99.';
  } else if (amountNum < 0.01 || amountNum > 999999999.99) {
    errors.amount = 'Amount must be between 0.01 and 999,999,999.99.';
  }

  // Validate category
  if (categoryVal === '') {
    errors.category = 'Please select a category.';
  }

  // Validate type
  if (typeVal === '') {
    errors.type = 'Please select a transaction type.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  /** @type {Transaction} */
  const transaction = {
    id:       generateId(),
    name:     nameVal.trim(),
    amount:   amountNum,
    category: categoryVal,
    type:     /** @type {'income' | 'expense'} */ (typeVal),
  };

  return { transaction };
}

// ---------------------------------------------------------------------------
// Category Name Validator
// ---------------------------------------------------------------------------

/**
 * Validates a proposed custom category name against the current list of
 * existing categories (built-ins + any previously added custom categories).
 *
 * Validation rules (applied in order):
 *  1. Name must not be empty or whitespace-only.
 *  2. Trimmed name must not exceed 50 characters.
 *  3. Trimmed name must not already exist in `existingCategories`
 *     (comparison is case-insensitive).
 *
 * @param {string}   name               - The raw input value from the user.
 * @param {string[]} existingCategories - Current category list (built-ins + custom).
 * @returns {{ valid: true } | { error: string }}
 */
export function validateCategoryName(name, existingCategories) {
  const trimmed = name.trim();

  // Task 4.1 — empty / whitespace-only
  if (!trimmed) {
    return { error: 'Category name cannot be empty.' };
  }

  // Task 4.1 — exceeds 50 characters
  if (trimmed.length > 50) {
    return { error: 'Category name cannot exceed 50 characters.' };
  }

  // Task 4.2 — case-insensitive duplicate (includes built-ins)
  const lower = trimmed.toLowerCase();
  const isDuplicate = existingCategories.some(c => c.toLowerCase() === lower);
  if (isDuplicate) {
    return { error: 'A category with this name already exists.' };
  }

  // Task 4.3 — all checks passed
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Form Reset
// ---------------------------------------------------------------------------

/**
 * Resets the add-item form fields to their default (empty) state.
 *
 * Sets #item-name and #item-amount values to `""` and sets #item-category
 * back to the placeholder option (`value=""`). Guards against null in case
 * any element is not present in the DOM.
 */
export function resetForm() {
  const nameEl     = document.getElementById('item-name');
  const amountEl   = document.getElementById('item-amount');
  const categoryEl = document.getElementById('item-category');

  if (nameEl)     nameEl.value     = '';
  if (amountEl)   amountEl.value   = '';
  if (categoryEl) categoryEl.value = '';
}

// ---------------------------------------------------------------------------
// Sort Engine
// ---------------------------------------------------------------------------

/**
 * Returns a sorted copy of the transactions array based on the given sort
 * configuration. Never mutates the input array.
 *
 * - `field: 'none'`     → returns a shallow copy in original insertion order
 * - `field: 'amount'`   → numeric sort; `direction: 'asc'` = smallest first,
 *                         `direction: 'desc'` = largest first
 * - `field: 'category'` → locale-aware case-insensitive alphabetical sort;
 *                         `direction: 'asc'` = A–Z, `direction: 'desc'` = Z–A
 *
 * @param {Transaction[]} transactions - Source array (not mutated).
 * @param {SortConfig}    sortConfig   - Describes field and direction.
 * @returns {Transaction[]} A new sorted array.
 */
export function sortTransactions(transactions, sortConfig) {
  const copy = [...transactions];
  const { field, direction } = sortConfig;

  if (field === 'none') return copy;

  copy.sort((a, b) => {
    if (field === 'amount') {
      return direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    if (field === 'category') {
      const cmp = a.category.localeCompare(b.category, undefined, { sensitivity: 'base' });
      return direction === 'asc' ? cmp : -cmp;
    }
    return 0;
  });

  return copy;
}

// ---------------------------------------------------------------------------
// Sort Controls Renderer
// ---------------------------------------------------------------------------

/**
 * Syncs the sort control UI elements to match the given sort configuration.
 *
 * Sets the `value` of `#sort-field` and `#sort-direction` select elements to
 * reflect the current `state.sortConfig`, so the displayed selection always
 * matches the active sort state (e.g. after loading from localStorage on page
 * load, or after a programmatic sort config change).
 *
 * Guards against missing elements by returning early if either select is not
 * present in the DOM (e.g. in test environments).
 *
 * @param {SortConfig} sortConfig - The sort configuration to reflect in the UI.
 */
export function renderSortControls(sortConfig) {
  const sortFieldEl     = document.getElementById('sort-field');
  const sortDirectionEl = document.getElementById('sort-direction');
  if (!sortFieldEl || !sortDirectionEl) return;
  sortFieldEl.value     = sortConfig.field;
  sortDirectionEl.value = sortConfig.direction;
}

// ---------------------------------------------------------------------------
// Sort Change Handler (task 13.2)
// ---------------------------------------------------------------------------

/**
 * Handles a change to either sort control (`#sort-field` or `#sort-direction`).
 *
 * Reads the current values of `#sort-field` and `#sort-direction`, updates
 * `state.sortConfig` with the new field and direction, persists the config via
 * `saveSortConfig()`, and re-renders the transaction list so the displayed
 * order immediately reflects the new sort — within 200ms of the user interaction
 * (Requirements 5.3, 5.8, 5.9).
 *
 * Guards against missing elements by returning early if either select is not
 * present in the DOM.
 */
export function handleSortChange() {
  const sortFieldEl     = document.getElementById('sort-field');
  const sortDirectionEl = document.getElementById('sort-direction');
  if (!sortFieldEl || !sortDirectionEl) return;

  state.sortConfig = {
    field:     sortFieldEl.value,
    direction: sortDirectionEl.value,
  };

  saveSortConfig(state.sortConfig);
  renderList(state.transactions, state.sortConfig);
}

// ---------------------------------------------------------------------------
// Category Rendering and Handlers
// ---------------------------------------------------------------------------

/**
 * The three built-in categories that are always present and hardcoded.
 * These are never stored in localStorage under "categories".
 * @type {string[]}
 */
export const BUILTIN_CATEGORIES = ['Food', 'Transport', 'Fun'];

/**
 * Clears and rebuilds the `<select id="item-category">` options.
 *
 * Order: placeholder first, then built-ins (Food, Transport, Fun),
 * then any custom categories (those not in BUILTIN_CATEGORIES).
 *
 * Also rebuilds `#custom-category-list` to show delete buttons for each
 * custom category.
 *
 * @param {string[]} categories - Full category list (built-ins + custom).
 */
export function renderCategorySelect(categories) {
  const select = document.getElementById('item-category');
  if (!select) return;

  select.innerHTML = '';

  // Placeholder option
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '-- Select category --';
  select.appendChild(placeholder);

  // Built-ins first (hardcoded, always present)
  for (const cat of BUILTIN_CATEGORIES) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  }

  // Custom categories (everything not in BUILTIN_CATEGORIES)
  const customCats = categories.filter(c => !BUILTIN_CATEGORIES.includes(c));
  for (const cat of customCats) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  }

  // Also rebuild the custom category list UI
  const list = document.getElementById('custom-category-list');
  if (list) {
    list.innerHTML = '';
    for (const cat of customCats) {
      const li = document.createElement('li');

      const nameSpan = document.createElement('span');
      nameSpan.textContent = cat;

      const delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.className = 'delete-category-btn';
      delBtn.setAttribute('data-category', cat);
      delBtn.setAttribute('aria-label', `Delete category ${cat}`);
      delBtn.type = 'button';

      li.appendChild(nameSpan);
      li.appendChild(delBtn);
      list.appendChild(li);
    }
  }
}

/**
 * Handles the category add form submission.
 *
 * - Prevents default
 * - Reads `#new-category-name` input value
 * - Calls `validateCategoryName(name, state.categories)`
 * - On error: shows error in `#err-category-name` WITHOUT clearing the input
 * - On success:
 *   - If 50 custom categories already exist, shows max error and stops
 *   - Otherwise: pushes to state.categories, saves, re-renders select, clears input/error
 *
 * @param {Event} event
 */
export function handleCategoryAdd(event) {
  event.preventDefault();

  const input = document.getElementById('new-category-name');
  const errSpan = document.getElementById('err-category-name');
  if (!input) return;

  const name = input.value;

  // Check max custom categories limit (50)
  const customCount = state.categories.filter(c => !BUILTIN_CATEGORIES.includes(c)).length;
  if (customCount >= 50) {
    if (errSpan) errSpan.textContent = 'Maximum 50 custom categories allowed.';
    return;
  }

  const result = validateCategoryName(name, state.categories);
  if (result.error) {
    if (errSpan) errSpan.textContent = result.error;
    return; // do NOT clear input on error
  }

  // Success: clear error, add category, persist, re-render, clear input
  if (errSpan) errSpan.textContent = '';
  state.categories.push(name.trim());
  const customCats = state.categories.filter(c => !BUILTIN_CATEGORIES.includes(c));
  saveCategories(customCats);
  renderCategorySelect(state.categories);
  input.value = '';
}

/**
 * Event-delegation click handler attached to `#custom-category-list`.
 *
 * Finds the closest `[data-category]` button, removes that category from
 * `state.categories`, persists only the custom categories, and re-renders
 * the select and list. Does NOT touch `state.transactions`.
 *
 * @param {MouseEvent} event
 */
export function handleCategoryDelete(event) {
  const btn = /** @type {Element} */ (event.target).closest('[data-category]');
  if (!btn) return;

  const catName = btn.getAttribute('data-category');
  state.categories = state.categories.filter(c => c !== catName);

  const customCats = state.categories.filter(c => !BUILTIN_CATEGORIES.includes(c));
  saveCategories(customCats);
  renderCategorySelect(state.categories);
}

// ---------------------------------------------------------------------------
// List Renderer
// ---------------------------------------------------------------------------

/**
 * Clears and re-renders the transaction list from the given array.
 *
 * Sorts the transactions using `sortTransactions` before rendering, so the
 * displayed order always reflects the active sort configuration.
 *
 * - If `transactions` is empty: shows `#empty-msg` and hides `#transaction-list`.
 * - Otherwise: hides `#empty-msg`, shows `#transaction-list`, and renders one
 *   `<li>` per transaction according to the active sort order.
 *
 * Each `<li>` contains:
 *   - `data-id` attribute set to the transaction's UUID
 *   - CSS class `"income"` or `"expense"` matching `tx.type`
 *   - `<span class="tx-name">` with the transaction name
 *   - `<span class="tx-amount">` with the amount formatted as `$X.XX`
 *   - `<span class="tx-category">` with the category label
 *   - `<span class="tx-type">` with `"Income"` or `"Expense"` (capitalised)
 *   - `<button class="delete-btn" aria-label="Delete <name>">✕</button>`
 *
 * @param {Transaction[]} transactions
 * @param {SortConfig}    [sortConfig=state.sortConfig]
 */
export function renderList(transactions, sortConfig = state.sortConfig) {
  const list     = document.getElementById('transaction-list');
  const emptyMsg = document.getElementById('empty-msg');

  if (!list) return;

  // Sort before rendering — Requirements 5.3, 5.8
  const sorted = sortTransactions(transactions, sortConfig ?? state.sortConfig);

  // Clear existing items
  list.innerHTML = '';

  if (sorted.length === 0) {
    if (emptyMsg) emptyMsg.removeAttribute('hidden');
    list.setAttribute('hidden', '');
    return;
  }

  if (emptyMsg) emptyMsg.setAttribute('hidden', '');
  list.removeAttribute('hidden');

  for (const tx of sorted) {
    const li = document.createElement('li');
    li.dataset.id = tx.id;

    // Requirement 1.4 — apply type class for CSS styling
    li.classList.add(tx.type);

    const nameSpan = document.createElement('span');
    nameSpan.className   = 'tx-name';
    nameSpan.textContent = tx.name;

    const amountSpan = document.createElement('span');
    amountSpan.className   = 'tx-amount';
    amountSpan.textContent = `$${Number(tx.amount).toFixed(2)}`;

    const categorySpan = document.createElement('span');
    categorySpan.className   = 'tx-category';
    categorySpan.textContent = tx.category;

    // Requirement 1.3 — show capitalised type label
    const typeSpan = document.createElement('span');
    typeSpan.className   = 'tx-type';
    typeSpan.textContent = tx.type === 'income' ? 'Income' : 'Expense';

    const deleteBtn = document.createElement('button');
    deleteBtn.className         = 'delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete ${tx.name}`);
    deleteBtn.textContent       = '✕';

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categorySpan);
    li.appendChild(typeSpan);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  }
}

// ---------------------------------------------------------------------------
// Balance Renderer
// ---------------------------------------------------------------------------

/**
 * Computes the net balance from all transactions and updates the balance display.
 *
 * Separates transactions by `type`:
 *  - `'income'`  entries contribute to `totalIncome`
 *  - `'expense'` entries contribute to `totalExpense`
 *
 * Entries where `isNaN(parseFloat(tx.amount))` is `true` are skipped and a
 * `console.warn` is emitted with the offending transaction's `id`.
 *
 * `netBalance = totalIncome − totalExpense`
 *
 * Sets the `textContent` of `#balance-amount` to:
 *  - `Math.abs(netBalance).toFixed(2)` when `netBalance >= 0` (no prefix)
 *  - `"-" + Math.abs(netBalance).toFixed(2)` when `netBalance < 0`
 *
 * @param {Transaction[]} transactions
 */
export function renderBalance(transactions) {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    const parsed = parseFloat(tx.amount);
    if (isNaN(parsed)) {
      console.warn(`Skipping transaction with malformed amount (id: ${tx.id})`);
      continue;
    }
    if (tx.type === 'income') {
      totalIncome += parsed;
    } else if (tx.type === 'expense') {
      totalExpense += parsed;
    }
  }

  const netBalance = totalIncome - totalExpense;
  const formatted = Math.abs(netBalance).toFixed(2);
  const display = netBalance < 0 ? `-${formatted}` : formatted;

  const balanceEl = document.getElementById('balance-amount');
  if (balanceEl) {
    balanceEl.textContent = display;
  }
}

// ---------------------------------------------------------------------------
// Theme Renderer & Toggle
// ---------------------------------------------------------------------------

/**
 * Applies the given theme to the DOM.
 *
 * - Adds the `dark-mode` class to `<body>` when `theme === 'dark'`; removes
 *   it when `theme === 'light'`.
 * - Sets the `#theme-toggle` button's text content to `"☀️ Light Mode"` for
 *   dark theme, or `"🌙 Dark Mode"` for light theme.
 *
 * @param {'light' | 'dark'} theme
 */
export function renderTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
}

/**
 * Toggles the active theme between `'light'` and `'dark'`.
 *
 * Flips `state.theme`, persists the new value via `saveTheme()`, then
 * updates the DOM via `renderTheme()`.
 */
export function handleThemeToggle() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  saveTheme(state.theme);
  renderTheme(state.theme);
}

// ---------------------------------------------------------------------------
// Chart Component (task 8.1)
// ---------------------------------------------------------------------------

/**
 * Creates and initialises the Chart.js pie chart instance on `#spending-chart`.
 *
 * Configuration:
 *  - type: 'pie'
 *  - labels: ['Food', 'Transport', 'Fun']
 *  - initial data: [0, 0, 0]
 *  - backgroundColors: ['#FF6384', '#36A2EB', '#FFCE56']
 *  - responsive: true
 *  - legend position: 'bottom'
 *  - tooltip callback formats as `<label>: <parsed.toFixed(1)>%`
 *
 * The instance is assigned to `state.chart` so that `updateChart()` can
 * mutate it in-place without ever destroying and recreating the canvas
 * context (which would trigger the "canvas already in use" Chart.js error).
 *
 * Guards against the canvas element being absent (e.g. in test environments
 * where the full DOM is not loaded) by returning early without throwing.
 *
 * @returns {void}
 */
export function initChart() {
  const canvas = document.getElementById('spending-chart');
  if (!canvas) return;

  // Chart is loaded from CDN as a UMD global — guard against test environments
  // where the global may not be available.
  if (typeof Chart === 'undefined') return;

  state.chart = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: ['Food', 'Transport', 'Fun'],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%`,
          },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Chart Update (task 8.2)
// ---------------------------------------------------------------------------

/**
 * Aggregates transaction amounts by category and updates the Chart.js instance.
 *
 * Sums amounts for each of the three categories — Food (index 0), Transport
 * (index 1), Fun (index 2) — and writes the results into
 * `state.chart.data.datasets[0].data`, then calls `state.chart.update()`.
 *
 * Visibility logic:
 *  - If all three totals are zero: set `hidden` on `#spending-chart` and
 *    remove `hidden` from `#chart-empty-msg`.
 *  - Otherwise: remove `hidden` from `#spending-chart` and set `hidden` on
 *    `#chart-empty-msg`.
 *
 * Guards against `state.chart` being null (e.g. in test environments where
 * Chart.js CDN is not available) by returning early without throwing.
 *
 * @param {Transaction[]} transactions
 */
export function updateChart(transactions) {
  const canvas   = document.getElementById('spending-chart');
  const emptyMsg = document.getElementById('chart-empty-msg');

  // Build totals map from all current categories (built-ins + custom)
  const totals = {};
  for (const cat of state.categories) {
    totals[cat] = 0;
  }

  // Only aggregate EXPENSE transactions (Requirement 4.1, 4.5)
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    const amount = parseFloat(tx.amount);
    if (!isNaN(amount) && Object.prototype.hasOwnProperty.call(totals, tx.category)) {
      totals[tx.category] += amount;
    }
  }

  const values = state.categories.map(cat => totals[cat]);
  const allZero = values.every(v => v === 0);

  if (allZero) {
    if (canvas)   canvas.setAttribute('hidden', '');
    if (emptyMsg) emptyMsg.removeAttribute('hidden');
  } else {
    if (canvas)   canvas.removeAttribute('hidden');
    if (emptyMsg) emptyMsg.setAttribute('hidden', '');
  }

  if (!state.chart) return;

  // Update chart labels and data to reflect current categories
  state.chart.data.labels = [...state.categories];
  state.chart.data.datasets[0].data = values;
  state.chart.update();
}

// ---------------------------------------------------------------------------
// Delete Handler (task 6.2)
// ---------------------------------------------------------------------------

/**
 * Event-delegation click handler attached to `#transaction-list`.
 *
 * When a `.delete-btn` is clicked (or a descendant of one), finds the
 * closest `<li>` ancestor, reads its `data-id` attribute, and calls
 * `deleteTransaction(id)`.
 *
 * @param {MouseEvent} event
 */
export function handleListClick(event) {
  const btn = /** @type {Element} */ (event.target).closest('.delete-btn');
  if (!btn) return;

  const li = btn.closest('li');
  if (!li) return;

  const id = li.dataset.id;
  if (id) {
    deleteTransaction(id);
  }
}

// ---------------------------------------------------------------------------
// Transaction Management (stub — wired up in task 12.1)
// ---------------------------------------------------------------------------

/**
 * Adds a transaction to the in-memory state and persists to localStorage.
 *
 * Prepends the transaction to `state.transactions` (index 0 = most recently
 * added), saves to localStorage, and re-renders the list, balance, and chart.
 * If `saveToStorage` fails (e.g. quota exceeded or private mode), the storage
 * banner is shown so the user is aware their data will not be persisted.
 *
 * @param {Transaction} transaction - The validated Transaction object to add.
 */
export function addTransaction(transaction) {
  state.transactions.unshift(transaction);

  const saved = saveToStorage(state.transactions);
  if (!saved) {
    showBanner('Unable to save data: storage is unavailable or full.');
  }

  renderList(state.transactions, state.sortConfig);
  renderBalance(state.transactions);
  updateChart(state.transactions);
}

/**
 * Removes a transaction from the in-memory state and persists to localStorage.
 *
 * Filters `state.transactions` to remove the entry with the matching `id`,
 * saves the updated array to storage (showing `#storage-banner` on failure),
 * then re-renders the list, balance, and chart.
 *
 * @param {string} id - The UUID of the transaction to remove.
 */
export function deleteTransaction(id) {
  state.transactions = state.transactions.filter(tx => tx.id !== id);

  const saved = saveToStorage(state.transactions);
  if (!saved) {
    showBanner('Unable to save data: storage is unavailable or full.');
  }

  renderList(state.transactions, state.sortConfig);
  renderBalance(state.transactions);
  updateChart(state.transactions);
}

// ---------------------------------------------------------------------------
// Form Submission Handler
// ---------------------------------------------------------------------------

/**
 * Handles the expense form submit event.
 *
 * Calls `validateForm()`. On errors, writes per-field messages to the
 * `#err-name`, `#err-amount`, and `#err-category` spans and does not add
 * the transaction. On success, clears those spans, calls `addTransaction`,
 * and calls `resetForm`.
 *
 * @param {Event} event - The submit event (will have `preventDefault` called).
 */
export function handleFormSubmit(event) {
  event.preventDefault();

  const result = validateForm();

  const errName     = document.getElementById('err-name');
  const errAmount   = document.getElementById('err-amount');
  const errCategory = document.getElementById('err-category');
  const errType     = document.getElementById('err-type');

  if (result.errors) {
    // Display per-field inline error messages; leave empty string when no error for that field
    if (errName)     errName.textContent     = result.errors.name     ?? '';
    if (errAmount)   errAmount.textContent   = result.errors.amount   ?? '';
    if (errCategory) errCategory.textContent = result.errors.category ?? '';
    if (errType)     errType.textContent     = result.errors.type     ?? '';
  } else {
    // Clear all error spans
    if (errName)     errName.textContent     = '';
    if (errAmount)   errAmount.textContent   = '';
    if (errCategory) errCategory.textContent = '';
    if (errType)     errType.textContent     = '';

    addTransaction(result.transaction);
    resetForm();
  }
}

// ---------------------------------------------------------------------------
// App Initialization
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // ── 1. Load persisted data ──────────────────────────────────────────────
  const loaded = loadFromStorage();

  if (loaded === null) {
    state.transactions = [];
    showBanner('Saved data could not be loaded.');
  } else {
    state.transactions = loaded;
    hideBanner();
  }

  // ── 2. Load and apply persisted settings (16.1) ─────────────────────────
  state.theme      = loadTheme();
  state.categories = [...BUILTIN_CATEGORIES, ...loadCategories()];
  state.sortConfig = loadSortConfig();

  // ── 3. Render settings to DOM (16.2) ────────────────────────────────────
  renderTheme(state.theme);
  renderCategorySelect(state.categories);
  renderSortControls(state.sortConfig);

  // ── 4. Initialise the Chart.js instance ─────────────────────────────────
  initChart();

  // ── 5. Render initial state (16.4) ──────────────────────────────────────
  renderList(state.transactions, state.sortConfig);
  renderBalance(state.transactions);
  updateChart(state.transactions);

  // ── 6. Form submission handler ───────────────────────────────────────────
  const form = document.getElementById('expense-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // ── 7. Delete handler via event delegation ───────────────────────────────
  const list = document.getElementById('transaction-list');
  if (list) {
    list.addEventListener('click', handleListClick);
  }

  // ── 8. Theme toggle (16.3) ───────────────────────────────────────────────
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', handleThemeToggle);
  }

  // ── 9. Category add (16.3) ───────────────────────────────────────────────
  const addCategoryBtn = document.getElementById('add-category-btn');
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', handleCategoryAdd);
  }

  // ── 10. Category delete via event delegation (16.3) ─────────────────────
  const categoryList = document.getElementById('custom-category-list');
  if (categoryList) {
    categoryList.addEventListener('click', handleCategoryDelete);
  }

  // ── 11. Sort controls (16.3) ─────────────────────────────────────────────
  const sortField     = document.getElementById('sort-field');
  const sortDirection = document.getElementById('sort-direction');
  if (sortField)     sortField.addEventListener('change', handleSortChange);
  if (sortDirection) sortDirection.addEventListener('change', handleSortChange);
});
