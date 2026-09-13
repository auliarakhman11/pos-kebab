# Daftar Fitur Aplikasi POS & ERP Kebab Yasmin

Dokumen ini berisi urutan alur kerja (workflow) fungsionalitas aplikasi Kasir Kebab Yasmin. Aplikasi ini harus dibangun secara berurutan mulai dari fitur pertama.

## 1. Modul Autentikasi (Pintu Masuk)
- **Login Kasir:** User harus login menggunakan kredensial yang terdaftar di tabel `users_kasir`.
- **Validasi Cabang:** Saat login, sistem wajib mengecek tabel `cabang`. Login hanya diizinkan jika cabang tersebut aktif (`off = 0`).

## 2. Modul Persiapan Operasional (Wajib Setelah Login)
- **Cek Status Toko (Middleware):** Setelah login, sistem mengecek apakah toko sudah "Buka" hari ini. Jika belum, user diarahkan ke form Buka Toko.
- **Form Buka Toko:** 
  - Input barang bawaan/stok awal dari gudang.
  - Pilih karyawan (leader & rolling) yang jaga di shift tersebut.
  - Upload bukti kehadiran: Foto selfie, foto outlet luar, dalam, dan belakang.

## 3. Modul Kasir (Point of Sale)
- **Katalog & Keranjang:** Menampilkan menu, memilih varian produk (jika ada), dan memasukkannya ke keranjang.
- **Checkout & Pembayaran:** 
  - Mencatat pesanan ke dalam `invoice_kasir`.
  - Sistem otomatis memotong stok `bahan` berdasarkan tabel `resep` tiap produk.
  - Sistem otomatis membuat `jurnal` akuntansi (debit/kredit) berdasarkan persentase pengeluaran cabang.
  - Sistem otomatis menghitung bagi hasil/gaji untuk karyawan yang jaga saat itu.
  - Cetak struk otomatis dan kirim notifikasi WhatsApp.

## 4. Modul Operasional Berjalan
- **Pengeluaran/Kebutuhan:** Fitur untuk kasir mencatat pengeluaran mendadak (beli es batu, plastik, dll) yang akan langsung memotong kas bersih.
- **Pergantian Shift:** Fitur untuk mengganti karyawan yang jaga tanpa harus menutup toko.
- **Void/Refund:** Fitur pembatalan transaksi dengan alasan tertentu.

## 5. Modul Tutup Toko (End of Day)
- **Laporan EOD:** Pratinjau total penjualan, pengeluaran, dan kas bersih sebelum toko ditutup.
- **Input Sisa Barang:** Mencatat sisa barang fisik bawaan.
- **Foto Penutupan:** Upload bukti foto bahwa toko sudah ditutup dan dibersihkan dengan benar.