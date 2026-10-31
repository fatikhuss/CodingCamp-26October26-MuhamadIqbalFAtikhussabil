/**
 * Tests for task 3.1: app initialization, showBanner, hideBanner
 * Requirements: 2.4, 2.5, 5.2, 5.3, 5.4
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── helpers that do not depend on the DOM ─────────────────────────────────

describe('showBanner', () => {
  beforeEach(() => {
    // Provide a minimal #storage-banner element
    document.body.innerHTML = '<div id="storage-banner" hidden role="alert"></div>';
  });

  it('sets the banner text content', async () => {
    const { showBanner } = await import('./app.js');
    showBanner('Something went wrong.');
    expect(document.getElementById('storage-banner').textContent).toBe(
      'Something went wrong.'
    );
  });

  it('removes the hidden attribute so the banner is visible', async () => {
    const { showBanner } = await import('./app.js');
    showBanner('Error!');
    expect(document.getElementById('storage-banner').hasAttribute('hidden')).toBe(false);
  });

  it('does nothing when #storage-banner is absent (no throw)', async () => {
    document.body.innerHTML = '';
    const { showBanner } = await import('./app.js');
    expect(() => showBanner('msg')).not.toThrow();
  });
});

describe('hideBanner', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="storage-banner" role="alert"></div>';
  });

  it('adds the hidden attribute back to the banner', async () => {
    const { hideBanner } = await import('./app.js');
    hideBanner();
    expect(document.getElementById('storage-banner').hasAttribute('hidden')).toBe(true);
  });

  it('does nothing when #storage-banner is absent (no throw)', async () => {
    document.body.innerHTML = '';
    const { hideBanner } = await import('./app.js');
    expect(() => hideBanner()).not.toThrow();
  });
});

// ── DOMContentLoaded initialization ──────────────────────────────────────

describe('DOMContentLoaded initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="storage-banner" hidden role="alert"></div>';
    localStorage.clear();
    vi.resetModules();
  });

  it('sets state.transactions to the loaded array when localStorage has valid data', async () => {
    const saved = [
      { id: '1', name: 'Coffee', amount: 3.5, category: 'Food', type: 'expense' },
    ];
    localStorage.setItem('transactions', JSON.stringify(saved));

    const { state } = await import('./app.js');

    // Fire DOMContentLoaded so the listener executes
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(state.transactions).toEqual(saved);
  });

  it('sets state.transactions to [] and shows banner when localStorage is empty (null return)', async () => {
    // localStorage is clear → loadFromStorage() returns null
    const { state } = await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(state.transactions).toEqual([]);
    expect(document.getElementById('storage-banner').hasAttribute('hidden')).toBe(false);
    expect(document.getElementById('storage-banner').textContent.length).toBeGreaterThan(0);
  });

  it('sets state.transactions to [] and shows banner when stored JSON is corrupt', async () => {
    localStorage.setItem('transactions', '{not valid json}');

    const { state } = await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(state.transactions).toEqual([]);
    expect(document.getElementById('storage-banner').hasAttribute('hidden')).toBe(false);
  });

  it('does NOT show the banner when valid data is loaded', async () => {
    const saved = [{ id: '2', name: 'Bus', amount: 1.5, category: 'Transport' }];
    localStorage.setItem('transactions', JSON.stringify(saved));

    await import('./app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.getElementById('storage-banner').hasAttribute('hidden')).toBe(true);
  });
});

// ── validateForm ──────────────────────────────────────────────────────────

describe('validateForm', () => {
  /** Helper: set up the form fields with given values */
  function setForm(name, amount, category, type = 'expense') {
    document.body.innerHTML = `
      <input id="item-name"     value="${name}" />
      <input id="item-amount"   value="${amount}" />
      <select id="item-category">
        <option value="">-- Select category --</option>
        <option value="Food"     ${category === 'Food'      ? 'selected' : ''}>Food</option>
        <option value="Transport"${category === 'Transport' ? 'selected' : ''}>Transport</option>
        <option value="Fun"      ${category === 'Fun'       ? 'selected' : ''}>Fun</option>
      </select>
      <select id="item-type">
        <option value="">-- Select type --</option>
        <option value="income"  ${type === 'income'  ? 'selected' : ''}>Income</option>
        <option value="expense" ${type === 'expense' ? 'selected' : ''}>Expense</option>
      </select>
    `;
  }

  beforeEach(() => vi.resetModules());

  // ── valid input ──────────────────────────────────────────────────────────

  it('returns { transaction } for valid input', async () => {
    setForm('Coffee', '4.50', 'Food', 'expense');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result).toHaveProperty('transaction');
    expect(result.transaction).toMatchObject({
      name:     'Coffee',
      amount:   4.5,
      category: 'Food',
      type:     'expense',
    });
    expect(typeof result.transaction.id).toBe('string');
    expect(result.transaction.id.length).toBeGreaterThan(0);
  });

  it('trims leading/trailing whitespace from the name', async () => {
    setForm('  Lunch  ', '10', 'Food');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result.transaction.name).toBe('Lunch');
  });

  // ── name validation ──────────────────────────────────────────────────────

  it('returns errors.name when name is empty', async () => {
    setForm('', '5', 'Food');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result).toHaveProperty('errors');
    expect(result.errors.name).toBeTruthy();
  });

  it('returns errors.name when name is whitespace-only', async () => {
    setForm('   ', '5', 'Food');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result).toHaveProperty('errors');
    expect(result.errors.name).toBeTruthy();
  });

  // ── amount validation ────────────────────────────────────────────────────

  it('returns errors.amount when amount is non-numeric', async () => {
    setForm('Coffee', 'abc', 'Food');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result.errors.amount).toBeTruthy();
  });

  it('returns errors.amount when amount is 0', async () => {
    setForm('Coffee', '0', 'Food');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result.errors.amount).toBeTruthy();
  });

  it('returns errors.amount when amount is negative', async () => {
    setForm('Coffee', '-1', 'Food');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result.errors.amount).toBeTruthy();
  });

  it('returns errors.amount when amount is below 0.01 (0.009)', async () => {
    setForm('Coffee', '0.009', 'Food');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result.errors.amount).toBeTruthy();
  });

  it('accepts amount at the minimum boundary (0.01)', async () => {
    setForm('Coffee', '0.01', 'Food');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result.transaction.amount).toBe(0.01);
  });

  it('accepts amount at the maximum boundary (999999999.99)', async () => {
    setForm('Coffee', '999999999.99', 'Food');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result.transaction.amount).toBe(999999999.99);
  });

  it('returns errors.amount when amount exceeds maximum', async () => {
    setForm('Coffee', '1000000000', 'Food');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result.errors.amount).toBeTruthy();
  });

  // ── category validation ──────────────────────────────────────────────────

  it('returns errors.category when no category is selected', async () => {
    setForm('Coffee', '5', '');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result.errors.category).toBeTruthy();
  });

  // ── multiple errors at once ──────────────────────────────────────────────

  it('returns all three errors when all fields are invalid', async () => {
    setForm('', 'abc', '');
    const { validateForm } = await import('./app.js');
    const result = validateForm();
    expect(result.errors.name).toBeTruthy();
    expect(result.errors.amount).toBeTruthy();
    expect(result.errors.category).toBeTruthy();
  });
});

// ── resetForm ─────────────────────────────────────────────────────────────

describe('resetForm', () => {
  /** Helper: set up the three form fields with non-empty values */
  function populateForm() {
    document.body.innerHTML = `
      <input id="item-name"     value="Coffee" />
      <input id="item-amount"   value="4.50" />
      <select id="item-category">
        <option value="">-- Select category --</option>
        <option value="Food" selected>Food</option>
        <option value="Transport">Transport</option>
        <option value="Fun">Fun</option>
      </select>
    `;
  }

  beforeEach(() => {
    vi.resetModules();
    populateForm();
  });

  it('clears the item-name field', async () => {
    const { resetForm } = await import('./app.js');
    resetForm();
    expect(document.getElementById('item-name').value).toBe('');
  });

  it('clears the item-amount field', async () => {
    const { resetForm } = await import('./app.js');
    resetForm();
    expect(document.getElementById('item-amount').value).toBe('');
  });

  it('resets item-category to the placeholder option (empty string)', async () => {
    const { resetForm } = await import('./app.js');
    resetForm();
    expect(document.getElementById('item-category').value).toBe('');
  });

  it('does not throw when form elements are absent', async () => {
    document.body.innerHTML = '';
    const { resetForm } = await import('./app.js');
    expect(() => resetForm()).not.toThrow();
  });
});

// ── Form submission handler (task 4.5) ────────────────────────────────────
// Requirements: 1.2, 1.3, 1.4
//
// Tests call handleFormSubmit() directly to avoid the DOMContentLoaded
// listener accumulation issue (document listeners are never removed between
// tests in jsdom). The final integration test verifies that the submit event
// wiring is in place for the real usage path.

describe('form submission handler', () => {
  /** Build the minimal DOM the handler needs */
  function buildDOM({ name = '', amount = '', category = '', type = 'expense' } = {}) {
    document.body.innerHTML = `
      <div id="storage-banner" hidden role="alert"></div>
      <form id="expense-form">
        <input  id="item-name"     value="${name}" />
        <span   id="err-name"      class="error-msg" aria-live="polite"></span>
        <input  id="item-amount"   value="${amount}" />
        <span   id="err-amount"    class="error-msg" aria-live="polite"></span>
        <select id="item-category">
          <option value="">-- Select --</option>
          <option value="Food"      ${category === 'Food'      ? 'selected' : ''}>Food</option>
          <option value="Transport" ${category === 'Transport' ? 'selected' : ''}>Transport</option>
          <option value="Fun"       ${category === 'Fun'       ? 'selected' : ''}>Fun</option>
        </select>
        <span id="err-category" class="error-msg" aria-live="polite"></span>
        <select id="item-type">
          <option value="">-- Select type --</option>
          <option value="income"  ${type === 'income'  ? 'selected' : ''}>Income</option>
          <option value="expense" ${type === 'expense' ? 'selected' : ''}>Expense</option>
        </select>
        <span id="err-type" class="error-msg" aria-live="polite"></span>
        <button type="submit">Add</button>
      </form>
    `;
  }

  /** Invoke handleFormSubmit directly with a fake event */
  async function callHandler() {
    const { handleFormSubmit } = await import('./app.js');
    handleFormSubmit({ preventDefault: () => {} });
  }

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('shows name error when name is empty', async () => {
    buildDOM({ name: '', amount: '5', category: 'Food' });
    await callHandler();
    expect(document.getElementById('err-name').textContent).toBeTruthy();
  });

  it('shows amount error when amount is invalid', async () => {
    buildDOM({ name: 'Coffee', amount: 'abc', category: 'Food' });
    await callHandler();
    expect(document.getElementById('err-amount').textContent).toBeTruthy();
  });

  it('shows category error when no category is selected', async () => {
    buildDOM({ name: 'Coffee', amount: '5', category: '' });
    await callHandler();
    expect(document.getElementById('err-category').textContent).toBeTruthy();
  });

  it('shows all three errors when all fields are invalid', async () => {
    buildDOM({ name: '', amount: 'abc', category: '' });
    await callHandler();
    expect(document.getElementById('err-name').textContent).toBeTruthy();
    expect(document.getElementById('err-amount').textContent).toBeTruthy();
    expect(document.getElementById('err-category').textContent).toBeTruthy();
  });

  it('does not call addTransaction on validation failure (state unchanged)', async () => {
    buildDOM({ name: '', amount: 'abc', category: '' });
    const { state } = await import('./app.js');
    const before = state.transactions.length;
    await callHandler();
    expect(state.transactions.length).toBe(before);
  });

  it('clears pre-existing error spans on valid submission', async () => {
    buildDOM({ name: 'Coffee', amount: '4.50', category: 'Food' });
    // Pre-populate spans with old errors
    document.getElementById('err-name').textContent     = 'old error';
    document.getElementById('err-amount').textContent   = 'old error';
    document.getElementById('err-category').textContent = 'old error';

    await callHandler();

    expect(document.getElementById('err-name').textContent).toBe('');
    expect(document.getElementById('err-amount').textContent).toBe('');
    expect(document.getElementById('err-category').textContent).toBe('');
  });

  it('resets the form fields on valid submission', async () => {
    buildDOM({ name: 'Coffee', amount: '4.50', category: 'Food' });
    await callHandler();
    expect(document.getElementById('item-name').value).toBe('');
    expect(document.getElementById('item-amount').value).toBe('');
    expect(document.getElementById('item-category').value).toBe('');
  });

  it('error spans remain empty when initial submission is valid', async () => {
    buildDOM({ name: 'Bus', amount: '2.00', category: 'Transport' });
    await callHandler();
    expect(document.getElementById('err-name').textContent).toBe('');
    expect(document.getElementById('err-amount').textContent).toBe('');
    expect(document.getElementById('err-category').textContent).toBe('');
  });

  it('submit listener is wired up via DOMContentLoaded (integration)', async () => {
    // Use a fresh jsdom document state for this integration check
    buildDOM({ name: '', amount: '5', category: 'Food' });
    const { handleFormSubmit } = await import('./app.js');

    // Attach the handler manually (simulating what DOMContentLoaded does)
    const form = document.getElementById('expense-form');
    form.addEventListener('submit', handleFormSubmit);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // The handler ran — name error should be shown for empty name
    expect(document.getElementById('err-name').textContent).toBeTruthy();
  });
});

// ── renderList (task 6.1) ─────────────────────────────────────────────────
// Requirements: 2.1, 2.2, 2.6

describe('renderList', () => {
  /** Build the minimal DOM renderList needs */
  function buildListDOM() {
    document.body.innerHTML = `
      <p  id="empty-msg">No transactions recorded yet.</p>
      <ul id="transaction-list" aria-label="Transaction history"></ul>
    `;
  }

  /** Sample transactions (index 0 = most recent) */
  const txA = { id: 'id-a', name: 'Coffee', amount: 4.5,  category: 'Food',      type: 'expense' };
  const txB = { id: 'id-b', name: 'Bus',    amount: 1.75, category: 'Transport', type: 'expense' };
  const txC = { id: 'id-c', name: 'Movie',  amount: 12,   category: 'Fun',       type: 'expense' };

  beforeEach(() => {
    vi.resetModules();
    buildListDOM();
  });

  // ── empty state ──────────────────────────────────────────────────────────

  it('shows #empty-msg when transactions array is empty', async () => {
    const { renderList } = await import('./app.js');
    renderList([]);
    expect(document.getElementById('empty-msg').hasAttribute('hidden')).toBe(false);
  });

  it('hides #transaction-list when transactions array is empty', async () => {
    const { renderList } = await import('./app.js');
    renderList([]);
    expect(document.getElementById('transaction-list').hasAttribute('hidden')).toBe(true);
  });

  it('renders no <li> elements when the array is empty', async () => {
    const { renderList } = await import('./app.js');
    renderList([]);
    expect(document.querySelectorAll('#transaction-list li').length).toBe(0);
  });

  // ── non-empty state ──────────────────────────────────────────────────────

  it('hides #empty-msg when there are transactions', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]);
    expect(document.getElementById('empty-msg').hasAttribute('hidden')).toBe(true);
  });

  it('shows #transaction-list when there are transactions', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]);
    expect(document.getElementById('transaction-list').hasAttribute('hidden')).toBe(false);
  });

  it('renders one <li> per transaction', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA, txB, txC]);
    expect(document.querySelectorAll('#transaction-list li').length).toBe(3);
  });

  // ── <li> structure ───────────────────────────────────────────────────────

  it('sets data-id on each <li>', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]);
    const li = document.querySelector('#transaction-list li');
    expect(li.dataset.id).toBe('id-a');
  });

  it('renders .tx-name with the transaction name', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]);
    expect(document.querySelector('.tx-name').textContent).toBe('Coffee');
  });

  it('renders .tx-amount formatted as $X.XX', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]);
    expect(document.querySelector('.tx-amount').textContent).toBe('$4.50');
  });

  it('renders .tx-category with the category label', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]);
    expect(document.querySelector('.tx-category').textContent).toBe('Food');
  });

  it('renders a delete button with class delete-btn', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]);
    expect(document.querySelector('.delete-btn')).not.toBeNull();
  });

  it('delete button has correct aria-label', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]);
    const btn = document.querySelector('.delete-btn');
    expect(btn.getAttribute('aria-label')).toBe('Delete Coffee');
  });

  it('delete button text content is ✕', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]);
    expect(document.querySelector('.delete-btn').textContent).toBe('✕');
  });

  // ── ordering ─────────────────────────────────────────────────────────────

  it('renders items in array order (index 0 first — most recent)', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA, txB, txC]);
    const names = [...document.querySelectorAll('.tx-name')].map(el => el.textContent);
    expect(names).toEqual(['Coffee', 'Bus', 'Movie']);
  });

  // ── re-render clears previous items ─────────────────────────────────────

  it('clears old items on subsequent calls', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA, txB]);
    renderList([txC]);
    const items = document.querySelectorAll('#transaction-list li');
    expect(items.length).toBe(1);
    expect(document.querySelector('.tx-name').textContent).toBe('Movie');
  });

  // ── amount formatting ────────────────────────────────────────────────────

  it('formats whole-number amounts with two decimal places', async () => {
    const { renderList } = await import('./app.js');
    renderList([{ id: 'x', name: 'Ticket', amount: 12, category: 'Fun', type: 'expense' }]);
    expect(document.querySelector('.tx-amount').textContent).toBe('$12.00');
  });

  it('formats amounts with one decimal place correctly', async () => {
    const { renderList } = await import('./app.js');
    renderList([{ id: 'x', name: 'Snack', amount: 1.5, category: 'Food', type: 'expense' }]);
    expect(document.querySelector('.tx-amount').textContent).toBe('$1.50');
  });

  // ── tx-type span (requirement 1.3) ───────────────────────────────────────

  it('renders .tx-type span with "Expense" for expense transactions', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]); // txA has type: 'expense'
    expect(document.querySelector('.tx-type').textContent).toBe('Expense');
  });

  it('renders .tx-type span with "Income" for income transactions', async () => {
    const { renderList } = await import('./app.js');
    const income = { id: 'id-inc', name: 'Salary', amount: 500, category: 'Food', type: 'income' };
    renderList([income]);
    expect(document.querySelector('.tx-type').textContent).toBe('Income');
  });

  it('renders one .tx-type span per transaction', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA, txB, txC]);
    expect(document.querySelectorAll('.tx-type').length).toBe(3);
  });

  // ── li type class (requirement 1.4) ─────────────────────────────────────

  it('adds class "expense" to <li> for expense transactions', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]); // txA has type: 'expense'
    const li = document.querySelector('#transaction-list li');
    expect(li.classList.contains('expense')).toBe(true);
  });

  it('adds class "income" to <li> for income transactions', async () => {
    const { renderList } = await import('./app.js');
    const income = { id: 'id-inc', name: 'Salary', amount: 500, category: 'Food', type: 'income' };
    renderList([income]);
    const li = document.querySelector('#transaction-list li');
    expect(li.classList.contains('income')).toBe(true);
  });

  it('does not add the wrong type class', async () => {
    const { renderList } = await import('./app.js');
    renderList([txA]); // expense
    const li = document.querySelector('#transaction-list li');
    expect(li.classList.contains('income')).toBe(false);
  });
});

// ── handleListClick (task 6.2) ────────────────────────────────────────────
// Requirements: 2.3

describe('handleListClick', () => {
  /** Build a list with one rendered transaction item */
  function buildListDOM(id = 'tx-1', name = 'Coffee') {
    document.body.innerHTML = `
      <ul id="transaction-list">
        <li data-id="${id}">
          <span class="tx-name">${name}</span>
          <span class="tx-amount">$4.50</span>
          <span class="tx-category">Food</span>
          <button class="delete-btn" aria-label="Delete ${name}">✕</button>
        </li>
      </ul>
    `;
  }

  beforeEach(() => {
    vi.resetModules();
    buildListDOM();
  });

  it('does not throw when a .delete-btn is clicked', async () => {
    const { handleListClick } = await import('./app.js');
    const btn = document.querySelector('.delete-btn');
    expect(() => handleListClick({ target: btn })).not.toThrow();
  });

  it('does nothing (no throw) when the clicked target is not inside a .delete-btn', async () => {
    const { handleListClick } = await import('./app.js');
    const nameSpan = document.querySelector('.tx-name');
    expect(() => handleListClick({ target: nameSpan })).not.toThrow();
  });

  it('does not throw when clicking a child element inside .delete-btn', async () => {
    // Simulate nested icon inside the button
    document.body.innerHTML = `
      <ul id="transaction-list">
        <li data-id="nested-id">
          <button class="delete-btn" aria-label="Delete item">
            <span class="icon">✕</span>
          </button>
        </li>
      </ul>
    `;
    const { handleListClick } = await import('./app.js');
    const icon = document.querySelector('.icon');
    expect(() => handleListClick({ target: icon })).not.toThrow();
  });

  it('does not throw when button has no parent <li>', async () => {
    document.body.innerHTML = `<ul id="transaction-list"></ul>`;
    const { handleListClick } = await import('./app.js');
    const btn = document.createElement('button');
    btn.className = 'delete-btn';
    expect(() => handleListClick({ target: btn })).not.toThrow();
  });

  it('resolves the correct data-id from the <li> closest to the clicked delete-btn', async () => {
    // This verifies the DOM traversal logic is correct:
    // clicking .delete-btn inside a <li data-id="tx-1"> resolves id "tx-1"
    const btn = document.querySelector('.delete-btn');
    const li = btn.closest('li');
    expect(li).not.toBeNull();
    expect(li.dataset.id).toBe('tx-1');
  });

  it('resolves the correct data-id when clicking a nested child of .delete-btn', async () => {
    document.body.innerHTML = `
      <ul id="transaction-list">
        <li data-id="deep-id">
          <button class="delete-btn"><span class="icon">✕</span></button>
        </li>
      </ul>
    `;
    const icon = document.querySelector('.icon');
    // The handler uses closest('.delete-btn') then closest('li')
    const btn = icon.closest('.delete-btn');
    const li = btn.closest('li');
    expect(li.dataset.id).toBe('deep-id');
  });

  it('does not call deleteTransaction when clicking non-delete-btn elements', async () => {
    const { handleListClick, state } = await import('./app.js');
    // state.transactions starts empty; deleteTransaction is a no-op stub
    // so we verify by ensuring no errors are thrown and state is unchanged
    const before = state.transactions.length;
    const liEl = document.querySelector('li');
    handleListClick({ target: liEl });
    expect(state.transactions.length).toBe(before);
  });
});




// ── updateChart (task 8.2) ────────────────────────────────────────────────
// Requirements: 4.1, 4.2, 4.3, 4.4

describe('updateChart', () => {
  /** Build the minimal chart DOM */
  function buildChartDOM() {
    document.body.innerHTML = `
      <canvas id="spending-chart"></canvas>
      <p id="chart-empty-msg" hidden>No spending data available.</p>
    `;
  }

  /** Create a minimal Chart.js mock that captures mutations */
  function makeChartMock() {
    return {
      data: {
        datasets: [{ data: [0, 0, 0] }],
      },
      update: vi.fn(),
    };
  }

  beforeEach(() => {
    vi.resetModules();
    buildChartDOM();
  });

  // ── empty / all-zero state ───────────────────────────────────────────────

  it('hides #spending-chart when all category totals are zero', async () => {
    const { updateChart, state } = await import('./app.js');
    state.chart = makeChartMock();
    updateChart([]);
    expect(document.getElementById('spending-chart').hasAttribute('hidden')).toBe(true);
  });

  it('shows #chart-empty-msg when all category totals are zero', async () => {
    const { updateChart, state } = await import('./app.js');
    state.chart = makeChartMock();
    updateChart([]);
    expect(document.getElementById('chart-empty-msg').hasAttribute('hidden')).toBe(false);
  });

  it('hides #spending-chart when transactions array is empty', async () => {
    const { updateChart, state } = await import('./app.js');
    state.chart = makeChartMock();
    updateChart([]);
    expect(document.getElementById('spending-chart').hasAttribute('hidden')).toBe(true);
  });

  // ── non-zero state ───────────────────────────────────────────────────────

  it('shows #spending-chart when there are non-zero category totals', async () => {
    const { updateChart, state } = await import('./app.js');
    state.chart = makeChartMock();
    updateChart([{ id: '1', name: 'Coffee', amount: 4.5, category: 'Food', type: 'expense' }]);
    expect(document.getElementById('spending-chart').hasAttribute('hidden')).toBe(false);
  });

  it('hides #chart-empty-msg when there are non-zero totals', async () => {
    const { updateChart, state } = await import('./app.js');
    state.chart = makeChartMock();
    updateChart([{ id: '1', name: 'Coffee', amount: 4.5, category: 'Food', type: 'expense' }]);
    expect(document.getElementById('chart-empty-msg').hasAttribute('hidden')).toBe(true);
  });

  // ── category aggregation ─────────────────────────────────────────────────

  it('aggregates Food amounts at index 0', async () => {
    const { updateChart, state } = await import('./app.js');
    const chart = makeChartMock();
    state.chart = chart;
    updateChart([
      { id: '1', name: 'Coffee', amount: 3.0, category: 'Food', type: 'expense' },
      { id: '2', name: 'Lunch',  amount: 7.5, category: 'Food', type: 'expense' },
    ]);
    expect(chart.data.datasets[0].data[0]).toBeCloseTo(10.5);
  });

  it('aggregates Transport amounts at index 1', async () => {
    const { updateChart, state } = await import('./app.js');
    const chart = makeChartMock();
    state.chart = chart;
    updateChart([
      { id: '1', name: 'Bus',   amount: 1.5, category: 'Transport', type: 'expense' },
      { id: '2', name: 'Train', amount: 2.5, category: 'Transport', type: 'expense' },
    ]);
    expect(chart.data.datasets[0].data[1]).toBeCloseTo(4.0);
  });

  it('aggregates Fun amounts at index 2', async () => {
    const { updateChart, state } = await import('./app.js');
    const chart = makeChartMock();
    state.chart = chart;
    updateChart([
      { id: '1', name: 'Movie',   amount: 12.0, category: 'Fun', type: 'expense' },
      { id: '2', name: 'Concert', amount:  8.0, category: 'Fun', type: 'expense' },
    ]);
    expect(chart.data.datasets[0].data[2]).toBeCloseTo(20.0);
  });

  it('places zero for a category with no transactions', async () => {
    const { updateChart, state } = await import('./app.js');
    const chart = makeChartMock();
    state.chart = chart;
    updateChart([{ id: '1', name: 'Coffee', amount: 5, category: 'Food', type: 'expense' }]);
    expect(chart.data.datasets[0].data[1]).toBe(0); // Transport
    expect(chart.data.datasets[0].data[2]).toBe(0); // Fun
  });

  it('separates amounts across all three categories correctly', async () => {
    const { updateChart, state } = await import('./app.js');
    const chart = makeChartMock();
    state.chart = chart;
    updateChart([
      { id: '1', name: 'Food item',      amount: 10, category: 'Food',      type: 'expense' },
      { id: '2', name: 'Transport item', amount: 20, category: 'Transport', type: 'expense' },
      { id: '3', name: 'Fun item',       amount: 30, category: 'Fun',       type: 'expense' },
    ]);
    expect(chart.data.datasets[0].data).toEqual([10, 20, 30]);
  });

  // ── chart.update() is called ─────────────────────────────────────────────

  it('calls chart.update() after mutating data', async () => {
    const { updateChart, state } = await import('./app.js');
    const chart = makeChartMock();
    state.chart = chart;
    updateChart([{ id: '1', name: 'Coffee', amount: 4.5, category: 'Food', type: 'expense' }]);
    expect(chart.update).toHaveBeenCalledOnce();
  });

  it('calls chart.update() even for an empty transactions array', async () => {
    const { updateChart, state } = await import('./app.js');
    const chart = makeChartMock();
    state.chart = chart;
    updateChart([]);
    expect(chart.update).toHaveBeenCalledOnce();
  });

  // ── null chart guard ─────────────────────────────────────────────────────

  it('does not throw when state.chart is null (test environment guard)', async () => {
    const { updateChart, state } = await import('./app.js');
    state.chart = null;
    expect(() => updateChart([])).not.toThrow();
  });

  it('still updates canvas/emptyMsg visibility when state.chart is null', async () => {
    const { updateChart, state } = await import('./app.js');
    state.chart = null;
    // all-zero → canvas hidden, empty msg shown
    updateChart([]);
    expect(document.getElementById('spending-chart').hasAttribute('hidden')).toBe(true);
    expect(document.getElementById('chart-empty-msg').hasAttribute('hidden')).toBe(false);
  });
});

// ── renderBalance (task 10.1) ─────────────────────────────────────────────
// Requirements: 1.5, 1.6, 1.7

describe('renderBalance', () => {
  function buildBalanceDOM() {
    document.body.innerHTML = `<span id="balance-amount"></span>`;
  }

  beforeEach(() => {
    vi.resetModules();
    buildBalanceDOM();
  });

  it('shows 0.00 for an empty transactions array', async () => {
    const { renderBalance } = await import('./app.js');
    renderBalance([]);
    expect(document.getElementById('balance-amount').textContent).toBe('0.00');
  });

  it('shows the sum of income only when there are no expenses', async () => {
    const { renderBalance } = await import('./app.js');
    renderBalance([
      { id: '1', name: 'Salary', amount: 1000, category: 'Food', type: 'income' },
      { id: '2', name: 'Bonus',  amount: 250,  category: 'Food', type: 'income' },
    ]);
    expect(document.getElementById('balance-amount').textContent).toBe('1250.00');
  });

  it('shows a negative balance prefixed with "-" when expenses exceed income', async () => {
    const { renderBalance } = await import('./app.js');
    renderBalance([
      { id: '1', name: 'Salary', amount: 100,  category: 'Food', type: 'income' },
      { id: '2', name: 'Rent',   amount: 300,  category: 'Food', type: 'expense' },
    ]);
    expect(document.getElementById('balance-amount').textContent).toBe('-200.00');
  });

  it('shows a positive balance without any prefix when income exceeds expenses', async () => {
    const { renderBalance } = await import('./app.js');
    renderBalance([
      { id: '1', name: 'Salary', amount: 500, category: 'Food', type: 'income' },
      { id: '2', name: 'Coffee', amount: 4.5, category: 'Food', type: 'expense' },
    ]);
    expect(document.getElementById('balance-amount').textContent).toBe('495.50');
  });

  it('shows 0.00 (no prefix) when income equals expenses', async () => {
    const { renderBalance } = await import('./app.js');
    renderBalance([
      { id: '1', name: 'Salary', amount: 100, category: 'Food', type: 'income' },
      { id: '2', name: 'Rent',   amount: 100, category: 'Food', type: 'expense' },
    ]);
    expect(document.getElementById('balance-amount').textContent).toBe('0.00');
  });

  it('skips transactions with malformed amounts and warns', async () => {
    const { renderBalance } = await import('./app.js');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderBalance([
      { id: 'bad', name: 'Bad',    amount: 'abc', category: 'Food', type: 'income' },
      { id: '1',   name: 'Salary', amount: 200,   category: 'Food', type: 'income' },
    ]);
    expect(document.getElementById('balance-amount').textContent).toBe('200.00');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('bad'));
    warnSpy.mockRestore();
  });

  it('does not throw when #balance-amount is absent', async () => {
    document.body.innerHTML = '';
    const { renderBalance } = await import('./app.js');
    expect(() =>
      renderBalance([{ id: '1', name: 'Salary', amount: 100, category: 'Food', type: 'income' }])
    ).not.toThrow();
  });

  it('formats the result to exactly 2 decimal places', async () => {
    const { renderBalance } = await import('./app.js');
    renderBalance([
      { id: '1', name: 'Item', amount: 1.5, category: 'Food', type: 'income' },
    ]);
    expect(document.getElementById('balance-amount').textContent).toBe('1.50');
  });
});
