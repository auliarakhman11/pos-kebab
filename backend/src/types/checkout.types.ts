export interface CheckoutItemVarianDto {
  id: number | string;
  nm_varian?: string;
  harga: number;
}

export interface CheckoutItemDto {
  produk_id: number;
  nm_produk?: string;
  qty: number;
  harga: number;
  harga_normal?: number;
  diskon?: number;
  catatan?: string;
  varian?: CheckoutItemVarianDto[];
}

export interface CheckoutRequestDto {
  pelanggan?: {
    nama?: string;
    no_tlp?: string;
  };
  delivery_id: number;
  pembayaran_id: number | string;
  diskon?: number;
  nominal_bayar: number;
  kembalian?: number;
  items: CheckoutItemDto[];
  buka_toko?: {
    kode?: string;
    buka_toko_id?: number;
  };
}

export interface CheckoutReceiptItem {
  qty: number;
  nm_produk: string;
  varian_str?: string;
  harga_satuan: number;
  total_harga: number;
  catatan?: string;
}

export interface CheckoutSuccessResponseData {
  no_invoice: string;
  urutan: number;
  cabang_nama: string;
  cabang_alamat?: string;
  cabang_telepon?: string;
  waktu_transaksi: string;
  waktu_cetak: string;
  kasir_nama: string;
  nm_costumer: string;
  no_tlp: string;
  jenis_order: string;
  pembayaran_nama: string;
  items: CheckoutReceiptItem[];
  subtotal: number;
  diskon: number;
  total_bayar: number;
  dibayar: number;
  kembalian: number;
  wa_link?: string;
}
