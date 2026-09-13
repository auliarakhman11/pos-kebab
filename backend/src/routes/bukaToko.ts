import { Router } from 'express';
import bukaTokoController from '../controllers/bukaToko.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Seluruh endpoint wajib terautentikasi (JWT)
router.use(verifyToken);

/**
 * @route   GET /api/status-toko
 * @desc    Cek status buka/tutup toko cabang kasir
 * @access  Private
 */
router.get('/status-toko', bukaTokoController.getStatusToko);

/**
 * @route   GET /api/buka-toko/form-data
 * @desc    Mengambil data dropdown bahan dan karyawan untuk form buka toko
 * @access  Private
 */
router.get('/buka-toko/form-data', bukaTokoController.getFormData);

/**
 * @route   POST /api/buka-toko
 * @desc    Eksekusi form buka toko (buka_toko, jaga_outlet, stok) secara atomik
 * @access  Private
 */
router.post('/buka-toko', bukaTokoController.prosesBukaToko);

export default router;
