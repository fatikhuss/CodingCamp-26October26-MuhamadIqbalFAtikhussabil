# Requirements Document

## Introduction

Peningkatan fitur pada website Expense & Budget Visualizer yang sudah ada. Website saat ini mendukung pencatatan transaksi pengeluaran dengan tiga kategori tetap (Food, Transport, Fun), validasi formulir, penyimpanan localStorage, visualisasi pie chart Chart.js, serta tampilan saldo total. Peningkatan ini menambahkan: tipe transaksi (income/expense), perbaikan dan konfirmasi mekanisme penyimpanan localStorage, toggle dark/light mode, kategori kustom yang dapat dibuat pengguna, dan pengurutan transaksi berdasarkan jumlah atau kategori.

## Glossary

- **App**: Aplikasi Expense & Budget Visualizer secara keseluruhan.
- **Transaction**: Satu entri keuangan dengan properti id, name, amount, type, category, dan createdAt.
- **Type**: Jenis transaksi — `"income"` (pemasukan) atau `"expense"` (pengeluaran).
- **Category**: Label pengelompokan transaksi; dapat berupa kategori bawaan (Food, Transport, Fun) atau kategori kustom yang dibuat pengguna.
- **CustomCategory**: Kategori yang dibuat pengguna dengan nama unik, disimpan terpisah dari daftar transaksi.
- **State**: Objek memori tunggal `state` yang menjadi sumber kebenaran untuk `transactions`, `categories`, `theme`, dan `sortConfig`.
- **Storage**: `localStorage` browser yang digunakan untuk mempertahankan data antarsesi.
- **Banner**: Elemen `#storage-banner` yang menampilkan pesan error penyimpanan kepada pengguna.
- **Theme**: Preferensi tampilan pengguna — `"light"` atau `"dark"`.
- **SortConfig**: Objek `{ field: "amount" | "category" | "none", direction: "asc" | "desc" }` yang mendefinisikan urutan tampilan daftar transaksi.
- **NetBalance**: Selisih antara total pemasukan dan total pengeluaran (`totalIncome - totalExpense`).
- **Validator**: Komponen logika yang membaca nilai formulir dan mengembalikan objek Transaction atau FieldErrors.
- **Renderer**: Komponen yang memperbarui DOM berdasarkan state terkini.
- **StorageAdapter**: Modul yang menangani operasi baca/tulis localStorage.

---

## Requirements

### Requirement 1: Tipe Transaksi (Income / Expense)

**User Story:** Sebagai pengguna, saya ingin memilih apakah suatu transaksi adalah pemasukan atau pengeluaran, sehingga saya dapat melacak arus kas secara akurat.

#### Acceptance Criteria

1. THE Validator SHALL menyertakan field `type` dengan nilai `"income"` atau `"expense"` pada setiap Transaction yang valid.
2. WHEN pengguna mengirimkan formulir tanpa memilih tipe transaksi, THE Validator SHALL mengembalikan `errors.type` berisi pesan error.
3. THE Renderer SHALL menampilkan label tipe (`"Income"` atau `"Expense"`) pada setiap item `<li>` di daftar transaksi.
4. THE Renderer SHALL menerapkan class CSS `"income"` pada item `<li>` untuk tipe `"income"` dan class CSS `"expense"` untuk tipe `"expense"`, sehingga keduanya dapat dibedakan secara visual melalui atribut class.
5. WHEN pengguna memilih tipe `"income"`, THE App SHALL menampilkan jumlah tersebut sebagai penambah saldo di tampilan balance.
6. WHEN pengguna memilih tipe `"expense"`, THE App SHALL menampilkan jumlah tersebut sebagai pengurang saldo di tampilan balance.
7. THE Renderer SHALL menampilkan NetBalance (totalIncome - totalExpense) pada `#balance-amount`, diformat dua desimal; nilai positif atau nol ditampilkan tanpa tanda, nilai negatif diawali tanda minus (`-`).
8. THE StorageAdapter SHALL menyertakan field `type` saat menyimpan dan memuat Transaction dari Storage.
9. IF THE StorageAdapter memuat Transaction dari Storage yang tidak memiliki field `type`, THEN entri tersebut SHALL diabaikan dan dikecualikan dari array yang dikembalikan.

---

### Requirement 2: Penyimpanan Transaksi dengan localStorage

**User Story:** Sebagai pengguna, saya ingin transaksi yang saya tambahkan tersimpan secara permanen, sehingga data tidak hilang saat saya menyegarkan atau menutup halaman.

#### Acceptance Criteria

1. WHEN pengguna menambahkan transaksi valid, THE StorageAdapter SHALL menyimpan array `state.transactions` yang diperbarui ke Storage di bawah kunci `"transactions"`.
2. WHEN pengguna menghapus transaksi, THE StorageAdapter SHALL menyimpan array `state.transactions` yang diperbarui ke Storage.
3. WHEN halaman dimuat (`DOMContentLoaded`), THE App SHALL membaca kunci `"transactions"` dari Storage dan memuat hasilnya ke `state.transactions`.
4. IF Storage mengembalikan `null` saat halaman dimuat, THEN THE App SHALL menginisialisasi `state.transactions` dengan array kosong `[]` dan menampilkan Banner yang menginformasikan bahwa belum ada data transaksi tersimpan.
5. IF JSON yang tersimpan tidak valid saat parsing, THEN THE App SHALL menginisialisasi `state.transactions` dengan `[]` dan menampilkan Banner yang menginformasikan bahwa data transaksi sebelumnya tidak dapat dibaca.
6. IF Banner sedang ditampilkan DAN data valid berhasil dimuat dari Storage, THEN THE App SHALL menyembunyikan Banner.
7. IF operasi tulis ke Storage gagal (kuota penuh atau mode privat), THEN THE StorageAdapter SHALL mengembalikan `false` dan THE App SHALL menampilkan Banner dengan pesan bahwa data tidak akan tersimpan.
8. THE StorageAdapter SHALL mengembalikan `true` setelah operasi tulis berhasil.
9. FOR ALL array Transaction yang valid, menyimpan lalu memuat ulang dari Storage SHALL menghasilkan array dengan jumlah elemen yang sama serta nilai identik pada properti `id`, `description`, `amount`, dan `type` di setiap indeks yang bersesuaian (round-trip property).

---

### Requirement 3: Dark / Light Mode Toggle

**User Story:** Sebagai pengguna, saya ingin dapat beralih antara tampilan terang dan gelap, sehingga saya dapat menggunakan aplikasi dengan nyaman di berbagai kondisi pencahayaan.

#### Acceptance Criteria

1. THE App SHALL menyediakan tombol toggle yang dapat diklik untuk berpindah antara Theme `"light"` dan `"dark"`.
2. WHEN pengguna mengklik tombol toggle, THE Renderer SHALL menambahkan atau menghapus class `"dark-mode"` pada elemen `<body>` sesuai Theme yang aktif.
3. WHEN pengguna mengklik tombol toggle, THE App SHALL menyimpan preferensi Theme ke Storage di bawah kunci `"theme"`.
4. WHEN halaman dimuat, THE App SHALL membaca kunci `"theme"` dari Storage dan menerapkan Theme yang tersimpan; IF nilai yang tersimpan bukan `"light"` atau `"dark"` atau tidak ada, THEN THE App SHALL menerapkan Theme `"light"` sebagai default.
5. IF Theme yang aktif adalah `"light"`, THEN THE Renderer SHALL menampilkan teks atau ikon tombol toggle sebagai `"🌙 Dark Mode"`.
6. IF Theme yang aktif adalah `"dark"`, THEN THE Renderer SHALL menampilkan teks atau ikon tombol toggle sebagai `"☀️ Light Mode"`.
7. WHILE Theme `"dark"` aktif, THE App SHALL menerapkan class `"dark-mode"` pada `<body>`, yang melalui CSS mendefinisikan warna latar belakang gelap dan warna teks terang.
8. WHILE Theme `"light"` aktif, THE App SHALL memastikan class `"dark-mode"` tidak ada pada `<body>`, yang melalui CSS mendefinisikan warna latar belakang terang dan warna teks gelap.

---

### Requirement 4: Kategori Kustom

**User Story:** Sebagai pengguna, saya ingin membuat kategori sendiri untuk transaksi, sehingga saya dapat mengorganisir pengeluaran dan pemasukan sesuai kebutuhan saya.

#### Acceptance Criteria

1. THE App SHALL menyediakan antarmuka (input teks dan tombol) bagi pengguna untuk membuat CustomCategory baru dengan nama maksimum 50 karakter.
2. WHEN pengguna mengirimkan nama CustomCategory baru, THE Validator SHALL memvalidasi bahwa nama tidak kosong, tidak hanya mengandung spasi, dan tidak melebihi 50 karakter.
3. WHEN pengguna mengirimkan nama CustomCategory baru, THE Validator SHALL memvalidasi bahwa nama belum ada di daftar kategori manapun (termasuk kategori bawaan Food, Transport, Fun) secara case-insensitive.
4. IF nama CustomCategory tidak valid (kosong, hanya spasi, terlalu panjang, atau duplikat), THEN THE App SHALL menampilkan pesan error inline tanpa menambahkan kategori dan tanpa mengosongkan input.
5. WHEN CustomCategory valid ditambahkan, THE App SHALL menambahkannya ke `state.categories` dan memperbarui elemen `<select id="item-category">` di formulir transaksi sehingga kategori baru tersedia untuk dipilih.
6. THE StorageAdapter SHALL menyimpan array `state.categories` ke Storage di bawah kunci `"categories"` setiap kali array tersebut berubah.
7. WHEN halaman dimuat, THE App SHALL membaca kunci `"categories"` dari Storage; IF kunci tidak ada atau nilai bukan array valid, THEN THE App SHALL menggunakan array kosong untuk CustomCategory; THE App SHALL menggabungkan hasil tersebut dengan kategori bawaan (Food, Transport, Fun) untuk mengisi `state.categories`.
8. THE App SHALL selalu menampilkan kategori bawaan (Food, Transport, Fun) di posisi pertama pada `<select id="item-category">`, terlepas dari kategori kustom yang ada.
9. WHEN pengguna menghapus CustomCategory, THE App SHALL menghapusnya dari `state.categories` dan Storage, namun transaksi yang sudah menggunakan kategori tersebut SHALL tetap mempertahankan nama kategorinya.
10. IF jumlah CustomCategory di `state.categories` sudah mencapai 50, THEN THE App SHALL menolak penambahan CustomCategory baru dan menampilkan pesan error yang menginformasikan batas maksimum telah tercapai.

---

### Requirement 5: Pengurutan Transaksi (Sort Transactions)

**User Story:** Sebagai pengguna, saya ingin mengurutkan daftar transaksi berdasarkan jumlah atau kategori, sehingga saya dapat dengan mudah menganalisis pola pengeluaran saya.

#### Acceptance Criteria

1. THE App SHALL menyediakan kontrol UI (dropdown atau tombol) untuk memilih field pengurutan dengan tepat tiga pilihan: `"amount"`, `"category"`, dan `"none"` (urutan asli/terbaru).
2. THE App SHALL menyediakan kontrol UI untuk memilih arah pengurutan dengan tepat dua pilihan: `"asc"` (naik) dan `"desc"` (turun).
3. WHEN pengguna mengubah field atau arah pengurutan, THE Renderer SHALL merender ulang daftar transaksi sesuai `SortConfig` yang baru tanpa mengubah urutan array `state.transactions`, dan perubahan tampilan terjadi dalam 200ms setelah interaksi pengguna.
4. WHEN `SortConfig.field` adalah `"amount"`, THE Renderer SHALL mengurutkan tampilan berdasarkan nilai numerik `amount` dari terkecil ke terbesar (asc) atau terbesar ke terkecil (desc), menggunakan perbandingan numerik.
5. WHEN `SortConfig.field` adalah `"category"`, THE Renderer SHALL mengurutkan tampilan berdasarkan urutan alfabetis nama kategori secara case-insensitive (A–Z untuk `"asc"`, Z–A untuk `"desc"`); dua transaksi dengan kategori yang sama diurutkan berdasarkan urutan aslinya (stable sort).
6. WHEN `SortConfig.field` adalah `"none"`, THE Renderer SHALL menampilkan transaksi dalam urutan asli sesuai index array `state.transactions` (index 0 = terbaru), terlepas dari nilai `SortConfig.direction`.
7. IF `SortConfig.direction` adalah `"desc"` DAN `SortConfig.field` bukan `"none"`, THE Renderer SHALL membalik urutan yang sudah ditentukan oleh `SortConfig.field`.
8. WHEN transaksi ditambahkan atau dihapus, THE Renderer SHALL merender ulang daftar transaksi menggunakan `SortConfig` yang sedang aktif sehingga urutan tampilan tetap konsisten.
9. WHEN pengguna membuka App, THE App SHALL memuat `SortConfig` dari Storage di bawah kunci `"sortConfig"` dan menerapkannya pada tampilan daftar transaksi sebelum render pertama.
10. IF Storage tidak mengandung kunci `"sortConfig"`, THEN THE App SHALL menggunakan nilai default `{ field: "none", direction: "asc" }` sebagai `SortConfig` awal.
