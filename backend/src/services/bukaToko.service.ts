import prisma from '../prisma';
import { BukaTokoDto, StatusTokoData } from '../types/bukaToko.types';

export class BukaTokoService {
  /**
   * Cek apakah cabang user sedang buka hari ini (field tutup === null)
   */
  async checkStatusToko(cabangId: number): Promise<StatusTokoData> {
    const latestBuka = await prisma.bukaToko.findFirst({
      where: {
        cabang_id: cabangId,
        tutup: null,
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!latestBuka) {
      return {
        is_open: false,
        cabang_id: cabangId,
      };
    }

    return {
      is_open: true,
      buka_toko_id: Number(latestBuka.id),
      kode: latestBuka.kode,
      tgl: latestBuka.tgl,
      buka: latestBuka.buka,
      cabang_id: latestBuka.cabang_id,
      nm_karyawan: latestBuka.nm_karyawan,
    };
  }

  /**
   * Mengambil data pendukung untuk form Buka Toko (bahan aktif & karyawan sesuai kota cabang)
   */
  async getFormDataBukaToko(cabangId: number) {
    const cabang = await prisma.cabang.findUnique({
      where: { id: cabangId },
    });

    const kotaId = cabang?.kota_id;

    // List bahan aktif
    const bahanList = await prisma.bahan.findMany({
      where: { aktif: 'Y' },
      select: {
        id: true,
        bahan: true,
        harga: true,
        harga_beli: true,
        satuan_id: true,
      },
      orderBy: { bahan: 'asc' },
    });

    // List karyawan aktif di kota cabang tersebut
    const karyawanList = await prisma.karyawan.findMany({
      where: {
        aktif: 1,
        ...(kotaId ? { kota_id: kotaId } : {}),
      },
      select: {
        id: true,
        nama: true,
        kota_id: true,
        posisi_id: true,
      },
      orderBy: { nama: 'asc' },
    });

    return {
      cabang: {
        id: cabangId,
        nama: cabang?.nama,
        kota_id: kotaId,
      },
      bahan: bahanList,
      karyawan: karyawanList,
    };
  }

  /**
   * Proses pembukaan toko dengan atomic transaction ($transaction)
   */
  async prosesBukaToko(cabangId: number, adminId: number, payload: BukaTokoDto) {
    const { barang_bawaan, karyawan_jaga, foto_luar, foto_dalam, foto_belakang } = payload;

    // Validasi input
    if (!Array.isArray(karyawan_jaga) || karyawan_jaga.length === 0) {
      const error: any = new Error('Pilih minimal satu karyawan yang bertugas jaga.');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(barang_bawaan)) {
      const error: any = new Error('Data barang bawaan tidak valid (harus berupa array).');
      error.statusCode = 400;
      throw error;
    }

    // Cek apakah toko masih berstatus buka (belum ditutup)
    const existingOpen = await prisma.bukaToko.findFirst({
      where: {
        cabang_id: cabangId,
        tutup: null,
      },
    });

    if (existingOpen) {
      const error: any = new Error(
        `Toko cabang ini sudah dalam status BUKA dengan kode: ${existingOpen.kode}. Harap tutup toko terlebih dahulu.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Ambil data cabang untuk mendapatkan kota_id
    const cabang = await prisma.cabang.findUnique({
      where: { id: cabangId },
    });

    const kotaId = cabang?.kota_id ?? 0;

    // Ambil nama karyawan jaga untuk field nm_karyawan di buka_toko
    const karyawanIds = karyawan_jaga.map((k) => k.karyawan_id);
    const karyawans = await prisma.karyawan.findMany({
      where: { id: { in: karyawanIds } },
      select: { id: true, nama: true },
    });

    const nmKaryawan = karyawans.map((k) => k.nama).join(', ');

    // Generate kode unik buka toko: 'ST' + dmy + random(5) + cabang_id
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dmy = `${day}${month}${year}`;
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const kodeBukaToko = `ST${dmy}${randomStr}${cabangId}`;

    // Eksekusi atomik dengan Prisma $transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Insert ke tabel buka_toko
      const newBukaToko = await tx.bukaToko.create({
        data: {
          kode: kodeBukaToko,
          kota_id: kotaId,
          cabang_id: cabangId,
          tgl: now,
          buka: now,
          tutup: null,
          nm_karyawan: nmKaryawan || 'Kasir',
          luar_buka: foto_luar || null,
          dalam_buka: foto_dalam || null,
          belakang_buka: foto_belakang || null,
        },
      });

      // 2. Looping array karyawan_jaga, insert ke jaga_outlet
      for (const kj of karyawan_jaga) {
        await tx.jagaOutlet.create({
          data: {
            buka_toko_id: newBukaToko.id,
            kota_id: kotaId,
            cabang_id: cabangId,
            karyawan_id: kj.karyawan_id,
            role: kj.role || 1, // 1 = Leader, 2 = Rolling
            tgl: now,
            ganti: 0,
            foto: kj.foto || null,
          },
        });
      }

      // 3. Looping array barang_bawaan, insert ke stok (jenis = 'Masuk', status = 'buka')
      if (barang_bawaan.length > 0) {
        for (const bb of barang_bawaan) {
          await tx.stok.create({
            data: {
              kode: kodeBukaToko,
              penjualan_id: 0,
              produk_id: 0,
              kota_id: kotaId,
              cabang_id: cabangId,
              delivery_id: 0,
              bahan_id: bb.bahan_id,
              debit: Number(bb.qty) || 0,
              kredit: 0,
              harga: Number(bb.harga) || 0,
              tgl: now,
              admin: adminId,
              jenis: 'Masuk',
              status: 'buka',
            },
          });
        }
      }

      return newBukaToko;
    });

    return {
      buka_toko_id: Number(result.id),
      kode: result.kode,
      cabang_id: cabangId,
      tgl: result.tgl,
      nm_karyawan: result.nm_karyawan,
      total_karyawan: karyawan_jaga.length,
      total_barang_bawaan: barang_bawaan.length,
    };
  }
}

export const bukaTokoService = new BukaTokoService();
export default bukaTokoService;
