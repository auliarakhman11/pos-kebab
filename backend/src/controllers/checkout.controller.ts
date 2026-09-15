import { Request, Response } from 'express';
import checkoutService from '../services/checkout.service';
import { successResponse, errorResponse } from '../utils/response';

export class CheckoutController {
  /**
   * POST /api/checkout
   * Memproses transaksi penjualan kasir (ERP & Cetak Struk)
   */
  async prosesCheckout(req: Request, res: Response) {
    try {
      const cabangId = req.kasir?.cabang_id;
      const adminId = req.kasir?.id;

      if (!cabangId || !adminId) {
        return errorResponse(res, 'Sesi tidak valid: Informasi kasir atau cabang tidak ditemukan.', 401);
      }

      const payload = req.body;
      if (!payload || !payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
        return errorResponse(res, 'Item keranjang belanja wajib diisi.', 400);
      }

      const result = await checkoutService.prosesCheckout(cabangId, adminId, payload);

      return successResponse(res, 'Transaksi checkout berhasil diproses.', result, 201);
    } catch (error: any) {
      console.error('Error Checkout Controller:', error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Terjadi kesalahan sistem saat memproses transaksi.';
      return errorResponse(res, message, statusCode);
    }
  }
}

export const checkoutController = new CheckoutController();
export default checkoutController;
