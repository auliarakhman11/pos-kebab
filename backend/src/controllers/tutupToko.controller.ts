import { Request, Response } from 'express';
import tutupTokoService from '../services/tutupToko.service';
import { successResponse, errorResponse } from '../utils/response';

export class TutupTokoController {
  /**
   * GET /api/rekap-toko/:buka_toko_id
   * Mengambil 5 jenis data agregasi laporan untuk persiapan tutup toko / EOD
   */
  async getRekapToko(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      if (!cabangId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang kasir tidak ditemukan.', 401);
      }

      const rawParam = Array.isArray(req.params.buka_toko_id)
        ? req.params.buka_toko_id[0]
        : req.params.buka_toko_id;

      const isPrevious = rawParam === 'sebelumnya' || rawParam === 'prev' || rawParam === 'previous';
      const bukaTokoId = isPrevious ? 0 : Number(rawParam) || 0;

      const data = await tutupTokoService.getRekapToko(bukaTokoId, cabangId, isPrevious);
      return successResponse(res, 'Data rekap toko berhasil diambil.', data);
    } catch (error: any) {
      console.error('Error getRekapToko:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mengambil data rekap toko.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * POST /api/tutup-toko
   * Eksekusi simpan foto & tutup toko secara atomik
   */
  async prosesTutupToko(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      const adminId = req.kasir?.id;

      if (!cabangId || !adminId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang atau kasir tidak ditemukan.', 401);
      }

      const {
        id_buka_toko,
        kode_buka_toko,
        ket_kebutuhan,
        kebutuhan,
        foto_luar,
        foto_dalam,
        foto_belakang,
      } = req.body;

      if (!id_buka_toko || !kode_buka_toko) {
        return errorResponse(res, 'Parameter id_buka_toko dan kode_buka_toko wajib diisi.', 400);
      }

      // Validasi foto
      if (!foto_luar || !foto_dalam || !foto_belakang) {
        return errorResponse(res, 'Ambil foto terlebih dahulu.', 400);
      }

      const result = await tutupTokoService.tutupToko(cabangId, adminId, {
        id_buka_toko,
        cabang_id: cabangId,
        kode_buka_toko,
        ket_kebutuhan,
        kebutuhan,
        foto_luar,
        foto_dalam,
        foto_belakang,
      });

      return successResponse(res, 'Toko berhasil ditutup.', result, 200);
    } catch (error: any) {
      console.error('Error prosesTutupToko:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal memproses tutup toko.';
      return errorResponse(res, message, statusCode);
    }
  }
}

export default new TutupTokoController();
