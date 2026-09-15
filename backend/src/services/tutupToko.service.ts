import fs from 'fs';
import path from 'path';
import prisma from '../prisma';
import {
  RekapTokoResponseDto,
  LaporanPenjualanItemDto,
  DetailProdukTerjualItemDto,
  LaporanPengeluaranItemDto,
  LaporanBarangBawaanItemDto,
  TutupTokoRequestDto,
} from '../types/tutupToko.types';
import { getZonaWaktu } from '../utils/fileHelper';

export class TutupTokoService {
  /**
   * Helper internal untuk menyimpan string base64 menjadi file PNG di public/img_outlet
   */
  private savePngImage(base64Str: string, filename: string): string {
    const publicDir = path.resolve(__dirname, '../../public/img_outlet');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Hapus prefix data:image/...;base64, jika ada
    const matches = base64Str.match(/^data:image\/[a-zA-Z0-9.+]+;base64,(.+)$/);
    const base64Data = matches ? matches[1] : base64Str.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const filePath = path.join(publicDir, filename);
    fs.writeFileSync(filePath, buffer);

    return filename;
  }

  /**
   * GET /api/rekap-toko/:buka_toko_id
   * Menyajikan 5 jenis data agregasi laporan keuangan & operasional:
   * 1. Laporan Penjualan (Group by Delivery & Pembayaran)
   * 2. Detail Produk Terjual (Group by Produk & Delivery)
   * 3. Laporan Pengeluaran (Total & Detail Jurnal Barang Kebutuhan)
   * 4. Laporan Kas Bersih (Total Cash Penjualan - Total Pengeluaran Kebutuhan)
   * 5. Laporan Barang Bawaan (Stok Fisik: Masuk - Keluar - Refund)
   */
  async getRekapToko(
    bukaTokoId: number,
    cabangId: number,
    isPrevious: boolean = false
  ): Promise<RekapTokoResponseDto> {
    // 1. Cari data sesi Buka Toko
    let bukaTokoRecord: any = null;

    // Jika meminta sesi tutup toko sebelumnya secara spesifik
    if (isPrevious) {
      bukaTokoRecord = await prisma.bukaToko.findFirst({
        where: {
          cabang_id: cabangId,
          tutup: { not: null },
        },
        orderBy: { id: 'desc' },
        include: { cabang: true },
      });

      if (!bukaTokoRecord) {
        const error: any = new Error(
          'Belum ada data laporan tutup toko sebelumnya yang tersimpan untuk cabang ini.'
        );
        error.statusCode = 404;
        throw error;
      }
    } else {
      if (bukaTokoId > 0) {
        bukaTokoRecord = await prisma.bukaToko.findUnique({
          where: { id: BigInt(bukaTokoId) },
          include: { cabang: true },
        });
      }

      if (!bukaTokoRecord) {
        bukaTokoRecord = await prisma.bukaToko.findFirst({
          where: { cabang_id: cabangId },
          orderBy: { id: 'desc' },
          include: { cabang: true },
        });
      }

      if (!bukaTokoRecord) {
        const error: any = new Error('Data buka toko tidak ditemukan untuk cabang ini.');
        error.statusCode = 404;
        throw error;
      }
    }

    const kodeSesi = bukaTokoRecord.kode || '';
    const activeBukaTokoId = Number(bukaTokoRecord.id);

    // =========================================================================
    // 1. LAPORAN PENJUALAN (Group by delivery_id & pembayaran_id dari invoice_kasir)
    // =========================================================================
    const activeInvoices = await prisma.invoiceKasir.findMany({
      where: {
        kode: kodeSesi,
        cabang_id: cabangId,
        void: 0,
      },
      include: {
        delivery: { select: { id: true, delivery: true } },
        pembayaran: { select: { id: true, pembayaran: true } },
      },
      orderBy: { id: 'asc' },
    });

    // Grouping Map: `${delivery_id}_${pembayaran_id}`
    const salesGroupMap = new Map<string, LaporanPenjualanItemDto>();
    let totalPenjualanCash = 0;

    for (const inv of activeInvoices) {
      const dId = inv.delivery_id;
      const dNama = inv.delivery?.delivery || `Order #${dId}`;
      const pId = Number(inv.pembayaran_id);
      const pNama = inv.pembayaran?.pembayaran || (pId === 1 ? 'Cash / Tunai' : `Bayar #${pId}`);
      const key = `${dId}_${pId}`;

      const totalInv = Number(inv.total) || 0;

      // Hitung total cash jika pembayaran_id === 1
      if (pId === 1) {
        totalPenjualanCash += totalInv;
      }

      if (!salesGroupMap.has(key)) {
        salesGroupMap.set(key, {
          delivery_id: dId,
          delivery_nama: dNama,
          pembayaran_id: pId,
          pembayaran_nama: pNama,
          total_transaksi: 1,
          total_penjualan: totalInv,
        });
      } else {
        const item = salesGroupMap.get(key)!;
        item.total_transaksi += 1;
        item.total_penjualan += totalInv;
      }
    }

    const laporanPenjualan: LaporanPenjualanItemDto[] = Array.from(salesGroupMap.values()).sort(
      (a, b) => a.delivery_id - b.delivery_id || a.pembayaran_id - b.pembayaran_id
    );

    // =========================================================================
    // 2. DETAIL PRODUK TERJUAL (Group by produk_id & delivery_id dari penjualan_kasir)
    // =========================================================================
    const activeInvoiceNumbers = activeInvoices.map((i) => i.no_invoice);
    let detailProdukTerjual: DetailProdukTerjualItemDto[] = [];

    if (activeInvoiceNumbers.length > 0) {
      const activeSales = await prisma.penjualanKasir.findMany({
        where: {
          no_invoice: { in: activeInvoiceNumbers },
          void: 0,
        },
        include: {
          produk: { select: { id: true, nm_produk: true } },
          delivery: { select: { id: true, delivery: true } },
        },
      });

      // Grouping Map: `${produk_id}_${delivery_id}`
      const productGroupMap = new Map<string, DetailProdukTerjualItemDto>();

      for (const s of activeSales) {
        const pId = s.produk_id;
        const pNama = s.produk?.nm_produk || `Produk #${pId}`;
        const dId = s.delivery_id;
        const dNama = s.delivery?.delivery || `Order #${dId}`;
        const key = `${pId}_${dId}`;

        const qty = Number(s.qty) || 0;
        const total = Number(s.total) || 0;

        if (!productGroupMap.has(key)) {
          productGroupMap.set(key, {
            produk_id: pId,
            nm_produk: pNama,
            delivery_id: dId,
            delivery_nama: dNama,
            qty_terjual: qty,
            total_uang: total,
          });
        } else {
          const item = productGroupMap.get(key)!;
          item.qty_terjual += qty;
          item.total_uang += total;
        }
      }

      detailProdukTerjual = Array.from(productGroupMap.values()).sort(
        (a, b) => a.nm_produk.localeCompare(b.nm_produk) || a.delivery_id - b.delivery_id
      );
    }

    // =========================================================================
    // 3. LAPORAN PENGELUARAN (Dari Jurnal Barang Kebutuhan akun_id = 13)
    // =========================================================================
    const jurnalKebutuhan = await prisma.jurnal.findMany({
      where: {
        buka_toko_id: BigInt(activeBukaTokoId),
        buku_id: 1,
        akun_id: 13,
        void: 0,
      },
      orderBy: { id: 'asc' },
    });

    const barangIds = Array.from(new Set(jurnalKebutuhan.map((j) => j.barang_id))).filter(Boolean);
    const masterBarang = await prisma.barangKebutuhan.findMany({
      where: { id: { in: barangIds } },
      select: { id: true, nm_barang: true },
    });
    const barangNameMap = new Map(masterBarang.map((b) => [b.id, b.nm_barang]));

    let totalPengeluaranKebutuhan = 0;
    const pengeluaranItems: LaporanPengeluaranItemDto[] = [];

    for (const j of jurnalKebutuhan) {
      const qty = Number(j.qty_debit) || 0;
      const totalDebit = Number(j.debit) || 0;
      totalPengeluaranKebutuhan += totalDebit;

      const hargaSatuan = qty > 0 ? Math.round(totalDebit / qty) : 0;
      const nmBarang = barangNameMap.get(j.barang_id) || j.ket || `Barang #${j.barang_id}`;

      pengeluaranItems.push({
        id: j.id,
        kd_gabungan: j.kd_gabungan,
        barang_id: j.barang_id,
        nm_barang: nmBarang,
        qty: qty,
        harga_satuan: hargaSatuan,
        total_harga: totalDebit,
        tgl: j.tgl.toISOString().split('T')[0],
        created_at: j.created_at ? j.created_at.toISOString() : undefined,
      });
    }

    // =========================================================================
    // 4. LAPORAN KAS BERSIH (Cash Sales - Total Pengeluaran)
    // =========================================================================
    const kasBersih = totalPenjualanCash - totalPengeluaranKebutuhan;

    // =========================================================================
    // 5. LAPORAN BARANG BAWAAN (STOK FISIK: Masuk - Keluar - Refund)
    // =========================================================================
    const stokRecords = await prisma.stok.findMany({
      where: {
        kode: kodeSesi,
        cabang_id: cabangId,
      },
      include: {
        bahan: {
          select: {
            id: true,
            bahan: true,
            satuan: { select: { satuan: true } },
          },
        },
      },
      orderBy: { bahan_id: 'asc' },
    });

    const stokGroupMap = new Map<number, LaporanBarangBawaanItemDto>();

    for (const st of stokRecords) {
      const bId = st.bahan_id;
      const bNama = st.bahan?.bahan || `Bahan #${bId}`;
      const satuan = st.bahan?.satuan?.satuan || 'Pcs';
      const jenis = (st.jenis || '').toLowerCase();

      const debit = Number(st.debit) || 0;
      const kredit = Number(st.kredit) || 0;

      if (!stGroupInit(stokGroupMap, bId, bNama, satuan)) {
        // initialized
      }

      const row = stokGroupMap.get(bId)!;

      if (jenis === 'masuk') {
        row.masuk += debit;
      } else if (jenis === 'keluar') {
        row.keluar += kredit;
      } else if (jenis === 'refund') {
        row.refund += debit || kredit;
      }
    }

    // Hitung sisa_fisik = masuk - keluar - refund
    const laporanBarangBawaan: LaporanBarangBawaanItemDto[] = Array.from(stokGroupMap.values()).map(
      (b) => ({
        ...b,
        sisa_fisik: b.masuk - b.keluar - b.refund,
      })
    );

    // =========================================================================
    // INFO TOKO
    // =========================================================================
    const infoToko = {
      buka_toko_id: activeBukaTokoId,
      kode: kodeSesi,
      cabang_id: cabangId,
      cabang_nama: bukaTokoRecord.cabang?.nama || 'Cabang',
      kota_id: bukaTokoRecord.kota_id || bukaTokoRecord.cabang?.kota_id || 0,
      tgl: bukaTokoRecord.tgl ? bukaTokoRecord.tgl.toISOString().split('T')[0] : '',
      buka: bukaTokoRecord.buka ? bukaTokoRecord.buka.toISOString() : '',
      tutup: bukaTokoRecord.tutup ? bukaTokoRecord.tutup.toISOString() : null,
      nm_karyawan: bukaTokoRecord.nm_karyawan || 'Kasir',
    };

    return {
      info_toko: infoToko,
      laporan_penjualan: laporanPenjualan,
      detail_produk_terjual: detailProdukTerjual,
      laporan_pengeluaran: {
        total_pengeluaran: totalPengeluaranKebutuhan,
        items: pengeluaranItems,
      },
      laporan_kas_bersih: {
        total_penjualan_cash: totalPenjualanCash,
        total_pengeluaran_kebutuhan: totalPengeluaranKebutuhan,
        kas_bersih: kasBersih,
      },
      laporan_barang_bawaan: laporanBarangBawaan,
    };
  }

  /**
   * POST /api/tutup-toko
   * Mengeksekusi penutupan toko dengan Prisma $transaction:
   * 1. Validasi foto outlet (foto_luar, foto_dalam, foto_belakang)
   * 2. Konversi dan simpan foto ke public/img_outlet/ (format: YYYYMMDD + cabang_id + luar_tutup.png)
   * 3. Insert array kebutuhan ke tabel kebutuhan
   * 4. Update status tabel stok menjadi 'tutup'
   * 5. Update tabel buka_toko (tutup, ket_kebutuhan, nama file foto)
   */
  async tutupToko(cabangId: number, adminId: number, payload: TutupTokoRequestDto) {
    const {
      id_buka_toko,
      kode_buka_toko,
      ket_kebutuhan,
      kebutuhan,
      foto_luar,
      foto_dalam,
      foto_belakang,
    } = payload;

    // 1. Validasi Ketiga Foto Base64
    if (!foto_luar || !foto_dalam || !foto_belakang) {
      const error: any = new Error('Ambil foto terlebih dahulu.');
      error.statusCode = 400;
      throw error;
    }

    const bukaTokoId = Number(id_buka_toko);
    if (!bukaTokoId) {
      const error: any = new Error('ID Buka Toko tidak valid.');
      error.statusCode = 400;
      throw error;
    }

    // Ambil zona waktu kasir / cabang
    const userKasir = await prisma.usersKasir.findUnique({
      where: { id: adminId },
      select: { time_zone: true },
    });
    const cabang = await prisma.cabang.findUnique({
      where: { id: Number(cabangId) },
      select: { time_zone: true, nama: true },
    });
    const effectiveTz = userKasir?.time_zone || cabang?.time_zone;
    const { zonaWaktu, dateStr } = getZonaWaktu(effectiveTz);

    // Format nama file: YYYYMMDD + cabang_id + luar_tutup.png
    const [y, m, d] = dateStr.split('-');
    const ymd = `${y}${m}${d}`;
    const filenameLuar = `${ymd}${cabangId}luar_tutup.png`;
    const filenameDalam = `${ymd}${cabangId}dalam_tutup.png`;
    const filenameBelakang = `${ymd}${cabangId}belakang_tutup.png`;

    // 2. Simpan 3 File Foto ke Disk Lokal Backend (public/img_outlet/)
    try {
      this.savePngImage(foto_luar, filenameLuar);
      this.savePngImage(foto_dalam, filenameDalam);
      this.savePngImage(foto_belakang, filenameBelakang);
    } catch (saveErr) {
      console.error('Gagal menyimpan file foto tutup toko:', saveErr);
      const error: any = new Error('Gagal menyimpan file foto tutup toko ke disk server.');
      error.statusCode = 500;
      throw error;
    }

    // 3. Eksekusi Atomic Transaction ($transaction)
    const result = await prisma.$transaction(
      async (tx) => {
        // A. Insert Kebutuhan (jika ada data kebutuhan di payload)
        const kebutuhanArray = Array.isArray(kebutuhan) ? kebutuhan : [];
        if (kebutuhanArray.length > 0) {
          const kebutuhanDataToInsert = kebutuhanArray
            .filter((k) => k.barang_kebutuhan_id && Number(k.qty) > 0)
            .map((k) => ({
              buka_toko_id: BigInt(bukaTokoId),
              barang_kebutuhan_id: Number(k.barang_kebutuhan_id),
              qty: Number(k.qty),
              created_at: zonaWaktu,
              updated_at: zonaWaktu,
            }));

          if (kebutuhanDataToInsert.length > 0) {
            await tx.kebutuhan.createMany({
              data: kebutuhanDataToInsert,
            });
          }
        }

        // B. Update Status Tabel Stok: set status = 'tutup' di mana kode = kode_buka_toko
        await tx.stok.updateMany({
          where: {
            kode: kode_buka_toko,
            cabang_id: Number(cabangId),
          },
          data: {
            status: 'tutup',
            updated_at: zonaWaktu,
          },
        });

        // C. Update Buka Toko: set tutup, ket_kebutuhan, dan nama file foto
        const updatedBukaToko = await tx.bukaToko.update({
          where: { id: BigInt(bukaTokoId) },
          data: {
            tutup: zonaWaktu,
            ket_kebutuhan: ket_kebutuhan || '',
            luar_tutup: filenameLuar,
            dalam_tutup: filenameDalam,
            belakang_tutup: filenameBelakang,
            updated_at: zonaWaktu,
          },
        });

        return updatedBukaToko;
      },
      {
        timeout: 25000,
        maxWait: 10000,
      }
    );

    return {
      success: true,
      buka_toko_id: bukaTokoId,
      kode_buka_toko: kode_buka_toko,
      tutup: result.tutup,
      files: {
        luar_tutup: filenameLuar,
        dalam_tutup: filenameDalam,
        belakang_tutup: filenameBelakang,
      },
    };
  }
}

// Helper lokal untuk inisialisasi group Map stok
function stGroupInit(
  map: Map<number, LaporanBarangBawaanItemDto>,
  bahanId: number,
  bahanNama: string,
  satuan: string
): boolean {
  if (!map.has(bahanId)) {
    map.set(bahanId, {
      bahan_id: bahanId,
      nm_bahan: bahanNama,
      satuan: satuan,
      masuk: 0,
      keluar: 0,
      refund: 0,
      sisa_fisik: 0,
    });
    return false;
  }
  return true;
}

export default new TutupTokoService();
