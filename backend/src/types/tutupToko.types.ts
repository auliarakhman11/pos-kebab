export interface LaporanPenjualanItemDto {
  delivery_id: number;
  delivery_nama: string;
  pembayaran_id: number;
  pembayaran_nama: string;
  total_transaksi: number;
  total_penjualan: number;
}

export interface DetailProdukTerjualItemDto {
  produk_id: number;
  nm_produk: string;
  delivery_id: number;
  delivery_nama: string;
  qty_terjual: number;
  total_uang: number;
}

export interface LaporanPengeluaranItemDto {
  id: number;
  kd_gabungan: string;
  barang_id: number;
  nm_barang: string;
  qty: number;
  harga_satuan: number;
  total_harga: number;
  tgl: string;
  created_at?: string;
}

export interface LaporanPengeluaranDto {
  total_pengeluaran: number;
  items: LaporanPengeluaranItemDto[];
}

export interface LaporanKasBersihDto {
  total_penjualan_cash: number;
  total_pengeluaran_kebutuhan: number;
  kas_bersih: number;
}

export interface LaporanBarangBawaanItemDto {
  bahan_id: number;
  nm_bahan: string;
  satuan: string;
  masuk: number;
  keluar: number;
  refund: number;
  sisa_fisik: number;
}

export interface InfoTokoRekapDto {
  buka_toko_id: number;
  kode: string;
  cabang_id: number;
  cabang_nama: string;
  kota_id: number;
  tgl: string;
  buka: string;
  tutup: string | null;
  nm_karyawan: string;
}

export interface RekapTokoResponseDto {
  info_toko: InfoTokoRekapDto;
  laporan_penjualan: LaporanPenjualanItemDto[];
  detail_produk_terjual: DetailProdukTerjualItemDto[];
  laporan_pengeluaran: LaporanPengeluaranDto;
  laporan_kas_bersih: LaporanKasBersihDto;
  laporan_barang_bawaan: LaporanBarangBawaanItemDto[];
}

export interface ItemKebutuhanTutupDto {
  barang_kebutuhan_id: number;
  qty: number;
}

export interface TutupTokoRequestDto {
  id_buka_toko: number | string;
  cabang_id: number | string;
  kode_buka_toko: string;
  ket_kebutuhan?: string | null;
  kebutuhan?: ItemKebutuhanTutupDto[];
  foto_luar: string;
  foto_dalam: string;
  foto_belakang: string;
}
