# Design Document

## Overview

Dokumen ini mendeskripsikan desain teknis untuk lima peningkatan fitur pada aplikasi **Expense & Budget Visualizer** yang sudah ada. Aplikasi saat ini adalah single-page web app berbasis vanilla JavaScript (ES Modules), Vitest untuk pengujian, jsdom sebagai environment pengujian, dan Chart.js untuk visualisasi pie chart.

Lima fitur yang akan diimplementasikan:

1. **Transaction Type** — Tambah field `type` ("income"/"expense") ke setiap transaksi, ubah balance display menjadi NetBalance, dan beri pewarnaan visual berbeda per tipe.
2. **localStorage Persistence** — Perbaiki dan perluas mekanisme penyimpanan yang sudah ada: round-trip safety, banner informatif, dan dukungan field `type` baru.
3. **Dark / Light Mode Toggle** — Tombol toggle yang menyimpan preferensi theme ke localStorage dan menerapkan class CSS `dark-mode` pada `<body>`.
4. **Custom Categories** — Antarmuka untuk membuat dan menghapus kategori kustom, disimpan terpisah di localStorage, digabung dengan kategori bawaan di `<select>`.
5. **Sort Transactions** — Kontrol UI untuk mengurutkan daftar tampilan berdasarkan `amount` atau `category` (tanpa mengubah urutan array `state.transactions`).

---

## Architecture

Aplikasi menggunakan arsitektur **single-file module** (`app.js`) dengan pola **unidirectional data flow**:

```
User Interaction
      │
      ▼
 Event Handler  (handleFormSubmit, handleListClick, handleThemeToggle,
                 handleCategoryAdd, handleCategoryDelete, handleSortChange)
      │
      ▼
  State Mutation  (state.transactions, state.categories, state.theme, state.sortConfig)
      │
      ▼
  Persistence     (saveToStorage, saveCategoryToStorage, saveThemeToStorage, saveSortConfigToStorage)
      │
      ▼
  Renderer        (renderList, renderBalance, updateChart, renderTheme,
                  renderCategorySelect, renderSortControls)
      │
      ▼
     DOM
```

Tidak ada framework; semua operasi DOM dilakukan secara imperatif. State adalah satu-satunya sumber kebenaran — DOM dan localStorage adalah proyeksi dari state.

### Diagram Komponen

```mermaid
graph TD
    subgraph State
        S1[transactions: Transaction[]]
        S2[categories: string[]]
        S3[theme: 'light' | 'dark']
        S4[sortConfig: SortConfig]
    end

    subgraph StorageAdapter
        SA1[loadFromStorage]
        SA2[saveToStorage]
        SA3[loadCategories]
        SA4[saveCategories]
        SA5[loadTheme]
        SA6[saveTheme]
        SA7[loadSortConfig]
        SA8[saveSortConfig]
    end

    subgraph Validator
        V1[validateForm]
        V2[validateCategoryName]
        V3[validateSortConfig]
    end

    subgraph Renderer
        R1[renderList]
        R2[renderBalance]
        R3[updateChart]
        R4[renderTheme]
        R5[renderCategorySelect]
        R6[renderSortControls]
    end

    subgraph EventHandlers
        E1[handleFormSubmit]
        E2[handleListClick]
        E3[handleThemeToggle]
        E4[handleCategoryAdd]
        E5[handleCategoryDelete]
        E6[handleSortChange]
    end

    E1 --> V1
    E4 --> V2
    E1 --> S1
    E2 --> S1
    E3 --> S3
    E4 --> S2
    E5 --> S2
    E6 --> S4

    S1 --> SA2
    S2 --> SA4
    S3 --> SA6
    S4 --> SA8

    SA1 --> S1
    SA3 --> S2
    SA5 --> S3
    SA7 --> S4

    S1 --> R1
    S1 --> R2
    S1 --> R3
    S2 --> R5
    S3 --> R4
    S4 --> R1
```

---

## Components and Interfaces

### 1. Data State Object

```javascript
/**
 * @typedef {Object} AppState
 * @property {Transaction[]} transactions  - Array transaksi (index 0 = terbaru)
 * @property {string[]}      categories   - Semua kategori: bawaan + kustom
 * @property {'light'|'dark'} theme       - Theme aktif
 * @property {SortConfig}    sortConfig   - Konfigurasi pengurutan aktif
 */
export const state = {
  transactions: [],
  categories: ['Food', 'Transport', 'Fun'],
  theme: 'light',
  sortConfig: { field: 'none', direction: 'asc' },
  chart: null,
};
```

### 2. Validator

**`validateForm()`** — Diperluas untuk membaca field `#item-type` dan mengembalikan `errors.type` jika tidak dipilih.

```javascript
/**
 * @returns {{ transaction: Transaction } | { errors: FieldErrors }}
 */
export function validateForm() { ... }
```

**`validateCategoryName(name, existingCategories)`** — Baru. Memvalidasi nama kategori kustom.

```javascript
/**
 * @param {string}   name
 * @param {string[]} existingCategories - Semua kategori saat ini (bawaan + kustom)
 * @returns {{ valid: true } | { error: string }}
 */
export function validateCategoryName(name, existingCategories) { ... }
```

### 3. StorageAdapter

Diperluas dengan fungsi-fungsi baru:

| Fungsi | Kunci | Deskripsi |
|---|---|---|
| `loadFromStorage()` | `"transactions"` | Ada; diperluas: entri tanpa `type` dikecualikan |
| `saveToStorage(txs)` | `"transactions"` | Ada; tidak berubah |
| `loadCategories()` | `"categories"` | **Baru**: Memuat array custom categories |
| `saveCategories(cats)` | `"categories"` | **Baru**: Menyimpan array custom categories |
| `loadTheme()` | `"theme"` | **Baru**: Memuat preferensi theme |
| `saveTheme(theme)` | `"theme"` | **Baru**: Menyimpan preferensi theme |
| `loadSortConfig()` | `"sortConfig"` | **Baru**: Memuat sort config |
| `saveSortConfig(cfg)` | `"sortConfig"` | **Baru**: Menyimpan sort config |

### 4. Renderer Functions

**`renderList(transactions, sortConfig)`** — Diperluas untuk:
- Memanggil `sortTransactions(transactions, sortConfig)` sebelum rendering
- Menambah `<span class="tx-type">` dan class `income`/`expense` pada setiap `<li>`

**`renderBalance(transactions)`** — Diubah untuk menghitung NetBalance:
```
netBalance = Σ(income amounts) − Σ(expense amounts)
```

**`renderTheme(theme)`** — **Baru**: Toggle class `dark-mode` pada `<body>` dan ubah teks tombol.

**`renderCategorySelect(categories)`** — **Baru**: Rebuild opsi `<select id="item-category">` dari array `state.categories`, menjaga kategori bawaan di posisi pertama.

**`updateChart(transactions)`** — Diperluas untuk hanya menghitung total dari transaksi `"expense"`, karena chart menampilkan pengeluaran per kategori.

### 5. Sort Engine

**`sortTransactions(transactions, sortConfig)`** — **Baru**: Mengembalikan salinan array yang diurutkan tanpa mengubah `state.transactions`.

```javascript
/**
 * @param {Transaction[]} transactions
 * @param {SortConfig}    sortConfig
 * @returns {Transaction[]}  Sorted copy, original unchanged
 */
export function sortTransactions(transactions, sortConfig) { ... }
```

Logika pengurutan:
- `field: 'none'` → kembalikan `[...transactions]` (preserves order)
- `field: 'amount'` → urutkan numerik
- `field: 'category'` → urutkan string case-insensitive, stable sort (Array.prototype.sort di V8/SpiderMonkey adalah stable)
- `direction: 'desc'` → balikkan urutan

### 6. Event Handlers (Baru)

```javascript
export function handleThemeToggle() { ... }   // klik tombol toggle theme
export function handleCategoryAdd(event) { ... }   // submit form kategori
export function handleCategoryDelete(event) { ... } // klik delete pada item kategori
export function handleSortChange() { ... }   // change pada sort dropdown
```

---

## Data Models

### Transaction (Diperluas)

```javascript
/**
 * @typedef {Object} Transaction
 * @property {string}            id         - UUID
 * @property {string}            name       - 1–100 karakter non-whitespace
 * @property {number}            amount     - float, 0.01–999,999,999.99
 * @property {'income'|'expense'} type      - Tipe transaksi (BARU)
 * @property {string}            category   - Kategori bawaan atau kustom
 * @property {number}            [createdAt] - timestamp (opsional, untuk future use)
 */
```

**Perubahan dari model lama:** Tambah field wajib `type: 'income' | 'expense'`. Entri lama tanpa `type` akan dikecualikan saat loading.

### CustomCategory

Custom categories disimpan sebagai array of strings di localStorage:

```javascript
// localStorage["categories"] = JSON.stringify(["Kesehatan", "Hiburan"])
// state.categories = ["Food", "Transport", "Fun", "Kesehatan", "Hiburan"]
```

Bawaan (Food, Transport, Fun) **tidak** disimpan di localStorage — selalu di-hardcode dalam inisialisasi.

### SortConfig

```javascript
/**
 * @typedef {Object} SortConfig
 * @property {'amount'|'category'|'none'} field
 * @property {'asc'|'desc'}              direction
 */
const DEFAULT_SORT_CONFIG = { field: 'none', direction: 'asc' };
```

### FieldErrors (Diperluas)

```javascript
/**
 * @typedef {Object} FieldErrors
 * @property {string} [name]
 * @property {string} [amount]
 * @property {string} [type]      // BARU
 * @property {string} [category]
 */
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Transaction type is preserved in validated output

*For any* valid form submission that includes a selected `type` value of `"income"` or `"expense"`, the Transaction object returned by `validateForm()` SHALL have a `type` field equal to the submitted value.

**Validates: Requirements 1.1**

---

### Property 2: Missing type field triggers validation error

*For any* otherwise-valid form input where the `type` field is empty or not selected, `validateForm()` SHALL return `errors.type` that is truthy.

**Validates: Requirements 1.2**

---

### Property 3: NetBalance equals income minus expense

*For any* array of transactions with mixed `type` values, `renderBalance()` SHALL display a value on `#balance-amount` equal to `(sum of all income amounts) − (sum of all expense amounts)`, formatted to exactly two decimal places.

**Validates: Requirements 1.7**

---

### Property 4: Rendered list items carry correct type class and label

*For any* array of transactions passed to `renderList()`, every rendered `<li>` SHALL have a CSS class matching its transaction's `type` (`"income"` or `"expense"`) and SHALL contain text displaying the correct type label (`"Income"` or `"Expense"`).

**Validates: Requirements 1.3, 1.4**

---

### Property 5: Entries without a `type` field are excluded on load

*For any* array stored in localStorage where some entries are missing the `type` field, `loadFromStorage()` SHALL return only the entries that have a valid `type` field, excluding all others.

**Validates: Requirements 1.9**

---

### Property 6: Storage round-trip preserves all transaction data

*For any* valid array of Transaction objects (each with `id`, `name`, `amount`, `type`, and `category`), calling `saveToStorage(array)` followed by `loadFromStorage()` SHALL return an array with the same length and identical values for `id`, `name`, `amount`, `type`, and `category` at every corresponding index.

**Validates: Requirements 2.9**

---

### Property 7: Delete removes the target transaction from storage

*For any* transaction array, after calling `deleteTransaction(id)` for a transaction at a given index, calling `loadFromStorage()` SHALL return an array that does not contain any entry with the deleted `id`.

**Validates: Requirements 2.2**

---

### Property 8: Theme toggle switches body class and button label

*For any* starting theme state (`"light"` or `"dark"`), clicking the theme toggle button SHALL flip the `dark-mode` class on `<body>` to its opposite state and update the button text to the correct opposing label (`"🌙 Dark Mode"` ↔ `"☀️ Light Mode"`).

**Validates: Requirements 3.2, 3.5, 3.6**

---

### Property 9: Theme toggle persists the new theme to storage

*For any* starting theme state, after clicking the toggle button, the value stored at localStorage key `"theme"` SHALL equal the newly active theme.

**Validates: Requirements 3.3**

---

### Property 10: Category validator rejects whitespace and over-length names

*For any* string composed entirely of whitespace characters, or any string exceeding 50 characters, `validateCategoryName()` SHALL return an `{ error }` object rather than `{ valid: true }`.

**Validates: Requirements 4.2**

---

### Property 11: Category validator rejects case-insensitive duplicates

*For any* existing category list and any new name that is a case-insensitive match for an existing entry (including built-ins Food, Transport, Fun), `validateCategoryName()` SHALL return an `{ error }` object.

**Validates: Requirements 4.3**

---

### Property 12: Invalid category add leaves state.categories unchanged

*For any* invalid category name submission, `state.categories.length` SHALL be identical before and after the attempted add.

**Validates: Requirements 4.4**

---

### Property 13: Built-in categories always appear first in the select

*For any* configuration of custom categories in `state.categories`, after calling `renderCategorySelect()`, the first three non-placeholder `<option>` elements in `<select id="item-category">` SHALL always be `"Food"`, `"Transport"`, and `"Fun"` in that order.

**Validates: Requirements 4.8**

---

### Property 14: Category deletion preserves transaction category names

*For any* transaction array containing transactions that use a custom category name, deleting that custom category from `state.categories` SHALL NOT modify the `category` field of any existing transaction.

**Validates: Requirements 4.9**

---

### Property 15: Loaded categories merge with built-ins

*For any* array of custom category strings stored under localStorage key `"categories"`, after `loadCategories()`, `state.categories` SHALL contain all three built-in categories (`"Food"`, `"Transport"`, `"Fun"`) plus all loaded custom categories.

**Validates: Requirements 4.7**

---

### Property 16: Sort by amount produces numerically ordered output

*For any* transaction array sorted by `{ field: 'amount', direction: 'asc' }`, every adjacent pair in the returned array SHALL satisfy `a[i].amount <= a[i+1].amount`. For `direction: 'desc'`, every adjacent pair SHALL satisfy `a[i].amount >= a[i+1].amount`. In both cases, `state.transactions` SHALL remain unchanged.

**Validates: Requirements 5.3, 5.4**

---

### Property 17: Sort by category produces case-insensitive alphabetical order

*For any* transaction array sorted by `{ field: 'category', direction: 'asc' }`, every adjacent pair in the returned array SHALL satisfy `a[i].category.toLowerCase() <= a[i+1].category.toLowerCase()`. For `direction: 'desc'`, the relation SHALL be `>=`. Ties SHALL preserve the original relative order (stable sort). `state.transactions` SHALL remain unchanged.

**Validates: Requirements 5.3, 5.5**

---

### Property 18: Sort with field "none" returns original order

*For any* transaction array, `sortTransactions(transactions, { field: 'none', direction: 'asc' })` and `sortTransactions(transactions, { field: 'none', direction: 'desc' })` SHALL both return an array whose elements are in the same order as `state.transactions`, regardless of direction.

**Validates: Requirements 5.6**

---

## Error Handling

### Form Validation Errors
- Setiap field error ditampilkan secara inline di `<span id="err-*">` yang bersesuaian.
- Semua error dikumpulkan dalam satu pass (tidak early-return) agar semua pesan muncul bersamaan.
- Span error dikosongkan sebelum validasi pada setiap submission.

### Storage Errors
- `saveToStorage`, `saveCategories`, `saveTheme`, `saveSortConfig` masing-masing dibungkus `try/catch` dan mengembalikan `boolean`.
- Jika salah satu operasi tulis gagal, `#storage-banner` ditampilkan dengan pesan yang sesuai.
- `loadFromStorage` mengembalikan `null` pada JSON tidak valid atau localStorage tidak tersedia; App menginisialisasi ke `[]`.

### Custom Category Errors
- Error duplikat dan panjang berlebih ditampilkan di `<span id="err-category-name">` (elemen baru).
- Input tidak dikosongkan saat error (sesuai Requirement 4.4).
- Batas 50 kategori kustom ditolak dengan pesan error spesifik.

### Sort Config Errors
- Jika nilai dari localStorage bukan SortConfig valid, gunakan default `{ field: 'none', direction: 'asc' }`.
- `sortTransactions` menggunakan `localeCompare` untuk string sort agar aman terhadap karakter internasional.

### Theme Errors
- Nilai theme dari localStorage yang bukan `"light"` atau `"dark"` di-default ke `"light"`.

---

## Testing Strategy

### Framework & Tools
- **Unit / Property tests**: Vitest (`vitest --run`) + `fast-check` (sudah ada di devDependencies)
- **Environment**: jsdom (sudah dikonfigurasi di `vitest.config.js`)
- **Property-based testing library**: `fast-check` v3

### Dual Testing Approach

**Unit tests** — Uji kasus spesifik, edge case, dan error path:
- Inisialisasi DOMContentLoaded dengan berbagai state localStorage
- Error banner saat storage gagal
- Tombol toggle hadir di DOM
- Default sort config saat localStorage kosong
- Batas 50 kategori kustom

**Property tests** — Verifikasi properti universal menggunakan `fast-check`:
- Konfigurasi minimum **100 iterasi** per property test
- Setiap test diberi tag komentar yang mereferensikan properti desain

### Property Test Tags

Format tag: `// Feature: website-enhancement, Property {N}: {property title}`

Contoh implementasi:

```javascript
import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';

// Feature: website-enhancement, Property 6: Storage round-trip preserves all transaction data
it('round-trip: saveToStorage then loadFromStorage returns identical array', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id:       fc.uuid(),
          name:     fc.string({ minLength: 1, maxLength: 100 }),
          amount:   fc.float({ min: 0.01, max: 999999999.99, noNaN: true }),
          type:     fc.constantFrom('income', 'expense'),
          category: fc.constantFrom('Food', 'Transport', 'Fun'),
        }),
        { minLength: 0, maxLength: 50 }
      ),
      (transactions) => {
        saveToStorage(transactions);
        const loaded = loadFromStorage();
        expect(loaded).toEqual(transactions);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test File Organization

```
app.test.js           — Existing tests (tidak dihapus, hanya ditambah)
app.types.test.js     — Property 1, 2, 3, 4, 5 (Transaction type)
app.storage.test.js   — Property 6, 7 (Storage round-trip & delete)
app.theme.test.js     — Property 8, 9 (Theme toggle)
app.categories.test.js — Property 10, 11, 12, 13, 14, 15 (Custom categories)
app.sort.test.js      — Property 16, 17, 18 (Sort engine)
```

### Coverage Targets
- Semua 18 correctness properties harus memiliki masing-masing minimal 1 property-based test
- Setiap `export function` baru harus memiliki unit test untuk happy path dan error path
- `loadFromStorage` (yang dimodifikasi) harus diuji dengan skenario entri tanpa `type`
