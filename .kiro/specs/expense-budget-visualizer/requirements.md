# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, client-side web application that helps users track their daily spending. It provides a real-time view of the user's total balance, a scrollable history of transactions, and a pie chart visualizing spending distribution by category. The application requires no backend server, stores all data in the browser's Local Storage, and is built with plain HTML, CSS, and Vanilla JavaScript.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single spending entry consisting of an item name, a monetary amount, and a category.
- **Category**: One of three predefined spending classifications: Food, Transport, or Fun.
- **Transaction_List**: The scrollable on-screen list displaying all recorded transactions.
- **Balance_Display**: The UI element at the top of the page showing the user's current total balance.
- **Input_Form**: The form containing fields for item name, amount, and category used to add a new transaction.
- **Chart**: The pie chart visualization showing spending distribution by category.
- **Local_Storage**: The browser's Web Storage API used for client-side data persistence.
- **Validator**: The client-side input validation logic within the App.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to fill in an item name, amount, and category and submit the form, so that I can record a new transaction quickly.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name accepting 1–100 characters, a numeric field for the amount accepting values between 0.01 and 999,999,999.99, and a dropdown selector for the category with options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with the item name containing at least 1 non-whitespace character, the amount containing a numeric value between 0.01 and 999,999,999.99, and a category selected, THE App SHALL add the transaction to the Transaction_List and persist it to Local_Storage.
3. IF the user submits the Input_Form with the item name empty or whitespace-only, the amount empty or outside the range 0.01 to 999,999,999.99 or non-numeric, or no category selected, THEN THE Validator SHALL display an inline error message per invalid field indicating the specific validation rule that was violated and SHALL NOT add the transaction to the Transaction_List.
4. WHEN a transaction is successfully added, THE Input_Form SHALL reset the item name field to empty, the amount field to empty, and the category dropdown to its default unselected placeholder state.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my recorded transactions in a scrollable list, so that I can review my spending history at a glance.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions in reverse-chronological order (most recently added first), each showing the item name, amount, and category.
2. WHILE the number of transactions exceeds the visible area of the Transaction_List, THE App SHALL render the Transaction_List as a scrollable container without truncating any entries.
3. WHEN the user taps or clicks the delete control on a transaction entry, THE App SHALL remove that transaction from the Transaction_List and from Local_Storage.
4. WHEN Local_Storage contains previously saved transactions on page load and the data is valid, THE App SHALL populate the Transaction_List with those transactions before any user interaction.
5. IF Local_Storage data cannot be parsed on page load, THEN THE App SHALL initialize the Transaction_List as empty and display a message indicating that saved data could not be loaded.
6. IF the Transaction_List contains no transactions, THEN THE App SHALL display a placeholder message indicating that no transactions have been recorded yet.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total amount spent at the top of the page, so that I always know how much I have recorded.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts currently in Local_Storage, formatted as a numeric value with exactly 2 decimal places.
2. WHEN a new transaction is added via the Input_Form, THE Balance_Display SHALL update to reflect the new total before the user performs any further interaction.
3. WHEN a transaction is deleted from the Transaction_List, THE Balance_Display SHALL update to reflect the revised total before the user performs any further interaction.
4. WHEN Local_Storage is empty, THE Balance_Display SHALL show a total of 0.00.
5. IF a stored transaction contains a malformed or non-numeric amount value, THEN THE App SHALL exclude that entry from the Balance_Display total and log a warning to the browser console.

---

### Requirement 4: Spending Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going visually.

#### Acceptance Criteria

1. THE Chart SHALL render a pie chart displaying one segment per category (Food, Transport, Fun) that has a total spending amount greater than zero, where each segment is labeled with the category name and its percentage of total spending rounded to one decimal place.
2. WHEN a new transaction is added, THE Chart SHALL update to reflect the new category distribution without requiring a page reload.
3. WHEN a transaction is deleted, THE Chart SHALL update to reflect the revised category distribution without requiring a page reload.
4. WHEN all transactions are deleted and no transactions remain, THE Chart SHALL display a placeholder message indicating no spending data is available, replacing the chart segments.
5. THE App SHALL use Chart.js to render the pie chart.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between sessions, so that I do not lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a transaction is added or deleted, THE App SHALL serialize the complete updated transaction list as a JSON string and write it to Local Storage under the key `"transactions"`.
2. WHEN the App initializes on page load, THE App SHALL read the value stored under the key `"transactions"` from Local Storage and deserialize it into the in-memory transaction array.
3. IF Local Storage is unavailable or the read operation throws an error, THEN THE App SHALL initialize with an empty transaction array and display a persistent banner informing the user that data persistence is unavailable.
4. IF the value read from Local Storage under the key `"transactions"` is not valid JSON or cannot be deserialized into an array, THEN THE App SHALL discard the stored value, initialize with an empty transaction array, and display a persistent banner informing the user that saved data could not be loaded.
5. THE App SHALL ensure that serializing a transaction array to JSON and immediately deserializing it produces an array where each transaction has identical field values to the original.

---

### Requirement 6: Responsive Mobile-Friendly Layout

**User Story:** As a user on a mobile device, I want the app to display correctly on my phone screen, so that I can use it comfortably without zooming or horizontal scrolling.

#### Acceptance Criteria

1. THE App SHALL use a responsive layout that reflows content into a single-column stack at viewport widths from 320px to 480px, a two-column layout from 481px to 1024px, and a multi-column layout from 1025px to 1920px, with no horizontal scrollbar at any width within this range.
2. WHILE the viewport width is 480px or less, THE App SHALL render all interactive elements (input fields, buttons, list items) at a touch-friendly minimum tap target size of 44×44 CSS pixels.
3. WHILE the viewport width is 480px or less, THE App SHALL render all body text at a minimum font size of 16 CSS pixels to prevent the browser from triggering auto-zoom on input focus.
4. THE App SHALL set the HTML viewport meta tag to `width=device-width, initial-scale=1` to ensure correct scaling on mobile browsers.
5. THE App SHALL be operable — meaning all features render without layout breakage and all interactive elements are reachable and activatable — on the two most recent major versions of Chrome, Firefox, Edge, and Safari, without polyfills or additional configuration.
