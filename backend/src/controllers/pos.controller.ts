import { Request, Response } from 'express';
import posService from '../services/pos.service';
import { successResponse, errorResponse } from '../utils/response';

export class PosController {
  /**
   * GET /api/pos/init
   * Mengambil data inisialisasi modul POS (Kategori, Produk, Delivery, Pembayaran, Varian)
   */
  async getPosInitData(req: Request, res: Response) {
    try {
      const data = await posService.getPosInitData();
      return successResponse(res, 'Data inisialisasi POS berhasil diambil.', data);
    } catch (error: any) {
      console.error('Error getPosInitData:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mengambil data katalog POS.';
      return errorResponse(res, message, statusCode);
    }
  }
}

export const posController = new PosController();
export default posController;
