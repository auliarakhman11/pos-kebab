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
   * GET /api/karyawan
   * Ambil daftar karyawan aktif
   */
  async getKaryawanList(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      if (!cabangId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang tidak ditemukan.', 400);
      }
      const formData = await bukaTokoService.getFormDataBukaToko(cabangId);
      return successResponse(res, 'Data karyawan berhasil diambil.', formData.karyawan);
    } catch (error: any) {
      console.error('Error getKaryawanList:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mengambil daftar karyawan.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * POST /api/buka-toko/stok
   * Input stok barang bawaan awal toko (Konversi dari addStok Laravel)
   */
  async addStok(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      const adminId = req.kasir?.id;

      if (!cabangId || !adminId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang atau kasir tidak ditemukan.', 400);
      }

      const { bahan_id, debit, kode, timeZone } = req.body;

      if (!Array.isArray(bahan_id) || bahan_id.length === 0) {
        return errorResponse(res, 'Pilih minimal satu bahan untuk ditambahkan ke stok.', 400);
      }

      const result = await bukaTokoService.addStok(cabangId, adminId, {
        bahan_id,
        debit: Array.isArray(debit) ? debit : [],
        kode,
        timeZone,
      });

      return successResponse(res, 'Stok barang bawaan berhasil disimpan.', result, 201);
    } catch (error: any) {
      console.error('Error addStok:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal menambahkan stok barang bawaan.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * POST /api/buka-toko
   * Proses pembukaan toko dengan atomic transaction (Konversi dari bukaToko Laravel)
   */
  async prosesBukaToko(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      const adminId = req.kasir?.id;

      if (!cabangId || !adminId) {
        return errorResponse(res, 'Sesi tidak valid: Cabang atau kasir tidak ditemukan.', 400);
      }

      // Dukung parameter asli Laravel: foto_luar, foto_dalam, foto_belakang, leader, rolling, ms, foto_leader, foto_rolling, img_kry
      // Serta format modern dari frontend
      const body = {
        ...req.body,
        foto_luar: req.body.foto_luar || req.body.foto_outlet_luar,
        foto_dalam: req.body.foto_dalam || req.body.foto_outlet_dalam,
        foto_belakang: req.body.foto_belakang || req.body.foto_outlet_belakang || req.body.foto_dalam,
      };

      const result = await bukaTokoService.prosesBukaToko(cabangId, adminId, body);

      return successResponse(res, 'Berhasil membuka toko.', result, 201);
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
