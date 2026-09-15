import { Router } from 'express';
import tutupTokoController from '../controllers/tutupToko.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Seluruh endpoint wajib terautentikasi (JWT)
router.use(verifyToken);

/**
 * @route   GET /api/rekap-toko/:buka_toko_id
 * @desc    Mengambil 5 jenis data agregasi laporan keuangan & stok tutup toko
 * @access  Private
 */
router.get('/rekap-toko/:buka_toko_id', tutupTokoController.getRekapToko);

/**
 * @route   POST /api/tutup-toko
 * @desc    Eksekusi penutupan toko atomik (simpan foto, insert kebutuhan, update stok & buka_toko)
 * @access  Private
 */
router.post('/tutup-toko', tutupTokoController.prosesTutupToko);

export default router;
