import { Request, Response } from 'express';
import transaksiService from '../services/transaksi.service';
import { successResponse, errorResponse } from '../utils/response';

export class TransaksiController {
  /**
   * GET /api/transaksi/:buka_toko_id
   * Mengambil daftar seluruh transaksi invoice kasir pada sesi toko tertentu
   */
  async getTransaksiList(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      if (!cabangId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang kasir tidak ditemukan.', 401);
      }

      const rawParam = Array.isArray(req.params.buka_toko_id)
        ? req.params.buka_toko_id[0]
        : req.params.buka_toko_id;
      const bukaTokoId = Number(rawParam) || 0;

      const data = await transaksiService.getTransaksiList(bukaTokoId, cabangId);
      return successResponse(res, 'Daftar transaksi berhasil diambil.', data);
    } catch (error: any) {
      console.error('Error getTransaksiList:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mengambil daftar transaksi.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * POST /api/transaksi/void/:id_invoice
   * Membatalkan transaksi kasir, mencabut komisi gaji, membatalkan jurnal, dan mengembalikan stok
   */
  async voidTransaksi(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      const adminId = req.kasir?.id;

      if (!cabangId || !adminId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang atau kasir tidak ditemukan.', 401);
      }

      const rawParam = Array.isArray(req.params.id_invoice)
        ? req.params.id_invoice[0]
        : req.params.id_invoice;
      const idInvoice = Number(rawParam) || 0;

      if (!idInvoice) {
        return errorResponse(res, 'Parameter ID invoice tidak valid.', 400);
      }

      const { alasan } = req.body || {};
      if (!alasan || typeof alasan !== 'string' || !alasan.trim()) {
        return errorResponse(res, 'Alasan pembatalan transaksi wajib diisi.', 400);
      }

      const result = await transaksiService.voidTransaksi(
        idInvoice,
        cabangId,
        adminId,
        alasan.trim()
      );

      return successResponse(res, result.message, result, 200);
    } catch (error: any) {
      console.error('Error voidTransaksi:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal membatalkan transaksi.';
      return errorResponse(res, message, statusCode);
    }
  }
}

export default new TransaksiController();
