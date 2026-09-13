import { Request, Response } from 'express';
import bukaTokoService from '../services/bukaToko.service';
import { successResponse, errorResponse } from '../utils/response';

export class BukaTokoController {
  /**
   * GET /api/status-toko
   * Cek status buka/tutup cabang kasir yang sedang login
   */
  async getStatusToko(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;

      if (!cabangId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang tidak ditemukan.', 400);
      }

      const status = await bukaTokoService.checkStatusToko(cabangId);

      return successResponse(res, status.is_open ? 'Toko sedang buka.' : 'Toko belum dibuka hari ini.', status);
    } catch (error: any) {
      console.error('Error getStatusToko:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mengecek status operasional toko.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * GET /api/buka-toko/form-data
   * Ambil data pendukung pengisian form buka toko (bahan aktif & karyawan jaga)
   */
  async getFormData(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;

      if (!cabangId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang tidak ditemukan.', 400);
      }

      const formData = await bukaTokoService.getFormDataBukaToko(cabangId);

      return successResponse(res, 'Data form buka toko berhasil diambil.', formData);
    } catch (error: any) {
      console.error('Error getFormData:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mengambil data form buka toko.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * POST /api/buka-toko
   * Proses pembukaan toko dengan atomic transaction
   */
  async prosesBukaToko(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      const adminId = req.kasir?.id;

      if (!cabangId || !adminId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang atau kasir tidak ditemukan.', 400);
      }

      const { barang_bawaan = [], karyawan_jaga = [], foto_luar, foto_dalam, foto_belakang } = req.body;

      const result = await bukaTokoService.prosesBukaToko(cabangId, adminId, {
        barang_bawaan,
        karyawan_jaga,
        foto_luar,
        foto_dalam,
        foto_belakang,
      });

      return successResponse(res, 'Proses Buka Toko berhasil dicatat.', result, 201);
    } catch (error: any) {
      console.error('Error prosesBukaToko:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Terjadi kesalahan saat memproses Buka Toko.';
      return errorResponse(res, message, statusCode);
    }
  }
}

export const bukaTokoController = new BukaTokoController();
export default bukaTokoController;
