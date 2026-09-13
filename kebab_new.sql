-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 10, 2026 at 09:35 AM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 8.1.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kebab_new`
--

-- --------------------------------------------------------

--
-- Table structure for table `akun_pengeluaran`
--

CREATE TABLE `akun_pengeluaran` (
  `id` int(11) NOT NULL,
  `nm_akun` varchar(225) COLLATE utf8mb4_unicode_ci NOT NULL,
  `harga_gudang` int(11) NOT NULL,
  `jenis_pengeluaran` tinyint(4) NOT NULL,
  `jumlah_pengeluaran` float NOT NULL,
  `jenis_akun_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bahan`
--

CREATE TABLE `bahan` (
  `id` int(11) NOT NULL,
  `satuan_id` smallint(6) NOT NULL,
  `jenis_bahan_id` int(11) NOT NULL,
  `bahan` varchar(100) NOT NULL,
  `aktif` enum('Y','T') NOT NULL,
  `harga` int(11) NOT NULL,
  `harga_beli` int(11) NOT NULL,
  `stok_baku_gudang` int(11) NOT NULL,
  `possition` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `barang_kebutuhan`
--

CREATE TABLE `barang_kebutuhan` (
  `id` int(11) NOT NULL,
  `satuan_id` int(11) NOT NULL,
  `nm_barang` varchar(225) NOT NULL,
  `harga` int(11) NOT NULL,
  `harga_beli` int(11) NOT NULL,
  `stok_baku_gudang` int(11) NOT NULL,
  `aktif` tinyint(4) NOT NULL,
  `possition` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `buka_toko`
--

CREATE TABLE `buka_toko` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kota_id` int(11) DEFAULT NULL,
  `cabang_id` tinyint(3) UNSIGNED NOT NULL,
  `tgl` date NOT NULL,
  `nm_karyawan` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buka` time DEFAULT NULL,
  `tutup` time DEFAULT NULL,
  `ket_kebutuhan` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `luar_buka` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dalam_buka` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `belakang_buka` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `luar_tutup` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dalam_tutup` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `belakang_tutup` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cabang`
--

CREATE TABLE `cabang` (
  `id` int(10) UNSIGNED NOT NULL,
  `kota_id` int(11) NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `map` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_tlpn` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_grab` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_shopee` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_gojek` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event` tinyint(4) DEFAULT NULL,
  `possition` int(11) NOT NULL,
  `time_zone` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `off` tinyint(4) NOT NULL,
  `persen_gaji` float DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `costumer`
--

CREATE TABLE `costumer` (
  `id` int(10) UNSIGNED NOT NULL,
  `no_tlp` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `kode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longitude` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery`
--

CREATE TABLE `delivery` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `delivery` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `diskon`
--

CREATE TABLE `diskon` (
  `id` int(11) NOT NULL,
  `nm_diskon` varchar(225) NOT NULL,
  `jenis` tinyint(4) NOT NULL,
  `jml_diskon` int(11) NOT NULL,
  `jam1` time NOT NULL,
  `jam2` time NOT NULL,
  `off` tinyint(4) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `diskon_cabang`
--

CREATE TABLE `diskon_cabang` (
  `id` int(11) NOT NULL,
  `diskon_id` int(11) NOT NULL,
  `cabang_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `give_away`
--

CREATE TABLE `give_away` (
  `id` int(11) NOT NULL,
  `kode` varchar(225) NOT NULL,
  `tgl` date NOT NULL,
  `nm_customer` varchar(225) NOT NULL,
  `ket` varchar(225) DEFAULT NULL,
  `tgl_exp` date NOT NULL,
  `tgl_digunakan` date DEFAULT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `penjualan_id` int(11) DEFAULT NULL,
  `produk_id` int(11) DEFAULT NULL,
  `void` tinyint(4) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `harga`
--

CREATE TABLE `harga` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `produk_id` int(10) UNSIGNED NOT NULL,
  `delivery_id` tinyint(3) UNSIGNED NOT NULL,
  `harga` double(8,2) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `harga_bahan`
--

CREATE TABLE `harga_bahan` (
  `id` int(11) NOT NULL,
  `kota_id` int(11) NOT NULL,
  `bahan_id` int(11) NOT NULL,
  `harga` float NOT NULL,
  `stok_baku` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `harga_kebutuhan`
--

CREATE TABLE `harga_kebutuhan` (
  `id` int(11) NOT NULL,
  `barang_kebutuhan_id` int(11) NOT NULL,
  `kota_id` int(11) NOT NULL,
  `harga` int(11) NOT NULL,
  `stok_baku` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `harga_pengeluaran`
--

CREATE TABLE `harga_pengeluaran` (
  `id` int(11) NOT NULL,
  `akun_id` int(11) NOT NULL,
  `cabang_id` int(11) NOT NULL,
  `harga` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `harga_varian`
--

CREATE TABLE `harga_varian` (
  `id` int(11) NOT NULL,
  `varian_id` int(11) NOT NULL,
  `kota_id` int(11) NOT NULL,
  `harga` int(11) NOT NULL,
  `stok_baku` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice`
--

CREATE TABLE `invoice` (
  `id` int(10) UNSIGNED NOT NULL,
  `no_invoice` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `costumer_id` int(10) UNSIGNED NOT NULL,
  `total` double(8,2) UNSIGNED NOT NULL,
  `dibayar` double NOT NULL DEFAULT 0,
  `diskon` double(8,2) UNSIGNED NOT NULL DEFAULT 0.00,
  `no_tlp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Belum diproses',
  `void` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `admin` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `tgl` date NOT NULL,
  `latitude` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longitude` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cabang_id` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_kasir`
--

CREATE TABLE `invoice_kasir` (
  `id` int(10) UNSIGNED NOT NULL,
  `no_invoice` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int(11) NOT NULL,
  `nm_costumer` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nm_kasir` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total` double(8,2) UNSIGNED NOT NULL,
  `dibayar` double NOT NULL DEFAULT 0,
  `diskon` double(8,2) UNSIGNED NOT NULL DEFAULT 0.00,
  `no_tlp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `void` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `ket_void` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `user_void` int(11) DEFAULT NULL,
  `tgl` date NOT NULL,
  `delivery_id` tinyint(4) NOT NULL,
  `pembayaran_id` int(11) NOT NULL,
  `cabang_id` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `kota_id` int(11) DEFAULT NULL,
  `print` tinyint(4) NOT NULL,
  `online` tinyint(4) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jaga_outlet`
--

CREATE TABLE `jaga_outlet` (
  `id` int(11) NOT NULL,
  `buka_toko_id` int(11) NOT NULL,
  `kota_id` int(11) DEFAULT NULL,
  `cabang_id` int(11) NOT NULL,
  `karyawan_id` int(11) NOT NULL,
  `role` tinyint(4) NOT NULL,
  `tgl` date NOT NULL,
  `ganti` tinyint(4) NOT NULL,
  `foto` varchar(225) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `jenis_list_audit`
--

CREATE TABLE `jenis_list_audit` (
  `id` int(11) NOT NULL,
  `nm_jenis` varchar(225) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `jurnal`
--

CREATE TABLE `jurnal` (
  `id` int(11) NOT NULL,
  `kd_gabungan` varchar(225) COLLATE utf8mb4_unicode_ci NOT NULL,
  `buka_toko_id` int(11) NOT NULL,
  `transaksi_id` int(11) NOT NULL,
  `kota_id` int(11) NOT NULL,
  `cabang_id` int(11) NOT NULL,
  `buku_id` tinyint(4) NOT NULL,
  `akun_id` int(11) NOT NULL,
  `bahan_id` int(11) NOT NULL,
  `barang_id` int(11) NOT NULL,
  `varian_id` int(11) NOT NULL,
  `debit` float NOT NULL,
  `kredit` float NOT NULL,
  `qty_debit` float NOT NULL,
  `qty_kredit` float NOT NULL,
  `user_id` int(11) NOT NULL,
  `tgl` date NOT NULL,
  `ket` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `void` tinyint(4) NOT NULL,
  `p_opname` tinyint(4) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `karyawan`
--

CREATE TABLE `karyawan` (
  `id` int(10) UNSIGNED NOT NULL,
  `nama` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_tlp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tgl_masuk` date DEFAULT NULL,
  `kota_id` int(11) DEFAULT NULL,
  `aktif` tinyint(4) NOT NULL,
  `gapok` int(11) DEFAULT NULL,
  `status` varchar(225) COLLATE utf8mb4_unicode_ci NOT NULL,
  `possition` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `karyawan_office`
--

CREATE TABLE `karyawan_office` (
  `id` int(11) NOT NULL,
  `nama` varchar(225) NOT NULL,
  `no_tlp` varchar(225) DEFAULT NULL,
  `alamat` varchar(225) DEFAULT NULL,
  `tgl_masuk` date DEFAULT NULL,
  `gapok` int(11) NOT NULL,
  `persen` float NOT NULL,
  `aktif` tinyint(4) NOT NULL,
  `possition` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `karyawan_office_kota`
--

CREATE TABLE `karyawan_office_kota` (
  `id` int(11) NOT NULL,
  `cabang_id` int(11) NOT NULL,
  `karyawan_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `kategori`
--

CREATE TABLE `kategori` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `kategori` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `possition` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori_varian`
--

CREATE TABLE `kategori_varian` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kategori_varian` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aktif` tinyint(4) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kebutuhan`
--

CREATE TABLE `kebutuhan` (
  `id` int(11) NOT NULL,
  `buka_toko_id` int(11) NOT NULL,
  `barang_kebutuhan_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `komisi`
--

CREATE TABLE `komisi` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis` enum('invoice','penjualan') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('rp','persen') COLLATE utf8mb4_unicode_ci NOT NULL,
  `jumlah` double NOT NULL,
  `cek` enum('T','Y') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `list_audit`
--

CREATE TABLE `list_audit` (
  `id` int(11) NOT NULL,
  `jenis_id` int(11) NOT NULL,
  `nm_audit` varchar(225) NOT NULL,
  `aktif` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pembayaran` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aktif` enum('1','0') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengeluaran`
--

CREATE TABLE `pengeluaran` (
  `id` int(11) NOT NULL,
  `akun_pengeluaran_id` int(11) NOT NULL,
  `harga` int(11) NOT NULL,
  `qty` double NOT NULL,
  `cabang_id` int(11) NOT NULL,
  `tgl` date NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengeluaran_jurnal`
--

CREATE TABLE `pengeluaran_jurnal` (
  `id` int(11) NOT NULL,
  `kd_gabungan` varchar(225) DEFAULT NULL,
  `kota_id` int(11) NOT NULL,
  `cabang_id` int(11) NOT NULL,
  `akun_id` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `tgl` date NOT NULL,
  `ket` varchar(225) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `user_hutang_id` int(11) DEFAULT NULL,
  `kd_jurnal` varchar(225) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `penjualan`
--

CREATE TABLE `penjualan` (
  `id` int(10) UNSIGNED NOT NULL,
  `no_invoice` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `costumer_id` int(10) UNSIGNED NOT NULL,
  `produk_id` int(10) UNSIGNED NOT NULL,
  `qty` smallint(5) UNSIGNED NOT NULL,
  `harga` double(8,2) UNSIGNED NOT NULL,
  `diskon` double(8,2) UNSIGNED NOT NULL DEFAULT 0.00,
  `total` double(8,2) UNSIGNED NOT NULL,
  `total_varian` int(11) NOT NULL,
  `ket` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `void` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `admin` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `tgl` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `penjualan_gaji`
--

CREATE TABLE `penjualan_gaji` (
  `id` int(11) NOT NULL,
  `buka_toko_id` int(11) NOT NULL,
  `kota_id` int(11) DEFAULT NULL,
  `cabang_id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `karyawan_id` int(11) NOT NULL,
  `jumlah` float NOT NULL,
  `tgl` date NOT NULL,
  `void` tinyint(4) NOT NULL,
  `persen_gaji` float NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `penjualan_gaji_office`
--

CREATE TABLE `penjualan_gaji_office` (
  `id` int(11) NOT NULL,
  `buka_toko_id` int(11) NOT NULL,
  `kota_id` int(11) DEFAULT NULL,
  `cabang_id` int(11) NOT NULL,
  `invoice_id` int(225) NOT NULL,
  `karyawan_id` int(11) NOT NULL,
  `jumlah` float NOT NULL,
  `tgl` date NOT NULL,
  `void` tinyint(4) NOT NULL,
  `persen_gaji` float NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `penjualan_karyawan`
--

CREATE TABLE `penjualan_karyawan` (
  `id` int(11) NOT NULL,
  `no_invoice` varchar(50) NOT NULL,
  `karyawan_id` int(11) NOT NULL,
  `tgl` date NOT NULL,
  `cabang_id` int(11) NOT NULL,
  `jml_komisi` double NOT NULL,
  `void` tinyint(4) NOT NULL,
  `online` tinyint(4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `penjualan_kasir`
--

CREATE TABLE `penjualan_kasir` (
  `id` int(10) UNSIGNED NOT NULL,
  `no_invoice` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nm_costumer` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `produk_id` int(10) UNSIGNED NOT NULL,
  `qty` smallint(5) UNSIGNED NOT NULL,
  `harga` double(8,2) UNSIGNED NOT NULL,
  `harga_normal` double NOT NULL,
  `catatan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_id` smallint(6) NOT NULL,
  `pembayaran_id` int(11) NOT NULL,
  `diskon` double(8,2) UNSIGNED NOT NULL DEFAULT 0.00,
  `total` double(8,2) UNSIGNED NOT NULL,
  `total_varian` double NOT NULL,
  `void` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `admin` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `cabang_id` int(11) NOT NULL,
  `kota_id` int(11) DEFAULT NULL,
  `tgl` date NOT NULL,
  `online` tinyint(4) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `penjualan_varian`
--

CREATE TABLE `penjualan_varian` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `penjualan_id` int(10) UNSIGNED NOT NULL,
  `no_invoice` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `varian_id` smallint(5) UNSIGNED NOT NULL,
  `qty` smallint(5) UNSIGNED NOT NULL,
  `harga` double NOT NULL,
  `tgl` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `penjualan_varian_online`
--

CREATE TABLE `penjualan_varian_online` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `penjualan_id` int(10) UNSIGNED NOT NULL,
  `no_invoice` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `varian_id` smallint(5) UNSIGNED NOT NULL,
  `qty` smallint(5) UNSIGNED NOT NULL,
  `harga` double NOT NULL,
  `tgl` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `persen_pengeluaran`
--

CREATE TABLE `persen_pengeluaran` (
  `id` int(11) NOT NULL,
  `cabang_id` int(11) NOT NULL,
  `akun_id` int(11) NOT NULL,
  `jenis` tinyint(4) NOT NULL,
  `jumlah` float NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produk`
--

CREATE TABLE `produk` (
  `id` int(10) UNSIGNED NOT NULL,
  `kategori_id` tinyint(3) UNSIGNED NOT NULL,
  `nm_produk` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `diskon` mediumint(8) UNSIGNED NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ON',
  `tampil_varian` tinyint(4) NOT NULL,
  `possition` int(11) NOT NULL,
  `hapus` tinyint(4) NOT NULL,
  `tampil_voucher` tinyint(4) NOT NULL,
  `terlaris` tinyint(4) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `resep`
--

CREATE TABLE `resep` (
  `id` int(11) NOT NULL,
  `produk_id` int(11) NOT NULL,
  `bahan_id` int(11) NOT NULL,
  `takaran` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `satuan`
--

CREATE TABLE `satuan` (
  `id` smallint(6) NOT NULL,
  `satuan` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `sop`
--

CREATE TABLE `sop` (
  `id` int(11) NOT NULL,
  `sop` varchar(225) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `stok`
--

CREATE TABLE `stok` (
  `id` int(11) NOT NULL,
  `kode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_invoice` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `penjualan_id` int(11) NOT NULL,
  `produk_id` int(11) NOT NULL,
  `kota_id` int(11) DEFAULT NULL,
  `cabang_id` int(11) NOT NULL,
  `delivery_id` int(11) NOT NULL,
  `bahan_id` int(11) NOT NULL,
  `debit` int(11) NOT NULL,
  `kredit` int(11) NOT NULL,
  `harga` smallint(5) UNSIGNED NOT NULL,
  `tgl` date NOT NULL,
  `admin` int(11) NOT NULL,
  `jenis` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stok_gudang`
--

CREATE TABLE `stok_gudang` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `kd_gabungan` varchar(225) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kota_id` int(11) NOT NULL,
  `mitra_id` int(11) NOT NULL,
  `bahan_id` int(11) NOT NULL,
  `jenis_bahan` tinyint(4) NOT NULL,
  `jenis` tinyint(4) NOT NULL,
  `qty` int(11) NOT NULL,
  `harga` int(11) NOT NULL,
  `harga_normal` int(11) DEFAULT NULL,
  `hutang_gudang_id` int(11) DEFAULT NULL,
  `harga_hutang` int(11) DEFAULT NULL,
  `harga_bayar` int(11) DEFAULT NULL,
  `tgl_bayar` date DEFAULT NULL,
  `jenis_bayar` tinyint(4) DEFAULT NULL,
  `kas_awal` int(11) DEFAULT NULL,
  `tgl` date NOT NULL,
  `user_id` int(11) NOT NULL,
  `void` tinyint(4) NOT NULL,
  `awal` tinyint(4) NOT NULL,
  `p_opname` tinyint(4) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users_kasir`
--

CREATE TABLE `users_kasir` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `cabang_id` smallint(6) NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_key` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time_zone` varchar(225) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `varian`
--

CREATE TABLE `varian` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nm_varian` varchar(100) NOT NULL,
  `kategori_varian_id` tinyint(4) NOT NULL,
  `harga` double NOT NULL,
  `harga_beli` int(11) NOT NULL,
  `stok_baku_gudang` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `akun_pengeluaran`
--
ALTER TABLE `akun_pengeluaran`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bahan`
--
ALTER TABLE `bahan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `barang_kebutuhan`
--
ALTER TABLE `barang_kebutuhan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `buka_toko`
--
ALTER TABLE `buka_toko`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cabang`
--
ALTER TABLE `cabang`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `costumer`
--
ALTER TABLE `costumer`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `delivery`
--
ALTER TABLE `delivery`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `diskon`
--
ALTER TABLE `diskon`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `diskon_cabang`
--
ALTER TABLE `diskon_cabang`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `give_away`
--
ALTER TABLE `give_away`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `harga`
--
ALTER TABLE `harga`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `harga_bahan`
--
ALTER TABLE `harga_bahan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `harga_kebutuhan`
--
ALTER TABLE `harga_kebutuhan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `harga_pengeluaran`
--
ALTER TABLE `harga_pengeluaran`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `harga_varian`
--
ALTER TABLE `harga_varian`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `invoice`
--
ALTER TABLE `invoice`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `invoice_kasir`
--
ALTER TABLE `invoice_kasir`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tgl_invoice_kasir_idx` (`tgl`),
  ADD KEY `kota_id_invoice_kasir_idx` (`kota_id`),
  ADD KEY `cabang_id_invoice_kasir_idx` (`cabang_id`);

--
-- Indexes for table `jaga_outlet`
--
ALTER TABLE `jaga_outlet`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `jenis_list_audit`
--
ALTER TABLE `jenis_list_audit`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `jurnal`
--
ALTER TABLE `jurnal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tgl_jurnal_idx` (`tgl`),
  ADD KEY `kota_id_jurnal_idx` (`kota_id`),
  ADD KEY `cabang_id_jurnal_idx` (`cabang_id`),
  ADD KEY `akun_id_jurnal_idx` (`akun_id`),
  ADD KEY `bahan_id_jurnal_idx` (`bahan_id`),
  ADD KEY `barang_id_jurnal_idx` (`barang_id`),
  ADD KEY `kd_gabungan_jurnal_idx` (`kd_gabungan`);

--
-- Indexes for table `karyawan`
--
ALTER TABLE `karyawan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `karyawan_office`
--
ALTER TABLE `karyawan_office`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `karyawan_office_kota`
--
ALTER TABLE `karyawan_office_kota`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kategori_varian`
--
ALTER TABLE `kategori_varian`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kebutuhan`
--
ALTER TABLE `kebutuhan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `komisi`
--
ALTER TABLE `komisi`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `list_audit`
--
ALTER TABLE `list_audit`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pengeluaran`
--
ALTER TABLE `pengeluaran`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pengeluaran_jurnal`
--
ALTER TABLE `pengeluaran_jurnal`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `penjualan`
--
ALTER TABLE `penjualan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `penjualan_gaji`
--
ALTER TABLE `penjualan_gaji`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tgl_penjualan_gaji_idx` (`tgl`),
  ADD KEY `kota_id_penjualan_gaji_idx` (`kota_id`),
  ADD KEY `cabang_id_penjualan_gaji_idx` (`cabang_id`);

--
-- Indexes for table `penjualan_gaji_office`
--
ALTER TABLE `penjualan_gaji_office`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kota_id_penjualan_gaji_office_idx` (`kota_id`),
  ADD KEY `cabang_id_penjualan_gaji_office_idx` (`cabang_id`),
  ADD KEY `tgl_penjualan_gaji_office_idx` (`tgl`);

--
-- Indexes for table `penjualan_karyawan`
--
ALTER TABLE `penjualan_karyawan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `penjualan_kasir`
--
ALTER TABLE `penjualan_kasir`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kota_id_penjualan_kasir_idx` (`kota_id`),
  ADD KEY `tgl_penjualan_kasir_idx` (`tgl`),
  ADD KEY `cabang_id_penjualan_kasir_idx` (`cabang_id`),
  ADD KEY `produk_id_penjualan_kasir_idx` (`produk_id`);

--
-- Indexes for table `penjualan_varian`
--
ALTER TABLE `penjualan_varian`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `penjualan_varian_online`
--
ALTER TABLE `penjualan_varian_online`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `persen_pengeluaran`
--
ALTER TABLE `persen_pengeluaran`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `produk`
--
ALTER TABLE `produk`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `resep`
--
ALTER TABLE `resep`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `satuan`
--
ALTER TABLE `satuan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sop`
--
ALTER TABLE `sop`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stok`
--
ALTER TABLE `stok`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tgl_stok_idx` (`tgl`),
  ADD KEY `kota_id_stok_idx` (`kota_id`),
  ADD KEY `cabang_id_stok_idx` (`cabang_id`),
  ADD KEY `bahan_id_stok_idx` (`bahan_id`);

--
-- Indexes for table `stok_gudang`
--
ALTER TABLE `stok_gudang`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users_kasir`
--
ALTER TABLE `users_kasir`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_unique` (`username`);

--
-- Indexes for table `varian`
--
ALTER TABLE `varian`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `akun_pengeluaran`
--
ALTER TABLE `akun_pengeluaran`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bahan`
--
ALTER TABLE `bahan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `barang_kebutuhan`
--
ALTER TABLE `barang_kebutuhan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `buka_toko`
--
ALTER TABLE `buka_toko`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cabang`
--
ALTER TABLE `cabang`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `costumer`
--
ALTER TABLE `costumer`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery`
--
ALTER TABLE `delivery`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `diskon`
--
ALTER TABLE `diskon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `diskon_cabang`
--
ALTER TABLE `diskon_cabang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `give_away`
--
ALTER TABLE `give_away`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `harga`
--
ALTER TABLE `harga`
  MODIFY `id` mediumint(8) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `harga_bahan`
--
ALTER TABLE `harga_bahan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `harga_kebutuhan`
--
ALTER TABLE `harga_kebutuhan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `harga_pengeluaran`
--
ALTER TABLE `harga_pengeluaran`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `harga_varian`
--
ALTER TABLE `harga_varian`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice`
--
ALTER TABLE `invoice`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_kasir`
--
ALTER TABLE `invoice_kasir`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jaga_outlet`
--
ALTER TABLE `jaga_outlet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jenis_list_audit`
--
ALTER TABLE `jenis_list_audit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jurnal`
--
ALTER TABLE `jurnal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `karyawan`
--
ALTER TABLE `karyawan`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `karyawan_office`
--
ALTER TABLE `karyawan_office`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `karyawan_office_kota`
--
ALTER TABLE `karyawan_office_kota`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori_varian`
--
ALTER TABLE `kategori_varian`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kebutuhan`
--
ALTER TABLE `kebutuhan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `komisi`
--
ALTER TABLE `komisi`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `list_audit`
--
ALTER TABLE `list_audit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengeluaran`
--
ALTER TABLE `pengeluaran`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengeluaran_jurnal`
--
ALTER TABLE `pengeluaran_jurnal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penjualan`
--
ALTER TABLE `penjualan`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penjualan_gaji`
--
ALTER TABLE `penjualan_gaji`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penjualan_gaji_office`
--
ALTER TABLE `penjualan_gaji_office`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penjualan_karyawan`
--
ALTER TABLE `penjualan_karyawan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penjualan_kasir`
--
ALTER TABLE `penjualan_kasir`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penjualan_varian`
--
ALTER TABLE `penjualan_varian`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penjualan_varian_online`
--
ALTER TABLE `penjualan_varian_online`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `persen_pengeluaran`
--
ALTER TABLE `persen_pengeluaran`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produk`
--
ALTER TABLE `produk`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `resep`
--
ALTER TABLE `resep`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `satuan`
--
ALTER TABLE `satuan`
  MODIFY `id` smallint(6) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sop`
--
ALTER TABLE `sop`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stok`
--
ALTER TABLE `stok`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stok_gudang`
--
ALTER TABLE `stok_gudang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users_kasir`
--
ALTER TABLE `users_kasir`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `varian`
--
ALTER TABLE `varian`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
