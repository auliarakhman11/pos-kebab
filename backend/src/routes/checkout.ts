import { Router } from 'express';
import checkoutController from '../controllers/checkout.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint checkout terproteksi autentikasi JWT
router.use(verifyToken);

/**
 * @route   POST /api/checkout
 * @desc    Proses transaksi checkout kasir ERP secara atomik ($transaction)
 * @access  Private (Kasir)
 */
router.post('/checkout', checkoutController.prosesCheckout);

export default router;
