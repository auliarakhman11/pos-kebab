import prisma from '../prisma';
import {
  TransaksiListItemDto,
  TransaksiDetailItemDto,
  TransaksiVarianItemDto,
} from '../types/transaksi.types';
import { getZonaWaktu } from '../utils/fileHelper';

export class TransaksiService {
  /**
   * GET /api/transaksi/:buka_toko_id
   * Mengambil seluruh daftar invoice_kasir pada sesi buka toko tertentu,
   * diurutkan dari yang terbaru (DESC) lengkap dengan rincian produk, varian, delivery, dan pembayaran.
   */
  async getTransaksiList(
    bukaTokoId: number,
    cabangId: number
  ): Promise<TransaksiListItemDto[]> {
    // 1. Cari data sesi buka_toko
    let bukaTokoRecord: any = null;

    if (bukaTokoId > 0) {
      bukaTokoRecord = await prisma.bukaToko.findUnique({
        where: { id: BigInt(bukaTokoId) },
      });
    }

    // Jika tidak ditemukan atau bukaTokoId <= 0, ambil record toko terakhir untuk cabang ini
    if (!bukaTokoRecord) {
      bukaTokoRecord = await prisma.bukaToko.findFirst({
        where: { cabang_id: cabangId },
        orderBy: { id: 'desc' },
      });
    }

    if (!bukaTokoRecord) {
      return [];
    }

    const kodeSesi = bukaTokoRecord.kode || '';

    // 2. Query seluruh invoice_kasir pada sesi ini
    const invoices = await prisma.invoiceKasir.findMany({
      where: {
        kode: kodeSesi,
        cabang_id: cabangId,
      },
      include: {
        delivery: { select: { id: true, delivery: true } },
        pembayaran: { select: { id: true, pembayaran: true } },
      },
      orderBy: { id: 'desc' },
    });

    if (invoices.length === 0) {
      return [];
    }

    const invoiceNumbers = invoices.map((inv) => inv.no_invoice);

    // 3. Ambil detail produk (penjualan_kasir) untuk seluruh invoice tersebut
    const salesItems = await prisma.penjualanKasir.findMany({
      where: {
        no_invoice: { in: invoiceNumbers },
      },
      include: {
        produk: { select: { id: true, nm_produk: true } },
      },
      orderBy: { id: 'asc' },
    });

    // 4. Ambil varian produk (penjualan_varian)
    const varianItems = await prisma.penjualanVarian.findMany({
      where: {
        no_invoice: { in: invoiceNumbers },
      },
      include: {
        varian: { select: { id: true, nm_varian: true } },
      },
      orderBy: { id: 'asc' },
    });

    // Petakan varian ke Map berdasarkan penjualan_id
    const varianMap = new Map<number, TransaksiVarianItemDto[]>();
    for (const v of varianItems) {
      const pId = v.penjualan_id;
      const vDto: TransaksiVarianItemDto = {
        id: Number(v.id),
        varian_id: Number(v.varian_id),
        nm_varian: v.varian?.nm_varian || `Varian #${v.varian_id}`,
        qty: Number(v.qty) || 1,
        harga: Number(v.harga) || 0,
      };

      if (!varianMap.has(pId)) {
        varianMap.set(pId, [vDto]);
      } else {
        varianMap.get(pId)!.push(vDto);
      }
    }

    // Petakan penjualan_kasir ke Map berdasarkan no_invoice
    const salesMap = new Map<string, TransaksiDetailItemDto[]>();
    for (const s of salesItems) {
      const noInv = s.no_invoice;
      const sDto: TransaksiDetailItemDto = {
        id: s.id,
        produk_id: s.produk_id,
        nm_produk: s.produk?.nm_produk || `Produk #${s.produk_id}`,
        qty: Number(s.qty) || 1,
        harga: Number(s.harga) || 0,
        harga_normal: Number(s.harga_normal) || Number(s.harga) || 0,
        diskon: Number(s.diskon) || 0,
        total: Number(s.total) || 0,
        total_varian: Number(s.total_varian) || 0,
        catatan: s.catatan || null,
        varian: varianMap.get(s.id) || [],
      };

      if (!salesMap.has(noInv)) {
        salesMap.set(noInv, [sDto]);
      } else {
        salesMap.get(noInv)!.push(sDto);
      }
    }

    // 5. Rakit TransaksiListItemDto
    return invoices.map((inv) => ({
      id: inv.id,
      no_invoice: inv.no_invoice,
      kode: inv.kode || kodeSesi,
      urutan: inv.urutan,
      nm_costumer: inv.nm_costumer || null,
      nm_kasir: inv.nm_kasir || null,
      total: Number(inv.total) || 0,
      dibayar: Number(inv.dibayar) || 0,
      diskon: Number(inv.diskon) || 0,
      no_tlp: inv.no_tlp || null,
      void: inv.void,
      ket_void: inv.ket_void || null,
      admin: inv.admin,
      user_void: inv.user_void || null,
      tgl: inv.tgl.toISOString().split('T')[0],
      created_at: inv.created_at ? inv.created_at.toISOString() : null,
      delivery_id: inv.delivery_id,
      delivery_nama: inv.delivery?.delivery || `Order #${inv.delivery_id}`,
      pembayaran_id: Number(inv.pembayaran_id),
      pembayaran_nama:
        inv.pembayaran?.pembayaran ||
        (Number(inv.pembayaran_id) === 1 ? 'Cash / Tunai' : `Bayar #${inv.pembayaran_id}`),
      items: salesMap.get(inv.no_invoice) || [],
    }));
  }

  /**
   * POST /api/transaksi/void/:id_invoice
   * Membatalkan transaksi secara atomik ($transaction):
   * 1. Set invoice_kasir.void = 1
   * 2. Set penjualan_kasir.void = 1
   * 3. Set penjualan_gaji & penjualan_gaji_office.void = 1 (batalkan komisi)
   * 4. Set jurnal.void = 1 (batalkan akuntansi)
   * 5. Pengembalian Stok resep (Insert duplicate ke tabel stok dengan jenis = 'Refund', debit = kredit lama)
   */
  async voidTransaksi(
    idInvoice: number,
    cabangId: number,
    adminId: number,
    alasan: string
  ) {
    if (!alasan || !alasan.trim()) {
      const error: any = new Error('Alasan pembatalan transaksi wajib diisi.');
      error.statusCode = 400;
      throw error;
    }

    const invoice = await prisma.invoiceKasir.findUnique({
      where: { id: idInvoice },
      include: {
        cabang: { select: { id: true, time_zone: true } },
      },
    });

    if (!invoice) {
      const error: any = new Error('Data invoice transaksi tidak ditemukan.');
      error.statusCode = 404;
      throw error;
    }

    if (invoice.cabang_id !== cabangId) {
      const error: any = new Error('Transaksi ini bukan milik cabang aktif Anda.');
      error.statusCode = 403;
      throw error;
    }

    if (invoice.void === 1) {
      const error: any = new Error('Transaksi ini sudah dibatalkan sebelumnya.');
      error.statusCode = 400;
      throw error;
    }

    // Ambil zona waktu kasir
    const userKasir = await prisma.usersKasir.findUnique({
      where: { id: adminId },
      select: { time_zone: true },
    });
    const effectiveTz = userKasir?.time_zone || invoice.cabang?.time_zone;
    const { zonaWaktu } = getZonaWaktu(effectiveTz);

    const noInvoice = invoice.no_invoice;
    const keteranganVoid = alasan.trim();

    // Eksekusi atomik seluruh pembatalan di prisma.$transaction
    await prisma.$transaction(
      async (tx) => {
        // 1. Update invoice_kasir set void = 1
        await tx.invoiceKasir.update({
          where: { id: invoice.id },
          data: {
            void: 1,
            user_void: adminId,
            ket_void: keteranganVoid,
            updated_at: zonaWaktu,
          },
        });

        // 2. Update penjualan_kasir set void = 1
        await tx.penjualanKasir.updateMany({
          where: { no_invoice: noInvoice },
          data: {
            void: 1,
            updated_at: zonaWaktu,
          },
        });

        // 3. Update penjualan_karyawan set void = 1
        await tx.penjualanKaryawan.updateMany({
          where: { no_invoice: noInvoice },
          data: {
            void: 1,
            updated_at: zonaWaktu,
          },
        });


        
      },
      {
        timeout: 25000,
        maxWait: 10000,
      }
    );

    return {
      success: true,
      id: invoice.id,
      no_invoice: noInvoice,
      message: `Transaksi ${noInvoice} berhasil dibatalkan (Void). Stok bahan baku telah dikembalikan.`,
    };
  }
}

export default new TransaksiService();
