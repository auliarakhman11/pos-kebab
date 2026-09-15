import { Router } from 'express';
import transaksiController from '../controllers/transaksi.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Seluruh endpoint wajib terautentikasi (JWT)
router.use(verifyToken);

/**
 * @route   GET /api/transaksi/:buka_toko_id
 * @desc    Mengambil riwayat transaksi invoice_kasir pada sesi toko tertentu
 * @access  Private
 */
router.get('/transaksi/:buka_toko_id', transaksiController.getTransaksiList);

/**
 * @route   POST /api/transaksi/void/:id_invoice
 * @desc    Membatalkan (Void) transaksi penjualan, reset komisi, dan kembalikan stok resep
 * @access  Private
 */
router.post('/transaksi/void/:id_invoice', transaksiController.voidTransaksi);

export default router;
