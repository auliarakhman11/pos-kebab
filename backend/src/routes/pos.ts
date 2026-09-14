import { Router } from 'express';
import posController from '../controllers/pos.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint POS terproteksi JWT
router.use(verifyToken);

/**
 * @route   GET /api/pos/init
 * @desc    Ambil data master katalog POS (Kategori, Produk, Delivery, Pembayaran, Varian)
 * @access  Private
 */
router.get('/pos/init', posController.getPosInitData);

export default router;
