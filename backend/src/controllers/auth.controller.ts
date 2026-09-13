import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response';

export class AuthController {
  /**
   * POST /api/login
   * Login kasir & generate Access Token (1 jam) + Refresh Token (7 hari)
   */
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const result = await authService.login({ username, password });

      return successResponse(res, 'Login berhasil.', {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        ...result.session,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Terjadi kesalahan pada server saat proses login.';
      return errorResponse(res, message, statusCode);
    }
  }

  /**
   * POST /api/refresh-token
   * Menerima refreshToken dan menerbitkan accessToken baru
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);

      return successResponse(res, 'Access token berhasil diperbarui.', result);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal memperbarui access token.';
      return res.status(statusCode).json({
        success: false,
        message,
        code: error.code || 'REFRESH_FAILED',
      });
    }
  }

  /**
   * GET /api/kasir-list
   * Ambil daftar kasir cabang aktif (cabang.off === 0) untuk dropdown login
   */
  async getActiveKasirList(req: Request, res: Response) {
    try {
      const list = await authService.getActiveKasirList();
      return successResponse(res, 'Daftar kasir aktif berhasil diambil.', list);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Gagal mengambil daftar kasir.';
      return errorResponse(res, message, statusCode);
    }
  }
}

export const authController = new AuthController();
export default authController;
