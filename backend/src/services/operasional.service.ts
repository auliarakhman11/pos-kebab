import prisma from '../prisma';
import {
  GantiShiftRequestDto,
  AddKebutuhanRequestDto,
  KebutuhanListItemDto,
  StatusOperasionalDto,
} from '../types/operasional.types';
import { getZonaWaktu } from '../utils/fileHelper';

export class OperasionalService {
  /**
   * Mengambil status operasional toko cabang:
   * - Jumlah cabang aktif di kota tersebut (untuk menentukan apakah tombol kebutuhan boleh muncul)
   * - Sesi buka toko aktif saat ini
   * - Daftar petugas shift yang sedang aktif jaga
   */
  async getStatusOperasional(cabangId: number): Promise<StatusOperasionalDto> {
    const cabang = await prisma.cabang.findUnique({
      where: { id: cabangId },
      select: { id: true, kota_id: true },
    });

    if (!cabang) {
      const error: any = new Error('Cabang tidak valid atau tidak ditemukan.');
      error.statusCode = 400;
      throw error;
    }

    const kotaId = cabang.kota_id || 0;

    // Hitung jumlah cabang aktif (off = 0) di kota yang sama
    const jumlahCabangKota = await prisma.cabang.count({
      where: {
        kota_id: kotaId,
        off: 0,
      },
    });

    // Ambil sesi buka toko yang sedang aktif (tutup === null)
    const activeBukaToko = await prisma.bukaToko.findFirst({
      where: {
        cabang_id: cabangId,
        tutup: null,
      },
      orderBy: { id: 'desc' },
      include: {
        jagaOutlet: {
          where: { ganti: 0 },
          include: {
            karyawan: {
              select: { id: true, nama: true },
            },
          },
        },
      },
    });

    const karyawanJaga = (activeBukaToko?.jagaOutlet || []).map((j) => ({
      id: Number(j.id),
      karyawan_id: j.karyawan_id,
      nama: j.karyawan?.nama || 'Petugas',
      ganti: j.ganti,
    }));

    return {
      cabang_id: cabangId,
      kota_id: kotaId,
      jumlah_cabang_kota: jumlahCabangKota,
      is_kebutuhan_enabled: jumlahCabangKota > 1,
      buka_toko_id: activeBukaToko ? Number(activeBukaToko.id) : null,
      kode_buka_toko: activeBukaToko?.kode || null,
      tgl_buka_toko: activeBukaToko ? activeBukaToko.tgl.toISOString().split('T')[0] : null,
      karyawan_jaga: karyawanJaga,
    };
  }

  /**
   * POST /api/ganti-shift
   * Memperbarui daftar petugas shift aktif secara atomik ($transaction):
   * 1. Set ganti = 1 pada semua entri jaga_outlet di buka_toko_id ini (mengakhiri shift lama)
   * 2. Loop karyawan_baru_ids:
   *    - Jika sudah ada: update ganti = 0
   *    - Jika belum ada: insert baru (role = 3, ganti = 0)
   * 3. Sinkronkan nama karyawan aktif ke buka_toko.nm_karyawan
   */
  async gantiShift(cabangId: number, adminId: number, payload: GantiShiftRequestDto) {
    const { karyawan_baru_ids } = payload;

    if (!Array.isArray(karyawan_baru_ids) || karyawan_baru_ids.length === 0) {
      const error: any = new Error('Pilih minimal satu karyawan untuk shift baru.');
      error.statusCode = 400;
      throw error;
    }

    const cabang = await prisma.cabang.findUnique({
      where: { id: cabangId },
    });
    const kotaId = payload.kota_id || cabang?.kota_id || 0;

    const userKasir = await prisma.usersKasir.findUnique({
      where: { id: adminId },
      select: { time_zone: true },
    });
    const effectiveTz = userKasir?.time_zone || cabang?.time_zone;
    const { zonaWaktu, zonaTanggal } = getZonaWaktu(effectiveTz);

    // Cari sesi buka toko aktif
    let bukaTokoId = payload.buka_toko_id ? Number(payload.buka_toko_id) : 0;
    let activeBukaToko: any = null;

    if (bukaTokoId > 0) {
      activeBukaToko = await prisma.bukaToko.findUnique({
        where: { id: BigInt(bukaTokoId) },
      });
    }

    if (!activeBukaToko || activeBukaToko.tutup !== null) {
      activeBukaToko = await prisma.bukaToko.findFirst({
        where: {
          cabang_id: cabangId,
          tutup: null,
        },
        orderBy: { id: 'desc' },
      });
    }

    if (!activeBukaToko) {
      const error: any = new Error('Toko belum dibuka atau sesi buka toko telah ditutup.');
      error.statusCode = 400;
      throw error;
    }

    bukaTokoId = Number(activeBukaToko.id);
    const tglTransaksi = activeBukaToko.tgl || zonaTanggal;

    const cleanKaryawanIds = Array.from(new Set(karyawan_baru_ids.map(Number))).filter(Boolean);

    // Ambil master nama karyawan untuk field nm_karyawan
    const karyawans = await prisma.karyawan.findMany({
      where: { id: { in: cleanKaryawanIds } },
      select: { id: true, nama: true },
    });
    const nmKaryawanBaru = karyawans.map((k) => k.nama).join(', ') || 'Kasir';

    // Eksekusi atomik $transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Update semua data di tabel jaga_outlet yang memiliki buka_toko_id tersebut. Set ganti = 1
        await tx.jagaOutlet.updateMany({
          where: {
            buka_toko_id: BigInt(bukaTokoId),
          },
          data: {
            ganti: 1,
            updated_at: zonaWaktu,
          },
        });

        // 2. Looping array karyawan_baru_ids
        for (const kId of cleanKaryawanIds) {
          const existing = await tx.jagaOutlet.findFirst({
            where: {
              buka_toko_id: BigInt(bukaTokoId),
              karyawan_id: kId,
            },
          });

          if (existing) {
            // Jika SUDAH ADA: Update field ganti = 0 (aktifkan kembali)
            await tx.jagaOutlet.update({
              where: { id: existing.id },
              data: {
                ganti: 0,
                updated_at: zonaWaktu,
              },
            });
          } else {
            // Jika BELUM ADA: Insert baru ke jaga_outlet
            await tx.jagaOutlet.create({
              data: {
                buka_toko_id: BigInt(bukaTokoId),
                kota_id: kotaId,
                cabang_id: cabangId,
                karyawan_id: kId,
                role: 3, // Role 3 = MS / Anggota
                tgl: tglTransaksi,
                ganti: 0,
                foto: null,
                created_at: zonaWaktu,
                updated_at: zonaWaktu,
              },
            });
          }
        }

        // 3. Update nama karyawan di tabel buka_toko
        await tx.bukaToko.update({
          where: { id: BigInt(bukaTokoId) },
          data: {
            nm_karyawan: nmKaryawanBaru,
            updated_at: zonaWaktu,
          },
        });

        // Ambil daftar karyawan jaga yang saat ini aktif
        const activeJagaNow = await tx.jagaOutlet.findMany({
          where: {
            buka_toko_id: BigInt(bukaTokoId),
            ganti: 0,
          },
          include: {
            karyawan: { select: { id: true, nama: true } },
          },
        });

        return {
          buka_toko_id: bukaTokoId,
          nm_karyawan: nmKaryawanBaru,
          total_karyawan_aktif: activeJagaNow.length,
          karyawan_aktif: activeJagaNow.map((j) => ({
            id: Number(j.id),
            karyawan_id: j.karyawan_id,
            nama: j.karyawan?.nama || 'Petugas',
          })),
        };
      },
      {
        timeout: 30000,
        maxWait: 10000,
      }
    );

    return result;
  }

  /**
   * GET /api/kebutuhan/barang
   * Mengambil daftar master barang kebutuhan yang aktif (aktif = 1)
   */
  async getMasterBarangKebutuhan() {
    return prisma.barangKebutuhan.findMany({
      where: { aktif: 1 },
      select: {
        id: true,
        nm_barang: true,
        harga: true,
        harga_beli: true,
        satuan_id: true,
        satuan: {
          select: { id: true, satuan: true },
        },
      },
      orderBy: [{ possition: 'asc' }, { nm_barang: 'asc' }],
    });
  }

  /**
   * GET /api/kebutuhan
   * Mengambil daftar barang kebutuhan yang telah dicatat pada sesi buka toko saat ini
   */
  async getKebutuhanByBukaToko(bukaTokoId: number): Promise<KebutuhanListItemDto[]> {
    if (!bukaTokoId) return [];

    // Jurnal kebutuhan dicatat dengan buku_id = 1 dan akun_id = 13 (Debit)
    const jurnalEntries = await prisma.jurnal.findMany({
      where: {
        buka_toko_id: BigInt(bukaTokoId),
        buku_id: 1,
        akun_id: 13,
      },
      orderBy: { id: 'desc' },
    });

    if (jurnalEntries.length === 0) return [];

    const barangIds = Array.from(new Set(jurnalEntries.map((j) => j.barang_id))).filter(Boolean);
    const masterBarang = await prisma.barangKebutuhan.findMany({
      where: { id: { in: barangIds } },
      select: { id: true, nm_barang: true },
    });
    const barangMap = new Map(masterBarang.map((b) => [b.id, b.nm_barang]));

    return jurnalEntries.map((j) => {
      const qty = j.qty_debit || 0;
      const total = j.debit || 0;
      const hargaSatuan = qty > 0 ? Math.round(total / qty) : 0;
      const nmBarang = barangMap.get(j.barang_id) || j.ket || `Barang #${j.barang_id}`;

      return {
        id: j.id,
        kd_gabungan: j.kd_gabungan,
        barang_id: j.barang_id,
        nm_barang: nmBarang,
        qty: qty,
        harga_satuan: hargaSatuan,
        total_harga: total,
        tgl: j.tgl.toISOString().split('T')[0],
        created_at: j.created_at ? j.created_at.toISOString() : undefined,
      };
    });
  }

  /**
   * POST /api/kebutuhan
   * Mencatat barang kebutuhan ke tabel jurnal dengan logika akuntansi:
   * 1. Generate kd_gabungan unik per item ('INV' + dmy + 5 random chars)
   * 2. Cari harga pokok tertinggi di stok_gudang (bahan_id = barang_id, jenis_bahan = 2, jenis = 1, void = 0, qty > 0)
   *    Rumus: max((harga + harga_hutang) / qty)
   * 3. Markup 10%: harga_bahan = harga + (harga * 10%). Jika tidak ketemu, harga_bahan = 0
   * 4. Insert Jurnal Debit (akun_id = 13, debit = harga_bahan * qty, kredit = 0, qty_debit = qty)
   * 5. Insert Jurnal Kredit (akun_id = 14, debit = 0, kredit = harga_bahan * qty, qty_kredit = qty)
   */
  async addKebutuhan(cabangId: number, adminId: number, payload: AddKebutuhanRequestDto) {
    const { items } = payload;

    if (!Array.isArray(items) || items.length === 0) {
      const error: any = new Error('Daftar barang kebutuhan tidak boleh kosong.');
      error.statusCode = 400;
      throw error;
    }

    // Validasi setiap baris
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.barang_id || Number(it.barang_id) <= 0) {
        const error: any = new Error(`Baris ke-${i + 1}: Barang kebutuhan wajib dipilih.`);
        error.statusCode = 400;
        throw error;
      }
      if (!it.qty || Number(it.qty) <= 0) {
        const error: any = new Error(`Baris ke-${i + 1}: Jumlah (qty) wajib diisi minimal 1.`);
        error.statusCode = 400;
        throw error;
      }
    }

    const cabang = await prisma.cabang.findUnique({
      where: { id: cabangId },
    });
    const kotaId = payload.kota_id || cabang?.kota_id || 0;

    const userKasir = await prisma.usersKasir.findUnique({
      where: { id: adminId },
      select: { time_zone: true },
    });
    const effectiveTz = userKasir?.time_zone || cabang?.time_zone;
    const { zonaWaktu, zonaTanggal, dateStr } = getZonaWaktu(effectiveTz);

    // Cari sesi buka toko aktif
    let bukaTokoId = payload.buka_toko_id ? Number(payload.buka_toko_id) : 0;
    let activeBukaToko: any = null;

    if (bukaTokoId > 0) {
      activeBukaToko = await prisma.bukaToko.findUnique({
        where: { id: BigInt(bukaTokoId) },
      });
    }

    if (!activeBukaToko || activeBukaToko.tutup !== null) {
      activeBukaToko = await prisma.bukaToko.findFirst({
        where: {
          cabang_id: cabangId,
          tutup: null,
        },
        orderBy: { id: 'desc' },
      });
    }

    if (!activeBukaToko) {
      const error: any = new Error('Toko belum dibuka atau sesi buka toko telah ditutup.');
      error.statusCode = 400;
      throw error;
    }

    bukaTokoId = Number(activeBukaToko.id);
    const tglTransaksi = activeBukaToko.tgl || zonaTanggal;

    // Prefetch nama barang kebutuhan untuk keterangan jurnal
    const barangIds = Array.from(new Set(items.map((it) => Number(it.barang_id))));
    const masterBarangList = await prisma.barangKebutuhan.findMany({
      where: { id: { in: barangIds } },
      select: { id: true, nm_barang: true },
    });
    const barangNameMap = new Map(masterBarangList.map((b) => [b.id, b.nm_barang]));

    // Format tanggal untuk kode gabungan 'INV' + dmy + 5 random karakter
    const [yStr, mStr, dStr] = dateStr.split('-');
    const dmy = `${dStr}${mStr}${yStr.slice(-2)}`;

    // Eksekusi atomik seluruh jurnal di $transaction
    const result = await prisma.$transaction(
      async (tx) => {
        const createdEntries: any[] = [];

        for (const item of items) {
          const bId = Number(item.barang_id);
          const qty = Number(item.qty);

          // 1. Generate kd_gabungan unik
          const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
          const kdGabungan = `INV${dmy}${randomStr}`;

          // 2. Cari Harga Pokok di tabel stok_gudang
          // where: bahan_id = barang_id, jenis_bahan = 2, jenis = 1, void = 0, qty > 0
          const stokGudangList = await tx.stokGudang.findMany({
            where: {
              bahan_id: bId,
              jenis_bahan: 2,
              jenis: 1,
              void: 0,
              qty: { gt: 0 },
            },
            select: {
              harga: true,
              harga_hutang: true,
              qty: true,
            },
          });

          let maxUnitPrice = 0;
          for (const sg of stokGudangList) {
            const totalBiaya = (Number(sg.harga) || 0) + (Number(sg.harga_hutang) || 0);
            const unitPrice = totalBiaya / sg.qty;
            if (unitPrice > maxUnitPrice) {
              maxUnitPrice = unitPrice;
            }
          }

          // 3. Markup Harga 10%
          // Jika harga ditemukan, harga_bahan = harga + (harga * 10%). Jika tidak ketemu, harga_bahan = 0
          let hargaBahan = 0;
          if (maxUnitPrice > 0) {
            hargaBahan = maxUnitPrice + (maxUnitPrice * 0.10);
          }

          const nmBarang = barangNameMap.get(bId) || `Barang #${bId}`;
          const totalDebitKredit = Math.round(hargaBahan * qty);

          // 4. Insert Jurnal Debit (buku_id = 1, akun_id = 13)
          const debitJurnal = await tx.jurnal.create({
            data: {
              kd_gabungan: kdGabungan,
              buka_toko_id: BigInt(bukaTokoId),
              transaksi_id: 0,
              kota_id: kotaId,
              cabang_id: cabangId,
              buku_id: 1,
              akun_id: 13,
              bahan_id: 0,
              barang_id: bId,
              varian_id: BigInt(0),
              debit: totalDebitKredit,
              kredit: 0,
              qty_debit: qty,
              qty_kredit: 0,
              user_id: adminId,
              tgl: tglTransaksi,
              ket: nmBarang,
              void: 0,
              p_opname: 0,
              created_at: zonaWaktu,
              updated_at: zonaWaktu,
            },
          });

          // 5. Insert Jurnal Kredit (buku_id = 1, akun_id = 14, kd_gabungan harus sama persis)
          await tx.jurnal.create({
            data: {
              kd_gabungan: kdGabungan,
              buka_toko_id: BigInt(bukaTokoId),
              transaksi_id: 0,
              kota_id: kotaId,
              cabang_id: cabangId,
              buku_id: 1,
              akun_id: 14,
              bahan_id: 0,
              barang_id: bId,
              varian_id: BigInt(0),
              debit: 0,
              kredit: totalDebitKredit,
              qty_debit: 0,
              qty_kredit: qty,
              user_id: adminId,
              tgl: tglTransaksi,
              ket: nmBarang,
              void: 0,
              p_opname: 0,
              created_at: zonaWaktu,
              updated_at: zonaWaktu,
            },
          });

          createdEntries.push({
            id: debitJurnal.id,
            kd_gabungan: kdGabungan,
            barang_id: bId,
            nm_barang: nmBarang,
            qty: qty,
            harga_satuan: Math.round(hargaBahan),
            total_harga: totalDebitKredit,
            tgl: tglTransaksi.toISOString().split('T')[0],
          });
        }

        return createdEntries;
      },
      {
        timeout: 30000,
        maxWait: 10000,
      }
    );

    return result;
  }

  /**
   * DELETE /api/kebutuhan/:kd_gabungan
   * Menghapus inputan barang kebutuhan yang salah.
   * Logika: Menghapus data pada tabel jurnal di mana kd_gabungan sama dengan parameter.
   * Ini otomatis menghapus sepasang jurnal (debit dan kredit) secara bersih.
   */
  async deleteKebutuhan(kdGabungan: string) {
    if (!kdGabungan || !kdGabungan.trim()) {
      const error: any = new Error('Kode gabungan kebutuhan tidak valid.');
      error.statusCode = 400;
      throw error;
    }

    const cleanKd = kdGabungan.trim();

    const deleteResult = await prisma.jurnal.deleteMany({
      where: {
        kd_gabungan: cleanKd,
      },
    });

    if (deleteResult.count === 0) {
      const error: any = new Error('Data jurnal kebutuhan tidak ditemukan atau sudah dihapus.');
      error.statusCode = 404;
      throw error;
    }

    return {
      kd_gabungan: cleanKd,
      deleted_rows: deleteResult.count,
    };
  }
}

export const operasionalService = new OperasionalService();
export default operasionalService;
