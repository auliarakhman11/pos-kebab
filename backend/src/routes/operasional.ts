import { Router } from 'express';
import operasionalController from '../controllers/operasional.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Seluruh endpoint operasional terproteksi JWT
router.use(verifyToken);

/**
 * @route   GET /api/operasional/status
 * @desc    Ambil status operasional, jumlah cabang aktif kota, dan sesi buka toko
 * @access  Private
 */
router.get('/operasional/status', operasionalController.getStatusOperasional);

/**
 * @route   POST /api/ganti-shift
 * @desc    Proses pergantian shift kasir (jaga_outlet) secara atomik
 * @access  Private
 */
router.post('/ganti-shift', operasionalController.gantiShift);

/**
 * @route   GET /api/kebutuhan/barang
 * @desc    Ambil daftar master barang kebutuhan aktif
 * @access  Private
 */
router.get('/kebutuhan/barang', operasionalController.getBarangKebutuhan);

/**
 * @route   GET /api/kebutuhan
 * @desc    Ambil riwayat barang kebutuhan sesi buka toko aktif
 * @access  Private
 */
router.get('/kebutuhan', operasionalController.getKebutuhanList);

/**
 * @route   POST /api/kebutuhan
 * @desc    Catat barang kebutuhan ke jurnal akuntansi (Debit 13, Kredit 14) markup 10%
 * @access  Private
 */
router.post('/kebutuhan', operasionalController.addKebutuhan);

/**
 * @route   DELETE /api/kebutuhan/:kd_gabungan
 * @desc    Hapus sepasang jurnal kebutuhan berdasarkan kd_gabungan
 * @access  Private
 */
router.delete('/kebutuhan/:kd_gabungan', operasionalController.deleteKebutuhan);

export default router;
