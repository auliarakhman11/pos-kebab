export interface TransaksiVarianItemDto {
  id: number;
  varian_id: number;
  nm_varian: string;
  qty: number;
  harga: number;
}

export interface TransaksiDetailItemDto {
  id: number;
  produk_id: number;
  nm_produk: string;
  qty: number;
  harga: number;
  harga_normal: number;
  diskon: number;
  total: number;
  total_varian: number;
  catatan?: string | null;
  varian: TransaksiVarianItemDto[];
}

export interface TransaksiListItemDto {
  id: number;
  no_invoice: string;
  kode: string;
  urutan: number;
  nm_costumer?: string | null;
  nm_kasir?: string | null;
  total: number;
  dibayar: number;
  diskon: number;
  no_tlp?: string | null;
  void: number;
  ket_void?: string | null;
  admin: number;
  user_void?: number | null;
  tgl: string;
  created_at?: string | null;
  delivery_id: number;
  delivery_nama: string;
  pembayaran_id: number;
  pembayaran_nama: string;
  items: TransaksiDetailItemDto[];
}

export interface VoidTransaksiRequestDto {
  alasan: string;
}
