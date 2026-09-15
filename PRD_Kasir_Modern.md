# Technical PRD: Kebab Yasmin POS & ERP (Modern Stack)
**Target Stack:** Frontend: Next.js + TailwindCSS + Zustand + Dexie.js (Offline-first) | Backend: Express.js + TypeScript + Prisma ORM.

## 1. UI/UX Guidelines & Design System (Yasmin Kebab Theme)
Agen AI frontend wajib mematuhi panduan visual berikut menggunakan Tailwind CSS agar antarmuka kasir cepat, intuitif, dan selaras dengan identitas bisnis F&B:

**A. Skema Warna (Color Palette F&B)**
*   **Primary Brand:** Amber/Kuning Kebab (`bg-amber-500` / `#F59E0B`) untuk *header* atau elemen aksen. Warna ini menstimulasi rasa lapar dan energi cepat saji.
*   **Primary Action:** Emerald/Hijau Segar (`bg-emerald-600` / `#059669`) khusus untuk tombol "Bayar", "Buka Toko", dan status "Sukses".
*   **Background:** Off-white (`bg-slate-50` / `#F8FAFC`) agar mata kasir tidak cepat lelah saat menatap layar berjam-jam.
*   **Alert/Danger:** Rose/Merah (`bg-rose-500` / `#F43F5E`) untuk tombol "Refund", "Hapus Item", dan notifikasi *Error*.

**B. Tata Letak (Layouting) & Tipografi**
*   **Grid POS (Tablet/Desktop):** Rasio `grid-cols-12`. Area Katalog Menu memakan `col-span-8` (66%), Area Keranjang dikunci (*fixed/sticky*) di `col-span-4` (33%).
*   **Tipografi:** Gunakan font Sans-Serif modern (seperti Inter atau Poppins). Harga produk harus menggunakan *font-weight* tebal (`font-bold`) agar kasir tidak salah baca.
*   **Sentuhan Jari (Touch-Friendly):** Semua *button* dan kartu menu wajib memiliki padding besar (minimal `p-4`) dan tinggi minimal `h-12` agar akurat saat ditekan terburu-buru.

**C. Gaya Komponen & Animasi Mikro (Micro-interactions)**
*   **Kartu Menu:** Gunakan sudut sangat membulat (`rounded-2xl`), *border* tipis (`border-slate-200`), dan bayangan halus (`shadow-sm`).
*   **Animasi Klik:** Tambahkan class `active:scale-95 transition-transform duration-150` pada setiap tombol dan kartu menu agar memberikan efek "tertekan" secara visual (haptic feedback visual).
*   **Feedback:** Gunakan *Toast Notification* di sudut kanan atas untuk sukses/gagal (jangan pakai `alert()` bawaan browser). Tanpa *full page reload*.

---

## 2. Modul Autentikasi & Validasi Buka Toko
**A. Login Kasir**
*   **Query Base:** Autentikasi menggunakan tabel `users_kasir` yang berelasi dengan tabel `cabang` di mana field `cabang.off = 0`.
*   **Simpan State:** Simpan data kasir dan token ke sisi klien.

*   **Token System:** 
    * Access Token: Kedaluwarsa dalam waktu singkat (misal: 1 jam). Digunakan untuk mengakses semua API operasional.
    * Refresh Token: Kedaluwarsa dalam waktu panjang (misal: 7 hari). Disimpan di database users_kasir dan sisi klien (HttpOnly Cookie atau LocalStorage). Digunakan HANYA untuk meminta Access Token baru ketika yang lama kedaluwarsa tanpa harus login ulang.

**B. Pengecekan Status Buka Toko (Middleware)**
*   Cek tabel `buka_toko` berdasarkan `cabang_id` hasil login. 
*   **Logika:** Jika ditemukan data terakhir yang field `tutup`-nya bernilai `NULL`, berarti toko masih BUKA (bisa langsung ke halaman kasir). Jika tidak ada atau sudah terisi, berarti TUTUP, dan wajib melalui halaman form "Buka Toko".

**C. Proses Buka Toko (Form Store Opening)**
*   **Barang Bawaan:** Tampilkan form *dropdown* dari tabel `bahan` (`aktif = 'Y'`) dan inputan `qty`. Tambahkan tombol `+` agar form dinamis.
*   **Generate Kode Unik:** Buat `kode_buka_toko`: `'ST' + date('dmy') + randomstring(5) + cabang_id`.
*   **Insert Stok Bawaan:** Simpan ke tabel `stok` dengan atribut `jenis = 'Masuk'`, `status = 'buka'`, hitung `harga` modal dari `harga_bahan`.
*   **Pilih Karyawan Jaga:** Tampilkan *popup* dari tabel `karyawan` (`kota_id` sesuai cabang, `aktif = 1`). Pilih Leader & Rolling.
*   **Validasi Hardware Kamera (Wajib):** 
    1. Ambil foto selfie wajah karyawan (kamera depan).
    2. Ambil foto luar, dalam, dan belakang outlet (kamera belakang). 
    3. *Constraint:* Jika foto tidak lengkap, tombol "Lanjut" *disabled*. Gambar dikirim format *Base64*.
    4. **Format Penamaan Foto (Compact Naming Standard):**
       - `luar_buka`: `new_luar_{buka_toko_id}.jpg`
       - `dalam_buka`: `new_buka_{buka_toko_id}.jpg`
       - `belakang_buka`: `new_belakang_{buka_toko_id}.jpg`
       - `jaga_outlet.foto`: `new_kry_{buka_toko_id}_{karyawan_id}_{random_string_2_karakter}.jpg`
*   **Eksekusi Database:** Insert data ke `buka_toko` dan `jaga_outlet`.

---

## 3. Modul Halaman Kasir (Katalog & Keranjang)
**A. Katalog Produk**
*   **List Kategori:** Ambil dari `kategori` (urut `possition` ASC). Tampilkan dengan *horizontal scroll* di atas katalog.
*   **List Produk:** Ambil dari `produk` (`status = 'ON'`). Render gambar pakai Next/Image (*Lazy Load*) dari `https://admin.kebabyasmin.id/`.
*   **Detail Produk:** Saat diklik, muncul detail relasi `resep` & `takaran`. Harga *default* dari `harga` dengan `delivery_id = 1`.
*   **Pemilihan Varian:** Jika `produk.tampil_varian = 1`, paksa buka *modal glassmorphism* pilih varian dari `kategori_varian` sebelum masuk keranjang.
*   **Grouping Keranjang:** Varian/catatan berbeda = baris baru. Persis sama = `qty++`.

**B. Manajemen State Keranjang (Zustand & Dexie.js)**
*   **Dilarang pakai Session Backend.** Simpan array objek pesanan di *LocalStorage/IndexedDB* (Zustand).
*   **Jenis Order:** Dropdown dari `delivery` (`event != 1`). Default `id = 1` (Normal). Jika berubah, harga seluruh item di keranjang *auto-update* menyesuaikan `delivery_id`.
*   **Pembayaran & Kembalian:** Dropdown dari `pembayaran` (`aktif = 1`). Tampilkan "Pilih Bayar" (Uang Pas, 20rb, 50rb, 100rb, dll) HANYA jika nominal >= subtotal keranjang. Ada input "Nominal Lainnya". Hitung kembalian instan.

---

## 4. Modul Checkout & Logika ERP (Backend Prisma Transaction)
Saat "Bayar" ditekan, kirim payload ke API. Gunakan `$transaction` Prisma agar eksekusi di bawah ini berjalan atomik (bersamaan):

**A. Pencatatan Transaksi & Aturan Tanggal Operasional**
*   **Zona Waktu Kasir:** Seluruh penentuan waktu (`created_at`, `updated_at`, dan waktu cetak struk) wajib mengikuti timezone kasir login di `users_kasir.time_zone` (`Asia/Jakarta` untuk WIB / UTC+7 atau `Asia/Makassar` untuk WITA / UTC+8).
*   **Aturan Field `tgl` Penjualan:** Seluruh pencatatan transaksi penjualan (`invoice_kasir`, `penjualan_kasir`, `penjualan_varian`, `stok`, `jurnal`, `penjualan_gaji`, `penjualan_gaji_office`) field `tgl`-nya WAJIB mengikuti tanggal (`tgl`) dari `buka_toko` yang sedang aktif (buka), meskipun transaksi kasir terjadi lewat tengah malam keesokan harinya. Hal ini menjaga konsistensi tutup buku dan laporan shift kasir. Field `created_at` dan `updated_at` tetap mencatat waktu real-time kasir.
*   Generate `no_invoice` (`'INV' + date('dmy') + randomstring(5)`).
*   Insert `invoice_kasir` (`online = 0`, `print = 0`).
*   Insert iterasi ke `penjualan_kasir` (`online = 0`) & `penjualan_varian`.

**B. Pengurangan Stok via Resep (Inventori)**
*   Iterasi ke `resep` tiap produk (`bahan_id`, `takaran`).
*   **Filter Resep Aktif:** Hanya ambil resep yang berelasi dengan tabel `bahan` di mana field `aktif = 'Y'`.
*   **Harga Satuan Bahan (HPP):** Diambil dari harga tertinggi di tabel `stok_gudang` (`jenis_bahan = 1, jenis = 1, void = 0, qty > 0, tgl >= '2026-02-22'`) dengan rumus `(COALESCE(harga, 0) + COALESCE(harga_hutang, 0)) / qty`. Jika tidak ditemukan, fallback ke `harga_bahan` (`kota_id`), lalu fallback ke `bahan.harga`.
*   Insert ke `stok`: `jenis = 'Keluar'`, `status = 'buka'`, `kredit = (qty produk * takaran)`, `harga = Math.round(hppBahan)`.

**C. Jurnal Pengeluaran Otomatis (Akuntansi)**
*   Ambil dari `persen_pengeluaran` cabang tersebut. 
*   `jenis = 1` (Persentase * harga normal qty). `jenis = 0` (Persentase * qty).
*   Insert 2 baris (Debit & Kredit akun 26) ke tabel `jurnal` untuk setiap potongannya.
*   **Keterangan Jurnal:** Field `ket` pada tabel `jurnal` WAJIB diisi dengan nama akun (`nm_akun` dari tabel `akun_pengeluaran`), bukan format no invoice.

**D. Distribusi Bagi Hasil & Gaji**
*   Bagi `total_pendapatan / jumlah_karyawan_jaga` (`ganti = 0`). Insert ke `penjualan_gaji`.
*   Hitung hak kantor pusat dari `karyawan_office_kota` (Pusat), pastikan hanya memproses yang di tabel `karyawan_office` memiliki status `aktif = 1`, lalu insert ke `penjualan_gaji_office`.

**E. Hardware Actions (Frontend)**
*   Bersihkan keranjang.
*   Trigger Cetak *Bluetooth Thermal Printer* Web API (Format: Logo, Waktu, Kasir, Order, Rincian, Subtotal, Kembalian, Box Antrian Khusus).
*   Kirim pesan ke WA (Direct Message API).

---

## 5. Modul Manajemen Operasional Lainnya
**A. Manajemen Transaksi Kasir**
*   List `invoice_kasir` HANYA untuk `buka_toko_id` saat ini. Aksi: Print, Detail, Refund.
*   **Refund (Void):** Input alasan, update `void = 1` di `invoice_kasir` & `penjualan_kasir`. (Stok biarkan urusan Admin).

**B. Pergantian Shift (`POST /api/ganti-shift`)**
*   Pilih satu atau lebih karyawan dari *modal popup* (`GET /api/karyawan`).
*   **Transaksi Atomik (`prisma.$transaction`):**
    1. Update semua data di tabel `jaga_outlet` pada `buka_toko_id` tersebut: set `ganti = 1` (shift lama selesai).
    2. Looping array `karyawan_baru_ids`: jika sudah ada di tabel `jaga_outlet`, update `ganti = 0`. Jika belum ada, insert entri baru (`role = 3`, `ganti = 0`, `tgl` buka toko).
    3. Sinkronisasi nama petugas aktif ke field `nm_karyawan` di tabel `buka_toko`.

**C. Pengeluaran Kebutuhan (`POST /api/kebutuhan` & `DELETE /api/kebutuhan/:kd_gabungan`)**
*   **Kondisi Visibilitas UI:** Tombol Barang Kebutuhan HANYA BOLEH MUNCUL jika di kota tersebut terdapat **lebih dari 1 cabang aktif** (`jumlah_cabang_kota > 1`).
*   **Form Dinamis:** Input dinamis tambah/hapus baris (Select `barang_kebutuhan` & Input `qty`).
*   **Logika Jurnal Akuntansi Atomik:**
    1. Generate `kd_gabungan` unik per item: `'INV' + date('dmy') + randomstring(5)`.
    2. Cari Harga Pokok di tabel `stok_gudang`: `bahan_id = barang_id, jenis_bahan = 2, jenis = 1, void = 0, qty > 0`. Nilai maksimal rumus `(harga + harga_hutang) / qty`.
    3. Markup 10%: `harga_bahan = harga + (harga * 10%)`. Jika tidak ditemukan, `harga_bahan = 0`.
    4. Insert Jurnal Debit: `buku_id = 1, akun_id = 13, debit = harga_bahan * qty, kredit = 0, qty_debit = qty`.
    5. Insert Jurnal Kredit: `buku_id = 1, akun_id = 14, debit = 0, kredit = harga_bahan * qty, qty_kredit = qty` dengan `kd_gabungan` yang sama.
*   **Hapus Jurnal Kebutuhan:** Delete tabel `jurnal` berdasarkan `kd_gabungan`, otomatis menghapus sepasang jurnal (debit dan kredit) secara bersih.

**D. Tutup Toko (Laporan EOD)**
*   **Preview Laporan Layar:** Penjualan (omset), Kebutuhan (kas bersih), Barang Bawaan (Masuk - Keluar - Refund).
*   Input `barang_kebutuhan` (akhir) & `ket_kebutuhan`.
*   Wajib foto *outlet* (Luar, Dalam, Belakang). Update `tutup = WAKTU_SEKARANG`, *file base64* ke `buka_toko`.
*   Update seluruh kode di `stok` jadi `status = 'tutup'`. Cetak struk laporan fisik.

---

## 6. Standar Arsitektur Kode & Struktur Folder (Industry Best Practice)
Untuk menjaga kode tetap *scalable*, teruji (*testable*), mudah di-maintain, dan sesuai standar industri modern (developer pro), proyek ini menggunakan pola **Monorepo** dengan arsitektur berlapis (*Layered / Clean Architecture*):

```
pos-kebab/
├── frontend/                          # [Next.js App Router / Vite SPA]
│   ├── src/
│   │   ├── app/                       # Routing halaman & layouts
│   │   ├── components/                # Komponen UI modular (Atomic design, Touch-friendly)
│   │   ├── hooks/                     # Custom hooks (Bluetooth printer, Camera, Sync)
│   │   ├── stores/                    # Zustand state management (Cart, Auth, Shift)
│   │   ├── db/                        # Dexie.js (IndexedDB local database)
│   │   ├── services/                  # HTTP Client & API callers
│   │   └── types/                     # TypeScript UI interfaces & DTOs
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                           # [Node.js + Express + Prisma Enterprise Architecture]
│   ├── prisma/
│   │   ├── schema.prisma              # Definisi model database, relasi otomatis, & @@map
│   │   └── seed.ts                    # Database seeders (optional)
│   ├── src/
│   │   ├── config/                    # Parsing env variables & konstanta sistem
│   │   ├── controllers/               # HTTP Request/Response handlers & status code
│   │   ├── services/                  # Business Logic murni, Prisma transactions, & ERP rules
│   │   ├── routes/                    # Definisi endpoint URL & binding middleware
│   │   ├── middlewares/               # JWT guard, cek status toko/cabang, error handler
│   │   ├── types/                     # Interface TypeScript, DTOs (Data Transfer Objects)
│   │   ├── utils/                     # Format response standar, helper hashing, logger
│   │   ├── prisma.ts                  # Singleton instance PrismaClient
│   │   └── server.ts                  # Inisialisasi Express & konfigurasi lifecycle server
│   ├── dist/                          # [GITIGNORED] Hasil build/kompilasi tsc (.js)
│   ├── .env                           # [GITIGNORED] Secret & Database connection
│   ├── .env.example                   # Template env aman untuk version control
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore                         # Standard ignore (dist/, node_modules/, .env, logs)
├── PRD_Kasir_Modern.md                # Dokumen Master PRD & Arsitektur
├── Fitur_Kebab_Yasmin.md              # Alur Bisnis Operasional
└── kebab_new.sql                      # Skema Database MySQL Asli
```

### Aturan Baku Pengembangan:
1. **Pemisahan Tanggung Jawab (Separation of Concerns):**
   - **Route:** Hanya bertugas memetakan URL ke Controller dan memasang Middleware. Dilarang menulis query database di file route.
   - **Controller:** Bertugas menerima request, memvalidasi input HTTP, memanggil Service, dan mengembalikan HTTP Response standar via `utils/response.ts`.
   - **Service:** Tempat semua logika bisnis, komputasi ERP (HPP, resep, jurnal akuntansi debit/kredit, gaji), dan query Prisma dijalankan.
2. **Kompilasi TypeScript:** Seluruh kode sumber hanya ditulis dalam format `.ts` di folder `src/`. Folder `dist/` murni hasil generate otomatis oleh compiler `tsc` dan tidak boleh diedit manual.
3. **Standar Respons API:** Seluruh endpoint wajib mengembalikan payload terstruktur:
   `{ success: boolean, message: string, data?: any, errors?: any }`.
4. **Database Safety:** Seluruh transaksi majemuk (seperti Checkout, Buka Toko, Tutup Toko) wajib dibungkus dalam `prisma.$transaction`.
5. **Git Workflow & Push Rules:** 
   - Repository Remote: `https://github.com/auliarakhman11/pos-kebab.git` (branch: `main`).
   - Alur Pengerjaan: Setiap kali satu fitur selesai dibuat dan telah dites berhasil oleh user, user akan memberikan instruksi push.
   - Agen AI wajib melakukan commit dengan pesan konvensional (*Conventional Commits*, misal: `feat: ...`, `fix: ...`, `refactor: ...`) yang spesifik menjelaskan fitur yang diselesaikan, lalu langsung mem-push ke repository GitHub.