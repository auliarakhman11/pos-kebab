import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response';

export class AuthController {
  /**
   * Handler untuk POST /api/login
   */
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const result = await authService.login({ username, password });

      return successResponse(res, 'Login berhasil.', {
        token: result.token,
        ...result.session,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Terjadi kesalahan pada server saat proses login.';
      return errorResponse(res, message, statusCode);
    }
  }
}

export const authController = new AuthController();
export default authController;
