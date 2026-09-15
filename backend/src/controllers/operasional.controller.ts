import { Request, Response } from 'express';
import operasionalService from '../services/operasional.service';
import { successResponse, errorResponse } from '../utils/response';

export class OperasionalController {
  /**
   * GET /api/operasional/status
   * Status operasional cabang, jumlah cabang aktif di kota, dan sesi buka toko saat ini
   */
  async getStatusOperasional(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      if (!cabangId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang kasir tidak ditemukan.', 401);
      }

      const status = await operasionalService.getStatusOperasional(cabangId);
      return successResponse(res, 'Status operasional berhasil diambil.', status);
    } catch (error: any) {
      console.error('Error getStatusOperasional:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mengambil status operasional.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * POST /api/ganti-shift
   * Update shift jaga_outlet atomik (akhiri shift lama ganti=1, aktifkan shift baru ganti=0)
   */
  async gantiShift(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      const adminId = req.kasir?.id;

      if (!cabangId || !adminId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang atau kasir tidak ditemukan.', 401);
      }

      const { buka_toko_id, kota_id, tgl, karyawan_baru_ids } = req.body;

      if (!Array.isArray(karyawan_baru_ids) || karyawan_baru_ids.length === 0) {
        return errorResponse(res, 'Pilih minimal satu karyawan untuk shift baru.', 400);
      }

      const result = await operasionalService.gantiShift(cabangId, adminId, {
        buka_toko_id,
        kota_id,
        tgl,
        karyawan_baru_ids,
      });

      return successResponse(res, 'Pergantian shift berhasil diproses.', result, 200);
    } catch (error: any) {
      console.error('Error gantiShift:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal memproses pergantian shift.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * GET /api/kebutuhan/barang
   * Mengambil master data barang kebutuhan aktif
   */
  async getBarangKebutuhan(req: Request, res: Response) {
    try {
      const data = await operasionalService.getMasterBarangKebutuhan();
      return successResponse(res, 'Daftar master barang kebutuhan berhasil diambil.', data);
    } catch (error: any) {
      console.error('Error getBarangKebutuhan:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mengambil data master barang kebutuhan.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * GET /api/kebutuhan
   * Mengambil riwayat barang kebutuhan yang telah dicatat pada sesi buka toko aktif
   */
  async getKebutuhanList(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      if (!cabangId) {
        return errorResponse(res, 'Sesi tidak valid.', 401);
      }

      // Ambil status untuk mendapatkan buka_toko_id aktif
      const status = await operasionalService.getStatusOperasional(cabangId);
      const bukaTokoId = req.query.buka_toko_id
        ? Number(req.query.buka_toko_id)
        : status.buka_toko_id;

      if (!bukaTokoId) {
        return successResponse(res, 'Toko belum dibuka atau tidak ada sesi aktif.', []);
      }

      const list = await operasionalService.getKebutuhanByBukaToko(bukaTokoId);
      return successResponse(res, 'Riwayat barang kebutuhan berhasil diambil.', list);
    } catch (error: any) {
      console.error('Error getKebutuhanList:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mengambil riwayat barang kebutuhan.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * POST /api/kebutuhan
   * Mencatat jurnal barang kebutuhan (Debit 13, Kredit 14) dengan markup 10% dari stok_gudang
   */
  async addKebutuhan(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      const adminId = req.kasir?.id;

      if (!cabangId || !adminId) {
        return errorResponse(res, 'Sesi tidak valid.', 401);
      }

      const { items, buka_toko_id, tgl, kota_id } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return errorResponse(res, 'Daftar barang kebutuhan tidak boleh kosong.', 400);
      }

      const result = await operasionalService.addKebutuhan(cabangId, adminId, {
        items,
        buka_toko_id,
        tgl,
        kota_id,
      });

      return successResponse(res, 'Barang kebutuhan berhasil dicatat ke jurnal akuntansi.', result, 201);
    } catch (error: any) {
      console.error('Error addKebutuhan:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mencatat barang kebutuhan.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * DELETE /api/kebutuhan/:kd_gabungan
   * Menghapus sepasang jurnal kebutuhan secara bersih berdasarkan kd_gabungan
   */
  async deleteKebutuhan(req: Request, res: Response) {
    try {
      const kdGabunganParam = Array.isArray(req.params.kd_gabungan)
        ? req.params.kd_gabungan[0]
        : req.params.kd_gabungan;

      if (!kdGabunganParam) {
        return errorResponse(res, 'Parameter kd_gabungan diperlukan.', 400);
      }

      const result = await operasionalService.deleteKebutuhan(String(kdGabunganParam));
      return successResponse(res, 'Jurnal barang kebutuhan berhasil dihapus.', result);
    } catch (error: any) {
      console.error('Error deleteKebutuhan:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal menghapus barang kebutuhan.';
      return errorResponse(res, message, statusCode);
    }
  }
}

export const operasionalController = new OperasionalController();
export default operasionalController;
