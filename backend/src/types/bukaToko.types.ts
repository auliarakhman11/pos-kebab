export interface BarangBawaanItem {
  bahan_id: number;
  qty: number;
  harga?: number;
}

export interface KaryawanJagaItem {
  karyawan_id: number;
  role: number; // 1: Leader, 2: Rolling
  foto?: string; // Selfie base64 / path
}

export interface BukaTokoDto {
  barang_bawaan: BarangBawaanItem[];
  karyawan_jaga: KaryawanJagaItem[];
  foto_luar?: string;
  foto_dalam?: string;
  foto_belakang?: string;
}

export interface StatusTokoData {
  is_open: boolean;
  buka_toko_id?: number | null;
  kode?: string | null;
  tgl?: Date | string | null;
  tgl_jurnal?: Date | string | null;
  buka?: Date | string | null;
  cabang_id?: number;
  nm_karyawan?: string | null;
  kota_id?: number;
  persen_gaji?: number;
}
