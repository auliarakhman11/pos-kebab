export interface GantiShiftRequestDto {
  buka_toko_id?: number | string;
  cabang_id?: number;
  kota_id?: number;
  tgl?: string;
  karyawan_baru_ids: number[];
}

export interface KebutuhanItemInputDto {
  barang_id: number;
  qty: number;
}

export interface AddKebutuhanRequestDto {
  buka_toko_id?: number | string;
  cabang_id?: number;
  kota_id?: number;
  tgl?: string;
  items: KebutuhanItemInputDto[];
}

export interface KebutuhanListItemDto {
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

export interface StatusOperasionalDto {
  cabang_id: number;
  kota_id: number;
  jumlah_cabang_kota: number;
  is_kebutuhan_enabled: boolean;
  buka_toko_id: number | null;
  kode_buka_toko: string | null;
  tgl_buka_toko: string | null;
  karyawan_jaga: Array<{
    id: number;
    karyawan_id: number;
    nama: string;
    ganti: number;
  }>;
}
