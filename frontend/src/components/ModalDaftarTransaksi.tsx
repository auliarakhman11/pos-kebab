'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import {
  Receipt,
  Search,
  RefreshCw,
  Printer,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShoppingBag,
  TrendingUp,
  Ban,
  Clock,
  User,
  CreditCard,
  Truck,
  Check,
} from 'lucide-react';
import {
  printReceiptBluetooth,
  formatReceiptDateTime,
  ReceiptDataForPrint,
} from '@/utils/printBluetooth';

interface TransaksiVarianItem {
  id: number;
  varian_id: number;
  nm_varian: string;
  qty: number;
  harga: number;
}

interface TransaksiDetailItem {
  id: number;
  produk_id: number;
  nm_produk: string;
  qty: number;
  harga: number;
  harga_normal: number;
  diskon: number;
  total: number;
  total_varian: number;
  catatan?: string | null;
  varian: TransaksiVarianItem[];
}

interface TransaksiItem {
  id: number;
  no_invoice: string;
  kode: string;
  urutan: number;
  nm_costumer?: string | null;
  nm_kasir?: string | null;
  total: number;
  dibayar: number;
  diskon: number;
  no_tlp?: string | null;
  void: number;
  ket_void?: string | null;
  admin: number;
  user_void?: number | null;
  tgl: string;
  created_at?: string | null;
  delivery_id: number;
  delivery_nama: string;
  pembayaran_id: number;
  pembayaran_nama: string;
  items: TransaksiDetailItem[];
}

interface ModalDaftarTransaksiProps {
  isOpen: boolean;
  onClose: () => void;
  bukaTokoId?: number | null;
  cabangNama?: string;
}

export default function ModalDaftarTransaksi({
  isOpen,
  onClose,
  bukaTokoId,
  cabangNama,
}: ModalDaftarTransaksiProps) {
  const { user, cabang } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [transaksiList, setTransaksiList] = useState<TransaksiItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'void'>('all');

  // State Detail Transaksi Modal
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<TransaksiItem | null>(null);

  // State Void Confirmation Dialog
  const [txToVoid, setTxToVoid] = useState<TransaksiItem | null>(null);
  const [alasanVoid, setAlasanVoid] = useState('');
  const [alasanVoidError, setAlasanVoidError] = useState<string | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  // State Printing
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch Transaksi saat Modal Terbuka
  useEffect(() => {
    if (isOpen) {
      fetchTransaksiList();
      setSearchQuery('');
      setStatusFilter('all');
      setSelectedTxForDetail(null);
      setTxToVoid(null);
      setAlasanVoid('');
      setAlasanVoidError(null);
      setNotification(null);
    }
  }, [isOpen, bukaTokoId]);

  const fetchTransaksiList = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('pos_access_token');
      const targetId = bukaTokoId || 0;
      const res = await api.get(`/transaksi/${targetId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        setTransaksiList(res.data.data);
      }
    } catch (err: any) {
      console.error('Gagal memuat riwayat transaksi:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memuat data transaksi.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter List Transaksi (Search & Status)
  const filteredList = useMemo(() => {
    return transaksiList.filter((tx) => {
      // Filter Status
      if (statusFilter === 'valid' && tx.void !== 0) return false;
      if (statusFilter === 'void' && tx.void !== 1) return false;

      // Filter Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchInvoice = tx.no_invoice.toLowerCase().includes(query);
        const matchCustomer = (tx.nm_costumer || '').toLowerCase().includes(query);
        const matchUrutan = String(tx.urutan).includes(query);
        const matchProduct = tx.items.some((it) =>
          it.nm_produk.toLowerCase().includes(query)
        );
        return matchInvoice || matchCustomer || matchUrutan || matchProduct;
      }

      return true;
    });
  }, [transaksiList, searchQuery, statusFilter]);

  // Perhitungan Ringkasan
  const summary = useMemo(() => {
    let totalTransaksi = transaksiList.length;
    let totalOmsetValid = 0;
    let totalVoid = 0;

    for (const tx of transaksiList) {
      if (tx.void === 0) {
        totalOmsetValid += tx.total;
      } else {
        totalVoid += 1;
      }
    }

    return {
      totalTransaksi,
      totalOmsetValid,
      totalVoid,
    };
  }, [transaksiList]);

  // Handler Cetak Ulang Struk via Bluetooth
  const handlePrintUlang = async (tx: TransaksiItem) => {
    setPrintingId(tx.id);
    setNotification(null);

    try {
      const receiptPayload: ReceiptDataForPrint = {
        no_invoice: tx.no_invoice,
        urutan: tx.urutan,
        cabang_nama: cabang?.nama || cabangNama || 'Cabang Kebab Yasmin',
        cabang_telepon: (cabang as any)?.telepon || undefined,
        waktu_transaksi: formatReceiptDateTime(tx.created_at || tx.tgl),
        waktu_cetak: formatReceiptDateTime(),
        kasir_nama: tx.nm_kasir || user?.name || 'Kasir',
        nm_costumer: tx.nm_costumer || undefined,
        jenis_order: tx.delivery_nama,
        items: tx.items.map((item) => ({
          qty: item.qty,
          nm_produk: item.nm_produk,
          varian_str:
            item.varian && item.varian.length > 0
              ? item.varian.map((v) => v.nm_varian).join(', ')
              : undefined,
          harga_satuan: item.harga,
          total_harga: item.total,
          catatan: item.catatan || undefined,
        })),
        subtotal: tx.total + tx.diskon,
        diskon: tx.diskon > 0 ? tx.diskon : undefined,
        total_bayar: tx.total,
        dibayar: tx.dibayar,
        kembalian: Math.max(0, tx.dibayar - tx.total),
      };

      await printReceiptBluetooth(receiptPayload);
      setNotification({
        type: 'success',
        message: `Struk transaksi #${tx.no_invoice} berhasil dicetak ulang!`,
      });
    } catch (err: any) {
      console.error('Print ulang error:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menyambungkan ke printer thermal Bluetooth.',
      });
    } finally {
      setPrintingId(null);
    }
  };

  // Handler Eksekusi Void Transaksi
  const handleConfirmVoid = async () => {
    if (!txToVoid) return;

    const trimmedAlasan = alasanVoid.trim();
    if (!trimmedAlasan) {
      setAlasanVoidError('Alasan pembatalan transaksi wajib diisi.');
      return;
    }

    setIsVoiding(true);
    setNotification(null);
    setAlasanVoidError(null);

    try {
      const token = Cookies.get('pos_access_token');
      const res = await api.post(
        `/transaksi/void/${txToVoid.id}`,
        { alasan: trimmedAlasan },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data?.success) {
        setNotification({
          type: 'success',
          message: `Transaksi #${txToVoid.no_invoice} berhasil dibatalkan (Void).`,
        });
        setTxToVoid(null);
        setAlasanVoid('');
        setAlasanVoidError(null);
        // Refresh daftar transaksi
        await fetchTransaksiList();
      } else {
        throw new Error(res.data?.message || 'Gagal membatalkan transaksi.');
      }
    } catch (err: any) {
      console.error('Void error:', err);
      setNotification({
        type: 'error',
        message:
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memproses pembatalan transaksi.',
      });
    } finally {
      setIsVoiding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* ===================================================================== */}
        {/* HEADER MODAL                                                          */}
        {/* ===================================================================== */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Riwayat Transaksi Kasir
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                  Shift Ini
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cabang?.nama || cabangNama || 'Cabang Kebab Yasmin'} &bull; Kelola struk, cetak ulang, dan pembatalan transaksi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchTransaksiList}
              disabled={loading}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TOAST NOTIFIKASI                                                      */}
        {/* ===================================================================== */}
        {notification && (
          <div
            className={`mx-5 mt-4 p-3 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs animate-in fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 hover:opacity-75 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ===================================================================== */}
        {/* KARTU RINGKASAN & FILTER PENCARIAN                                    */}
        {/* ===================================================================== */}
        <div className="p-4 sm:p-5 space-y-4 border-b border-slate-100 dark:border-slate-800">
          {/* 3 Ringkasan Metrik */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Transaksi
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {summary.totalTransaksi} <span className="text-xs font-semibold text-slate-400">Trx</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Omset Bersih Valid
                </span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Rp {summary.totalOmsetValid.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Transaksi Dibatalkan (Void)
                </span>
                <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  {summary.totalVoid} <span className="text-xs font-semibold text-slate-400">Trx</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <Ban className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Baris Filter & Search Input */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no invoice, pelanggan, atau menu..."
                className="w-full h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua ({transaksiList.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('valid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'valid'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                Sukses ({transaksiList.filter((t) => t.void === 0).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('void')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'void'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                Void ({summary.totalVoid})
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TABEL LIST TRANSAKSI                                                  */}
        {/* ===================================================================== */}
        <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[300px]">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider z-10">
              <tr>
                <th className="py-3 px-4">Antrian / No Invoice</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-3">Channel / Bayar</th>
                <th className="py-3 px-3 text-right">Total Belanja</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-7 h-7 animate-spin text-amber-500 mx-auto mb-2" />
                    <p className="font-semibold">Memuat riwayat transaksi kasir...</p>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="font-semibold">
                      {searchQuery
                        ? `Tidak ada transaksi yang cocok dengan "${searchQuery}"`
                        : 'Belum ada transaksi penjualan pada shift ini.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((tx) => {
                  const isVoid = tx.void === 1;
                  const timeFormatted = tx.created_at
                    ? (() => {
                        const d = new Date(tx.created_at.replace(/Z$/i, ''));
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        const hours = String(d.getHours()).padStart(2, '0');
                        const minutes = String(d.getMinutes()).padStart(2, '0');
                        return `${day}/${month}/${year} ${hours}:${minutes}`;
                      })()
                    : '-';

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isVoid ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Urutan & No Invoice */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
                            #{tx.urutan}
                          </span>
                          <div>
                            <div
                              className={`font-mono font-bold tracking-tight ${
                                isVoid
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {tx.no_invoice}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {tx.items.length} macam produk
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Waktu */}
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{timeFormatted}</span>
                        </div>
                      </td>

                      {/* Pelanggan */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {tx.nm_costumer || 'Pelanggan Umum'}
                          </span>
                        </div>
                      </td>

                      {/* Channel & Pembayaran */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <Truck className="w-3 h-3" />
                            <span>{tx.delivery_nama}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <CreditCard className="w-3 h-3" />
                            <span>{tx.pembayaran_nama}</span>
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right">
                        <div
                          className={`font-mono font-black ${
                            isVoid
                              ? 'line-through text-rose-400 dark:text-rose-500/70 text-xs'
                              : 'text-slate-900 dark:text-white text-sm'
                          }`}
                        >
                          Rp {tx.total.toLocaleString('id-ID')}
                        </div>
                        {tx.diskon > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Hemat Rp {tx.diskon.toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isVoid ? (
                          <span
                            title={tx.ket_void ? `Alasan: ${tx.ket_void}` : 'Transaksi dibatalkan'}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Dibatalkan</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            <Check className="w-3 h-3" />
                            <span>Sukses</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi Baris */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Tombol Detail */}
                          <button
                            type="button"
                            onClick={() => setSelectedTxForDetail(tx)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-all cursor-pointer"
                            title="Lihat Detail Produk"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Tombol Cetak Ulang Struk Bluetooth */}
                          <button
                            type="button"
                            disabled={printingId === tx.id}
                            onClick={() => handlePrintUlang(tx)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-all cursor-pointer disabled:opacity-50"
                            title="Cetak Ulang Struk (Bluetooth)"
                          >
                            {printingId === tx.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : (
                              <Printer className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 3. Tombol Void (Merah) - Hanya muncul jika belum void */}
                          {!isVoid && (
                            <button
                              type="button"
                              onClick={() => {
                                setTxToVoid(tx);
                                setAlasanVoid('');
                                setAlasanVoidError(null);
                              }}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-all cursor-pointer border border-rose-200 dark:border-rose-900/50"
                              title="Batalkan / Void Transaksi Ini"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================================== */}
        {/* FOOTER MODAL                                                          */}
        {/* ===================================================================== */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredList.length}</span> dari{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{transaksiList.length}</span> transaksi
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 2: DETAIL PRODUK TRANSAKSI                                      */}
      {/* ===================================================================== */}
      {selectedTxForDetail && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 p-1 flex items-center justify-center shrink-0 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-yasmin.png"
                    alt="Logo Kebab Yasmin"
                    className="w-full h-auto max-h-9 object-contain dark:hidden"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-yasmin-dark.png"
                    alt="Logo Kebab Yasmin"
                    className="w-full h-auto max-h-9 object-contain hidden dark:block"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-600 font-bold uppercase tracking-wider">
                    Rincian Transaksi #{selectedTxForDetail.no_invoice}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedTxForDetail.nm_costumer || 'Pelanggan Umum'} &bull; #{selectedTxForDetail.urutan}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {selectedTxForDetail.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {item.qty}x {item.nm_produk}
                    </div>
                    {item.varian && item.varian.length > 0 && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        + {item.varian.map((v) => v.nm_varian).join(', ')}
                      </div>
                    )}
                    {item.catatan && (
                      <div className="text-[10px] text-slate-400 italic">
                        Catatan: &ldquo;{item.catatan}&rdquo;
                      </div>
                    )}
                  </div>
                  <div className="text-right font-mono font-bold text-slate-900 dark:text-white shrink-0">
                    Rp {item.total.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between text-slate-500">
                <span>Metode Pembayaran:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedTxForDetail.pembayaran_nama}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Jenis Order:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedTxForDetail.delivery_nama}
                </span>
              </div>
              {selectedTxForDetail.diskon > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon:</span>
                  <span className="font-bold font-mono">
                    -Rp {selectedTxForDetail.diskon.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Total Bayar:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  Rp {selectedTxForDetail.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePrintUlang(selectedTxForDetail)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Ulang Struk</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTxForDetail(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: KONFIRMASI VOID / PEMBATALAN TRANSAKSI                       */}
      {/* ===================================================================== */}
      {txToVoid && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-rose-300 dark:border-rose-900 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Batalkan Transaksi #{txToVoid.no_invoice}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tindakan ini akan membatalkan transaksi, membatalkan komisi gaji karyawan, serta mengembalikan stok bahan baku ke gudang outlet.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/40 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {txToVoid.nm_costumer || 'Pelanggan Umum'}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Nominal yang dibatalkan:</span>
                <span className="font-mono font-bold text-rose-600">
                  Rp {txToVoid.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>
                  Alasan Pembatalan <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-rose-500 font-bold lowercase tracking-normal">
                  (wajib diisi)
                </span>
              </label>
              <textarea
                rows={2}
                value={alasanVoid}
                onChange={(e) => {
                  setAlasanVoid(e.target.value);
                  if (alasanVoidError) setAlasanVoidError(null);
                }}
                placeholder="Contoh: Salah input pesanan / Customer membatalkan..."
                className={`w-full p-2.5 text-xs rounded-xl border ${
                  alasanVoidError
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                } text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 resize-none font-medium`}
              />
              {alasanVoidError && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{alasanVoidError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isVoiding}
                onClick={() => {
                  setTxToVoid(null);
                  setAlasanVoid('');
                  setAlasanVoidError(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isVoiding || !alasanVoid.trim()}
                onClick={handleConfirmVoid}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:shadow-none transition-all"
              >
                {isVoiding ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Membatalkan...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Ya, Batalkan Transaksi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
