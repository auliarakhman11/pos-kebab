export interface ProdukHarga {
  id: number;
  delivery_id: number;
  harga: number;
}

export interface ProdukItem {
  id: number;
  kategori_id: number;
  nm_produk: string;
  foto: string;
  diskon: number;
  status: string;
  tampil_varian: number; // 1: wajib ada varian, 0: tanpa varian
  possition: number;
  harga: ProdukHarga[];
  resep_info: string;
}

export interface KategoriItem {
  id: number;
  kategori: string;
  possition: number;
}

export interface DeliveryItem {
  id: number;
  delivery: string;
  event: number;
}

export interface PembayaranItem {
  id: number;
  pembayaran: string;
  aktif: string;
}

export interface VarianItem {
  id: number;
  nm_varian: string;
  kategori_varian_id: number;
  harga: number;
}

export interface KategoriVarianItem {
  id: number;
  kategori_varian: string;
  aktif: number;
  varian: VarianItem[];
}
