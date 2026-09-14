import prisma from '../prisma';
import { BukaTokoDto, StatusTokoData } from '../types/bukaToko.types';
import { saveBase64Image, getZonaWaktu } from '../utils/fileHelper';

export class BukaTokoService {
  /**
   * Cek apakah cabang user sedang buka atau tutup.
   * HANYA memeriksa data buka toko TERAKHIR saja:
   * - Jika data terakhir memiliki tutup === null, maka status buka (is_open: true).
   * - Jika data terakhir memiliki tutup !== null (atau belum ada data), maka status tutup (is_open: false).
   * Data-data lampau sebelum record terakhir tidak mempengaruhi status saat ini.
   */
  async checkStatusToko(cabangId: number): Promise<StatusTokoData> {
    const latestBuka = await prisma.bukaToko.findFirst({
      where: {
        cabang_id: cabangId,
      },
      orderBy: {
        id: 'desc',
      },
    });

    // Jika belum pernah ada data buka toko atau record terakhir sudah ada jam tutupnya, berarti toko TUTUP
    if (!latestBuka || latestBuka.tutup !== null) {
      return {
        is_open: false,
        cabang_id: cabangId,
        buka_toko_id: latestBuka ? Number(latestBuka.id) : null,
        kode: latestBuka?.kode || null,
      };
    }

    // Jika record TERAKHIR tutup-nya masih NULL, berarti toko sedang BUKA
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
   * Mengambil data pendukung untuk form Buka Toko
   * - Bahan: where aktif = 'Y' order by possition ASC
   * - Karyawan: where kota_id = cabang.kota_id and aktif = 1
   * - Kode unik transaksi buka toko: 'ST' + dmy + random(5) + cabang_id
   */
  async getFormDataBukaToko(cabangId: number) {
    const cabang = await prisma.cabang.findUnique({
      where: { id: cabangId },
    });

    const kotaId = cabang?.kota_id ?? null;

    // List bahan aktif diurutkan possition ASC
    const bahanList = await prisma.bahan.findMany({
      where: { aktif: 'Y' },
      select: {
        id: true,
        bahan: true,
        harga: true,
        harga_beli: true,
        satuan_id: true,
        possition: true,
      },
      orderBy: { possition: 'asc' },
    });

    // List karyawan aktif di kota cabang terkait
    // Jika cabang memiliki kota_id, filter berdasarkan kota_id. Jika kosong/tidak ada hasil, ambil karyawan aktif.
    let karyawanList = await prisma.karyawan.findMany({
      where: {
        aktif: 1,
        ...(kotaId ? { kota_id: kotaId } : {}),
      },
      select: {
        id: true,
        nama: true,
        kota_id: true,
      },
      orderBy: { nama: 'asc' },
    });

    // Fallback: Jika di kota_id tersebut belum ada data karyawan aktif, ambil semua karyawan aktif agar kasir tidak terblokir
    if (karyawanList.length === 0) {
      karyawanList = await prisma.karyawan.findMany({
        where: { aktif: 1 },
        select: {
          id: true,
          nama: true,
          kota_id: true,
        },
        orderBy: { nama: 'asc' },
      });
    }

    // Cek apakah ada data kode di tabel stok terakhir cabang ini yang statusnya masih 'buka'
    // dan belum difinalisasi di tabel buka_toko
    const lastStokBuka = await prisma.stok.findFirst({
      where: {
        cabang_id: cabangId,
        status: 'buka',
        jenis: 'Masuk',
      },
      orderBy: {
        id: 'desc',
      },
    });

    let activeKode: string | null = null;
    let savedStokItems: any[] = [];

    if (lastStokBuka) {
      // Periksa apakah kode ini sudah pernah dicatat di tabel buka_toko
      const existingBuka = await prisma.bukaToko.findFirst({
        where: {
          kode: lastStokBuka.kode,
        },
      });

      // Jika belum ada di buka_toko, berarti sesi buka toko ini masih berlangsung dan stoknya sudah disimpan sebelumnya
      if (!existingBuka) {
        activeKode = lastStokBuka.kode;
        savedStokItems = await prisma.stok.findMany({
          where: {
            kode: activeKode,
            cabang_id: cabangId,
            status: 'buka',
          },
          select: {
            id: true,
            bahan_id: true,
            debit: true,
            harga: true,
          },
          orderBy: {
            id: 'asc',
          },
        });
      }
    }

    // Jika belum ada stok aktif, generate kode unik baru: 'ST' + dmy + random(5) + cabang_id
    if (!activeKode) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dmy = `${day}${month}${year}`;
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      activeKode = `ST${dmy}${randomStr}${cabangId}`;
    }

    return {
      cabang: {
        id: cabangId,
        nama: cabang?.nama,
        kota_id: kotaId,
      },
      bahan: bahanList,
      karyawan: karyawanList,
      kode: activeKode,
      stok_tersimpan: savedStokItems.length > 0,
      stok_saved: savedStokItems.map((s) => ({
        bahan_id: s.bahan_id,
        qty: s.debit,
        harga: s.harga,
      })),
    };
  }

  /**
   * POST /api/buka-toko/stok
   * Menyimpan stok barang bawaan awal toko (Konversi dari addStok Laravel)
   */
  async addStok(
    cabangId: number,
    adminId: number,
    payload: { bahan_id: number[]; debit: any[]; kode?: string; timeZone?: string }
  ) {
    const { bahan_id, debit, kode, timeZone } = payload;
    const cabang = await prisma.cabang.findUnique({ where: { id: cabangId } });
    const kotaId = cabang?.kota_id ?? 0;
    const { zonaWaktu } = getZonaWaktu(timeZone || cabang?.time_zone);

    // Pastikan kode konsisten
    let finalKode = kode;
    if (!finalKode) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dmy = `${day}${month}${year}`;
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      finalKode = `ST${dmy}${randomStr}${cabangId}`;
    }

    // Ambil harga bahan sekaligus di luar transaksi agar eksekusi transaksi instan dan tidak timeout
    const uniqueBahanIds = Array.from(new Set(bahan_id.map(Number))).filter(Boolean);
    const bahanRecords = await prisma.bahan.findMany({
      where: { id: { in: uniqueBahanIds } },
      select: { id: true, harga: true },
    });
    const hargaMap = new Map(bahanRecords.map((b) => [b.id, b.harga]));

    const stokDataToInsert: any[] = [];
    for (let i = 0; i < bahan_id.length; i++) {
      const bId = Number(bahan_id[i]);
      const qty = Number(debit[i]) || 0;
      if (!bId || qty <= 0) continue;

      stokDataToInsert.push({
        kode: finalKode,
        penjualan_id: 0,
        produk_id: 0,
        kota_id: kotaId,
        cabang_id: cabangId,
        delivery_id: 0,
        bahan_id: bId,
        debit: qty,
        kredit: 0,
        harga: hargaMap.get(bId) || 0,
        tgl: zonaWaktu,
        admin: adminId,
        jenis: 'Masuk',
        status: 'buka',
        created_at: zonaWaktu,
        updated_at: zonaWaktu,
      });
    }

    // Eksekusi atomik cepat dengan deleteMany + createMany dan batas timeout 30 detik
    await prisma.$transaction(
      async (tx) => {
        await tx.stok.deleteMany({
          where: {
            kode: finalKode,
            cabang_id: cabangId,
            status: 'buka',
          },
        });

        if (stokDataToInsert.length > 0) {
          await tx.stok.createMany({
            data: stokDataToInsert,
          });
        }
      },
      {
        timeout: 30000,
        maxWait: 10000,
      }
    );

    return {
      kode: finalKode,
      total_items: stokDataToInsert.length,
      items: stokDataToInsert,
    };
  }

  /**
   * POST /api/buka-toko
   * Proses pembukaan toko dengan atomic transaction ($transaction)
   * Mengonversi logika bukaToko Laravel:
   * 1. Simpan foto outlet & foto selfie karyawan ke disk lokal
   * 2. Insert tabel buka_toko
   * 3. Insert tabel jaga_outlet (Role: 3 = MS / Anggota)
   * 4. Pastikan data stok tersimpan
   */
  async prosesBukaToko(cabangId: number, adminId: number, payload: any) {
    const {
      barang_bawaan,
      karyawan_jaga,
      foto_luar,
      foto_dalam,
      foto_belakang,
      kode,
      timeZone,
    } = payload;

    // Validasi karyawan jaga
    const jagaArray: any[] = Array.isArray(karyawan_jaga) ? karyawan_jaga : [];
    if (jagaArray.length === 0) {
      const error: any = new Error('Pilih minimal satu karyawan yang bertugas jaga shift.');
      error.statusCode = 400;
      throw error;
    }

    // Cek apakah cabang ini record terakhirnya berstatus BUKA (tutup === null)
    const latestRecord = await prisma.bukaToko.findFirst({
      where: {
        cabang_id: cabangId,
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (latestRecord && latestRecord.tutup === null) {
      const error: any = new Error(
        `Toko cabang ini sudah dalam status BUKA dengan kode: ${latestRecord.kode}. Harap tutup toko terlebih dahulu.`
      );
      error.statusCode = 400;
      throw error;
    }

    const cabang = await prisma.cabang.findUnique({ where: { id: cabangId } });
    const kotaId = cabang?.kota_id ?? 0;
    const { zonaWaktu, dateStr } = getZonaWaktu(timeZone || cabang?.time_zone);

    // Kode transaksi
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dmy = `${day}${month}${year}`;
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const kodeBukaToko = kode || `ST${dmy}${randomStr}${cabangId}`;

    // 1. Simpan Foto Outlet ke folder public/img_outlet
    const fileLuarName = foto_luar?.startsWith('data:')
      ? saveBase64Image(foto_luar, 'img_outlet', `out_luar_${kodeBukaToko}_${Date.now()}.jpg`)
      : foto_luar || null;

    const fileDalamName = foto_dalam?.startsWith('data:')
      ? saveBase64Image(foto_dalam, 'img_outlet', `out_dalam_${kodeBukaToko}_${Date.now()}.jpg`)
      : foto_dalam || null;

    const fileBelakangName = foto_belakang?.startsWith('data:')
      ? saveBase64Image(foto_belakang, 'img_outlet', `out_belakang_${kodeBukaToko}_${Date.now()}.jpg`)
      : foto_belakang || null;

    // 2. Ambil data nama karyawan untuk field nm_karyawan di tabel buka_toko
    const karyawanIds = jagaArray.map((k) => Number(k.karyawan_id || k.id)).filter(Boolean);
    const karyawans = await prisma.karyawan.findMany({
      where: { id: { in: karyawanIds } },
      select: { id: true, nama: true },
    });

    const nmKaryawan = karyawans.map((k) => k.nama).join(', ') || 'Kasir';

    // 3. Eksekusi Atomic Transaction
    const result = await prisma.$transaction(async (tx) => {
      // A. Insert ke tabel buka_toko
      const newBukaToko = await tx.bukaToko.create({
        data: {
          kode: kodeBukaToko,
          kota_id: kotaId,
          cabang_id: cabangId,
          tgl: zonaWaktu,
          buka: zonaWaktu,
          tutup: null,
          nm_karyawan: nmKaryawan,
          luar_buka: fileLuarName,
          dalam_buka: fileDalamName,
          belakang_buka: fileBelakangName,
          created_at: zonaWaktu,
          updated_at: zonaWaktu,
        },
      });

      // B. Insert ke tabel jaga_outlet (Role: 3 = MS / Anggota per requirement)
      for (const kj of jagaArray) {
        const kId = Number(kj.karyawan_id || kj.id);
        if (!kId) continue;

        // Simpan foto selfie karyawan jika berbentuk base64
        let fotoSelfieName = kj.foto;
        if (kj.foto?.startsWith('data:')) {
          fotoSelfieName = saveBase64Image(
            kj.foto,
            'img_kry',
            `kry_${kId}_${kodeBukaToko}_${Date.now()}.jpg`
          ) || kj.foto;
        }

        await tx.jagaOutlet.create({
          data: {
            buka_toko_id: newBukaToko.id,
            kota_id: kotaId,
            cabang_id: cabangId,
            karyawan_id: kId,
            role: 3, // Sesuai requirement: seluruh role jadikan value 3 (MS/Anggota)
            tgl: zonaWaktu,
            ganti: 0,
            foto: fotoSelfieName || null,
            created_at: zonaWaktu,
            updated_at: zonaWaktu,
          },
        });
      }

      // C. Simpan barang bawaan jika ada dan belum tersimpan di tabel stok
      const bawaanArray: any[] = Array.isArray(barang_bawaan) ? barang_bawaan : [];
      if (bawaanArray.length > 0) {
        // Cek apakah sudah tersimpan dengan kode ini
        const existingStokCount = await tx.stok.count({
          where: {
            kode: kodeBukaToko,
            cabang_id: cabangId,
          },
        });

        if (existingStokCount === 0) {
          for (const bb of bawaanArray) {
            const bId = Number(bb.bahan_id);
            const qty = Number(bb.qty || bb.debit) || 0;
            if (!bId || qty <= 0) continue;

            const bahan = await tx.bahan.findUnique({ where: { id: bId } });
            const harga = bahan?.harga || Number(bb.harga) || 0;

            await tx.stok.create({
              data: {
                kode: kodeBukaToko,
                penjualan_id: 0,
                produk_id: 0,
                kota_id: kotaId,
                cabang_id: cabangId,
                delivery_id: 0,
                bahan_id: bId,
                debit: qty,
                kredit: 0,
                harga: harga,
                tgl: zonaWaktu,
                admin: adminId,
                jenis: 'Masuk',
                status: 'buka',
                created_at: zonaWaktu,
                updated_at: zonaWaktu,
              },
            });
          }
        }
      }

      return newBukaToko;
    }, {
      timeout: 30000,
      maxWait: 10000,
    });

    return {
      buka_toko_id: Number(result.id),
      kode: result.kode,
      cabang_id: cabangId,
      tgl: result.tgl,
      nm_karyawan: result.nm_karyawan,
      total_karyawan: jagaArray.length,
    };
  }
}

export const bukaTokoService = new BukaTokoService();
export default bukaTokoService;
