import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { successResponse } from '../utils/response';

const router = Router();

/**
 * @route   POST /api/login
 * @desc    Autentikasi kasir & verifikasi status operasional cabang
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/me
 * @desc    Cek sesi dan profil kasir yang sedang login
 * @access  Private (JWT Required)
 */
router.get('/me', verifyToken, (req, res) => {
  return successResponse(res, 'Sesi kasir aktif.', { kasir: req.kasir });
});

export default router;
