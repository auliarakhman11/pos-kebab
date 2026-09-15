'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { useTheme } from '@/lib/theme';
import {
  Store,
  CheckCircle2,
  AlertCircle,
  Camera,
  RefreshCw,
  Printer,
  ChevronDown,
  Plus,
  Trash2,
  Sun,
  Moon,
  LogOut,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Receipt,
  Package,
  Layers,
  ShoppingBag,
  FileText,
  Clock,
  ShieldCheck,
  Search,
  X,
} from 'lucide-react';
import {
  printLaporanEodBluetooth,
  LaporanEodDataForPrint,
} from '@/utils/printBluetooth';

// Interface Data Rekap dari Backend
interface LaporanPenjualanItem {
  delivery_id: number;
  delivery_nama: string;
  pembayaran_id: number;
  pembayaran_nama: string;
  total_transaksi: number;
  total_penjualan: number;
}

interface DetailProdukItem {
  produk_id: number;
  nm_produk: string;
  delivery_id: number;
  delivery_nama: string;
  qty_terjual: number;
  total_uang: number;
}

interface PengeluaranItem {
  id: number;
  kd_gabungan: string;
  barang_id: number;
  nm_barang: string;
  qty: number;
  harga_satuan: number;
  total_harga: number;
  tgl: string;
}

interface BarangBawaanItem {
  bahan_id: number;
  nm_bahan: string;
  satuan: string;
  masuk: number;
  keluar: number;
  refund: number;
  sisa_fisik: number;
}

interface InfoToko {
  buka_toko_id: number;
  kode: string;
  cabang_id: number;
  cabang_nama: string;
  kota_id: number;
  tgl: string;
  buka: string;
  tutup: string | null;
  nm_karyawan: string;
}

interface MasterBarangKebutuhan {
  id: number;
  nm_barang: string;
  satuan?: {
    satuan: string;
  };
}

interface FormKebutuhanRow {
  id: string;
  barang_kebutuhan_id: string;
  qty: string;
}

// Searchable Select untuk Barang Kebutuhan dengan filter pencarian instan
function SearchableBarangSelect({
  value,
  onChange,
  barangList,
  placeholder = '-- Cari / Pilih Barang Kebutuhan --',
}: {
  value: string;
  onChange: (id: string) => void;
  barangList: MasterBarangKebutuhan[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = barangList.find((b) => String(b.id) === String(value));

  const filteredList = barangList.filter((b) =>
    b.nm_barang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-10 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 flex items-center justify-between cursor-pointer transition-all text-left shadow-2xs"
      >
        <span
          className={
            selectedItem
              ? 'text-slate-800 dark:text-slate-100 font-bold truncate'
              : 'text-slate-400 dark:text-slate-500 font-normal truncate'
          }
        >
          {selectedItem
            ? `${selectedItem.nm_barang}${selectedItem.satuan?.satuan ? ` (${selectedItem.satuan.satuan})` : ''}`
            : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2.5 animate-in fade-in zoom-in-95 duration-100 min-w-[280px]">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik nama barang..."
              className="w-full h-9 pl-9 pr-8 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredList.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 font-medium">
                Barang &ldquo;{searchTerm}&rdquo; tidak ditemukan
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelected = String(item.id) === String(value);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onChange(String(item.id));
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500 text-white font-bold shadow-xs'
                        : 'hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-900 dark:hover:text-amber-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{item.nm_barang}</span>
                    {item.satuan?.satuan && (
                      <span
                        className={`text-[10px] ml-1 shrink-0 ${
                          isSelected ? 'text-amber-100' : 'text-slate-400'
                        }`}
                      >
                        ({item.satuan.satuan})
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TutupTokoPage() {
  const router = useRouter();
  const { user, cabang, logout, initAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  // State Status Toko & Data Rekap
  const [loading, setLoading] = useState(true);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [activeBukaTokoId, setActiveBukaTokoId] = useState<number | null>(null);
  const [activeKode, setActiveKode] = useState<string>('');

  // 5 Data Agregasi Laporan
  const [infoToko, setInfoToko] = useState<InfoToko | null>(null);
  const [laporanPenjualan, setLaporanPenjualan] = useState<LaporanPenjualanItem[]>([]);
  const [detailProduk, setDetailProduk] = useState<DetailProdukItem[]>([]);
  const [laporanPengeluaran, setLaporanPengeluaran] = useState<{
    total_pengeluaran: number;
    items: PengeluaranItem[];
  }>({ total_pengeluaran: 0, items: [] });
  const [laporanKasBersih, setLaporanKasBersih] = useState<{
    total_penjualan_cash: number;
    total_pengeluaran_kebutuhan: number;
    kas_bersih: number;
  }>({ total_penjualan_cash: 0, total_pengeluaran_kebutuhan: 0, kas_bersih: 0 });
  const [laporanStok, setLaporanStok] = useState<BarangBawaanItem[]>([]);

  // Master Data Barang Kebutuhan untuk Form Dinamis
  const [masterBarangList, setMasterBarangList] = useState<MasterBarangKebutuhan[]>([]);

  // State Form Kebutuhan Akhir Shift
  const [kebutuhanRows, setKebutuhanRows] = useState<FormKebutuhanRow[]>([
    { id: 'row-1', barang_kebutuhan_id: '', qty: '' },
  ]);
  const [ketKebutuhan, setKetKebutuhan] = useState<string>('');

  // State 3 Foto Outlet Base64 (Wajib)
  const [fotoLuar, setFotoLuar] = useState<string>('');
  const [fotoDalam, setFotoDalam] = useState<string>('');
  const [fotoBelakang, setFotoBelakang] = useState<string>('');

  // State Kamera Modal Live Viewfinder
  const [activeCameraTarget, setActiveCameraTarget] = useState<
    'luar' | 'dalam' | 'belakang' | null
  >(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hidden File Inputs untuk Native Camera / Fallback
  const fileLuarRef = useRef<HTMLInputElement>(null);
  const fileDalamRef = useRef<HTMLInputElement>(null);
  const fileBelakangRef = useRef<HTMLInputElement>(null);

  // Submit & Loading State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Modal Sukses & Print Bluetooth
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  // Inisialisasi Auth dan Fetch Data Toko
  useEffect(() => {
    initAuth();
    loadStoreAndRekapData();
    return () => {
      // Cleanup stream jika ada
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const loadStoreAndRekapData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = Cookies.get('pos_access_token');
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Cek status toko cabang saat ini
      const statusRes = await api.get('/status-toko', { headers: authHeader });
      const statusData = statusRes.data?.data;

      if (!statusData || !statusData.is_open || !statusData.buka_toko_id) {
        setIsStoreOpen(false);
        setLoading(false);
        return;
      }

      setIsStoreOpen(true);
      const bId = Number(statusData.buka_toko_id);
      setActiveBukaTokoId(bId);
      setActiveKode(statusData.kode || '');

      // 2. Fetch Rekap Data Toko (5 Laporan)
      const rekapRes = await api.get(`/rekap-toko/${bId}`, { headers: authHeader });
      if (rekapRes.data?.success && rekapRes.data.data) {
        const d = rekapRes.data.data;
        setInfoToko(d.info_toko);
        setLaporanPenjualan(d.laporan_penjualan || []);
        setDetailProduk(d.detail_produk_terjual || []);
        setLaporanPengeluaran(d.laporan_pengeluaran || { total_pengeluaran: 0, items: [] });
        setLaporanKasBersih(
          d.laporan_kas_bersih || {
            total_penjualan_cash: 0,
            total_pengeluaran_kebutuhan: 0,
            kas_bersih: 0,
          }
        );
        setLaporanStok(d.laporan_barang_bawaan || []);
      }

      // 3. Fetch Master Barang Kebutuhan untuk Dropdown Form
      try {
        const masterRes = await api.get('/kebutuhan/barang', { headers: authHeader });
        if (masterRes.data?.success && Array.isArray(masterRes.data.data)) {
          setMasterBarangList(masterRes.data.data);
        }
      } catch (err) {
        console.warn('Gagal memuat master barang kebutuhan:', err);
      }
    } catch (err: any) {
      console.error('Error loadStoreAndRekapData:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal memuat data rekap toko.');
    } finally {
      setLoading(false);
    }
  };

  // Helper konversi file gambar ke Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Format file tidak didukung.'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handler Fallback Kamera Native / Upload File
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'luar' | 'dalam' | 'belakang'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      if (target === 'luar') setFotoLuar(base64);
      if (target === 'dalam') setFotoDalam(base64);
      if (target === 'belakang') setFotoBelakang(base64);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg('Gagal memproses file foto.');
    }
  };

  // Buka Modal Kamera Live
  const openLiveCamera = async (target: 'luar' | 'dalam' | 'belakang') => {
    setActiveCameraTarget(target);
    setCapturedSnapshot('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Kamera web tidak tersedia, fallback ke native:', err);
      closeCameraModal();
      if (target === 'luar') fileLuarRef.current?.click();
      if (target === 'dalam') fileDalamRef.current?.click();
      if (target === 'belakang') fileBelakangRef.current?.click();
    }
  };

  // Tutup Modal Kamera Live
  const closeCameraModal = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActiveCameraTarget(null);
    setCapturedSnapshot('');
  };

  // Jepret foto dari Live Viewfinder
  const takeSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedSnapshot(dataUrl);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      }
    }
  };

  // Konfirmasi Penggunaan Foto Jepretan
  const confirmSnapshot = () => {
    if (!capturedSnapshot) return;
    if (activeCameraTarget === 'luar') setFotoLuar(capturedSnapshot);
    if (activeCameraTarget === 'dalam') setFotoDalam(capturedSnapshot);
    if (activeCameraTarget === 'belakang') setFotoBelakang(capturedSnapshot);
    closeCameraModal();
  };

  // Form Dinamis Barang Kebutuhan
  const handleAddKebutuhanRow = () => {
    setKebutuhanRows((prev) => [
      ...prev,
      { id: `row-${Date.now()}`, barang_kebutuhan_id: '', qty: '' },
    ]);
  };

  const handleRemoveKebutuhanRow = (id: string) => {
    if (kebutuhanRows.length === 1) {
      setKebutuhanRows([{ id: `row-${Date.now()}`, barang_kebutuhan_id: '', qty: '' }]);
      return;
    }
    setKebutuhanRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleKebutuhanChange = (id: string, field: 'barang_kebutuhan_id' | 'qty', val: string) => {
    setKebutuhanRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  // Validasi Kelayakan Tutup Toko
  const arePhotosComplete = Boolean(fotoLuar && fotoDalam && fotoBelakang);

  // Submit Tutup Toko ke Backend
  const handleSubmitTutupToko = async () => {
    setErrorMsg(null);

    if (!arePhotosComplete) {
      setErrorMsg('Wajib mengambil ketiga foto kondisi outlet (Luar, Dalam, dan Belakang)!');
      return;
    }

    if (!activeBukaTokoId || !activeKode) {
      setErrorMsg('Sesi Buka Toko tidak valid.');
      return;
    }

    // Filter baris kebutuhan yang diisi
    const cleanedKebutuhan = kebutuhanRows
      .filter((r) => r.barang_kebutuhan_id && Number(r.qty) > 0)
      .map((r) => ({
        barang_kebutuhan_id: Number(r.barang_kebutuhan_id),
        qty: Number(r.qty),
      }));

    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      const token = Cookies.get('pos_access_token');
      const payload = {
        id_buka_toko: activeBukaTokoId,
        cabang_id: cabang?.id || infoToko?.cabang_id,
        kode_buka_toko: activeKode,
        ket_kebutuhan: ketKebutuhan.trim(),
        kebutuhan: cleanedKebutuhan,
        foto_luar: fotoLuar,
        foto_dalam: fotoDalam,
        foto_belakang: fotoBelakang,
      };

      const res = await api.post('/tutup-toko', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data?.success) {
        setShowSuccessModal(true);
      } else {
        throw new Error(res.data?.message || 'Gagal menutup toko.');
      }
    } catch (err: any) {
      console.error('Gagal tutup toko:', err);
      setErrorMsg(
        err.response?.data?.message || err.message || 'Terjadi kesalahan saat menutup toko.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Cetak Laporan EOD via Bluetooth
  const handlePrintEodBluetooth = async () => {
    setIsPrinting(true);
    setPrintError(null);
    setPrintSuccess(false);

    try {
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
      const eodData: LaporanEodDataForPrint = {
        cabang_nama: cabang?.nama || infoToko?.cabang_nama || 'Cabang Kebab Yasmin',
        kode_sesi: activeKode || infoToko?.kode || 'EOD',
        waktu_buka: infoToko?.buka ? new Date(infoToko.buka).toLocaleTimeString('id-ID') : '-',
        waktu_tutup: nowStr,
        kasir_nama: infoToko?.nm_karyawan || user?.name || 'Kasir',
        laporan_penjualan: laporanPenjualan.map((lp) => ({
          delivery_nama: lp.delivery_nama,
          pembayaran_nama: lp.pembayaran_nama,
          total_transaksi: lp.total_transaksi,
          total_penjualan: lp.total_penjualan,
        })),
        detail_produk_terjual: detailProduk.map((dp) => ({
          nm_produk: dp.nm_produk,
          delivery_nama: dp.delivery_nama,
          qty_terjual: dp.qty_terjual,
          total_uang: dp.total_uang,
        })),
        laporan_pengeluaran: {
          total_pengeluaran: laporanPengeluaran.total_pengeluaran,
          items: laporanPengeluaran.items.map((it) => ({
            nm_barang: it.nm_barang,
            qty: it.qty,
            total_harga: it.total_harga,
          })),
        },
        laporan_kas_bersih: {
          total_penjualan_cash: laporanKasBersih.total_penjualan_cash,
          total_pengeluaran_kebutuhan: laporanKasBersih.total_pengeluaran_kebutuhan,
          kas_bersih: laporanKasBersih.kas_bersih,
        },
        laporan_barang_bawaan: laporanStok.map((st) => ({
          nm_bahan: st.nm_bahan,
          satuan: st.satuan,
          masuk: st.masuk,
          keluar: st.keluar,
          refund: st.refund,
          sisa_fisik: st.sisa_fisik,
        })),
        ket_kebutuhan: ketKebutuhan.trim() || undefined,
      };

      await printLaporanEodBluetooth(eodData);
      setPrintSuccess(true);
    } catch (err: any) {
      console.error('Gagal cetak Bluetooth:', err);
      setPrintError(err.message || 'Gagal menyambungkan ke printer thermal Bluetooth.');
    } finally {
      setIsPrinting(false);
    }
  };

  // Navigasi ke Buka Toko setelah selesai
  const handleFinishClosing = () => {
    setShowSuccessModal(false);
    router.replace('/buka-toko');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 1. HEADER UTAMA TUTUP TOKO                                                */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/kasir')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-600 transition-all cursor-pointer"
              title="Kembali ke Kasir"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Tutup Toko & Laporan EOD
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    Shift Akhir
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {cabang?.nama || infoToko?.cabang_nama || 'Cabang Kebab Yasmin'} &bull; Sesi:{' '}
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                    {activeKode || '-'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="h-9 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY KONTEN LAPORAN & FORM PENUTUPAN                                     */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner Alert Error Jika Ada */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-3 shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm font-semibold">{errorMsg}</div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-rose-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Memuat dan merekap seluruh transaksi toko...</p>
          </div>
        ) : !isStoreOpen ? (
          <div className="py-16 text-center max-w-md mx-auto p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 mb-4">
              <Store className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Toko Sedang Dalam Status Tutup
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Tidak ada sesi toko aktif yang perlu ditutup. Buka toko terlebih dahulu untuk memulai operasional transaksi.
            </p>
            <button
              type="button"
              onClick={() => router.push('/buka-toko')}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              Buka Toko Sekarang
            </button>
          </div>
        ) : (
          <>
            {/* ================================================================= */}
            {/* CARD 1: RINGKASAN METRIK KAS BERSIH (HIGHLIGHT EOD)                */}
            {/* ================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Kas Bersih Highlight */}
              <div className="sm:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                      Total Kas Bersih Shift (Tunai)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white">
                      EOD Cash Net
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight mt-2">
                    Rp {laporanKasBersih.kas_bersih.toLocaleString('id-ID')}
                  </div>
                  <p className="text-[11px] text-emerald-100/90 mt-2 font-medium flex items-center gap-1.5">
                    <span>(Total Penjualan Cash: Rp {laporanKasBersih.total_penjualan_cash.toLocaleString('id-ID')})</span>
                    <span>&minus;</span>
                    <span>(Pengeluaran: Rp {laporanKasBersih.total_pengeluaran_kebutuhan.toLocaleString('id-ID')})</span>
                  </p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-15 pointer-events-none">
                  <DollarSign className="w-36 h-36" />
                </div>
              </div>

              {/* Total Penjualan Cash */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Penjualan Cash</span>
                    <Receipt className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    Rp {laporanKasBersih.total_penjualan_cash.toLocaleString('id-ID')}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3">
                  Dari metode bayar Tunai / Cash (ID: 1)
                </p>
              </div>

              {/* Total Pengeluaran Kebutuhan */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Pengeluaran Kebutuhan</span>
                    <ShoppingBag className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    Rp {laporanKasBersih.total_pengeluaran_kebutuhan.toLocaleString('id-ID')}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3">
                  {laporanPengeluaran.items.length} transaksi barang kebutuhan
                </p>
              </div>
            </div>

            {/* ================================================================= */}
            {/* CARD 2 & 3: LAPORAN PENJUALAN & DETAIL PRODUK TERJUAL              */}
            {/* ================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Laporan Penjualan (Group by Delivery & Pembayaran) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      1. Laporan Penjualan (Order & Metode Bayar)
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {laporanPenjualan.length} Grup
                  </span>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-2 px-1">Channel</th>
                        <th className="py-2 px-1">Pembayaran</th>
                        <th className="py-2 px-1 text-center">Trx</th>
                        <th className="py-2 px-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {laporanPenjualan.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                            Belum ada transaksi penjualan pada sesi ini.
                          </td>
                        </tr>
                      ) : (
                        laporanPenjualan.map((lp, idx) => (
                          <tr key={`lp-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-1 font-semibold text-slate-800 dark:text-slate-200">
                              {lp.delivery_nama}
                            </td>
                            <td className="py-2 px-1 text-slate-600 dark:text-slate-300">
                              {lp.pembayaran_nama}
                            </td>
                            <td className="py-2 px-1 text-center font-mono">
                              {lp.total_transaksi}
                            </td>
                            <td className="py-2 px-1 text-right font-mono font-bold text-slate-900 dark:text-white">
                              Rp {lp.total_penjualan.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {laporanPenjualan.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                          <td colSpan={2} className="py-2.5 px-1 uppercase tracking-wider">
                            Total Penjualan
                          </td>
                          <td className="py-2.5 px-1 text-center font-mono">
                            {laporanPenjualan.reduce((a, b) => a + b.total_transaksi, 0)}
                          </td>
                          <td className="py-2.5 px-1 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            Rp{' '}
                            {laporanPenjualan
                              .reduce((a, b) => a + b.total_penjualan, 0)
                              .toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Detail Produk Terjual */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      2. Detail Produk Terjual
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {detailProduk.length} Item
                  </span>
                </div>

                <div className="flex-1 overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900">
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-2 px-1">Produk</th>
                        <th className="py-2 px-1">Order</th>
                        <th className="py-2 px-1 text-center">Qty</th>
                        <th className="py-2 px-1 text-right">Total Uang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {detailProduk.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                            Belum ada produk yang terjual.
                          </td>
                        </tr>
                      ) : (
                        detailProduk.map((dp, idx) => (
                          <tr key={`dp-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-1 font-semibold text-slate-800 dark:text-slate-200">
                              {dp.nm_produk}
                            </td>
                            <td className="py-2 px-1 text-slate-500">
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px]">
                                {dp.delivery_nama}
                              </span>
                            </td>
                            <td className="py-2 px-1 text-center font-mono font-bold">
                              {dp.qty_terjual}
                            </td>
                            <td className="py-2 px-1 text-right font-mono font-bold text-slate-900 dark:text-white">
                              Rp {dp.total_uang.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* CARD 4 & 5: LAPORAN PENGELUARAN & BARANG BAWAAN (STOK FISIK)       */}
            {/* ================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Laporan Pengeluaran Kebutuhan */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      3. Laporan Pengeluaran Kebutuhan
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-rose-500 font-mono">
                    Total: Rp {laporanPengeluaran.total_pengeluaran.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex-1 overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900">
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-2 px-1">Barang</th>
                        <th className="py-2 px-1 text-center">Qty</th>
                        <th className="py-2 px-1 text-right">Harga Satuan</th>
                        <th className="py-2 px-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {laporanPengeluaran.items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                            Tidak ada catatan pengeluaran kebutuhan pada sesi ini.
                          </td>
                        </tr>
                      ) : (
                        laporanPengeluaran.items.map((it) => (
                          <tr key={`pk-${it.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-1 font-semibold text-slate-800 dark:text-slate-200">
                              {it.nm_barang}
                            </td>
                            <td className="py-2 px-1 text-center font-mono font-bold">
                              {it.qty}
                            </td>
                            <td className="py-2 px-1 text-right font-mono text-slate-500">
                              Rp {it.harga_satuan.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-1 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                              Rp {it.total_harga.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Laporan Barang Bawaan (Stok Fisik: Masuk - Keluar - Refund) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      4. Laporan Barang Bawaan (Stok Fisik)
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Masuk &minus; Keluar &minus; Refund
                  </span>
                </div>

                <div className="flex-1 overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900">
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-2 px-1">Bahan Baku</th>
                        <th className="py-2 px-1 text-center">Masuk</th>
                        <th className="py-2 px-1 text-center">Keluar</th>
                        <th className="py-2 px-1 text-center">Refund</th>
                        <th className="py-2 px-1 text-right">Sisa Fisik</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {laporanStok.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                            Belum ada data stok tercatat.
                          </td>
                        </tr>
                      ) : (
                        laporanStok.map((st) => (
                          <tr key={`st-${st.bahan_id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-1 font-semibold text-slate-800 dark:text-slate-200">
                              {st.nm_bahan} <span className="text-[10px] text-slate-400">({st.satuan})</span>
                            </td>
                            <td className="py-2 px-1 text-center font-mono text-emerald-600 dark:text-emerald-400">
                              {st.masuk}
                            </td>
                            <td className="py-2 px-1 text-center font-mono text-rose-600 dark:text-rose-400">
                              {st.keluar}
                            </td>
                            <td className="py-2 px-1 text-center font-mono text-amber-600 dark:text-amber-400">
                              {st.refund}
                            </td>
                            <td className="py-2 px-1 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {st.sisa_fisik} {st.satuan}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* SECTION 3: FORM INPUT TUTUP TOKO (KEBUTUHAN, KET, 3 FOTO)          */}
            {/* ================================================================= */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>Formulir Penutupan Shift & Dokumentasi Outlet</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Lengkapi pencatatan barang kebutuhan akhir shift, catatan operasional, dan ambil 3 foto kondisi outlet (Luar, Dalam, Belakang).
                </p>
              </div>

              {/* A. Form Dinamis Barang Kebutuhan Akhir Shift */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Daftar Barang Kebutuhan Akhir Shift (Opsional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddKebutuhanRow}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {kebutuhanRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <div className="flex-1">
                        <SearchableBarangSelect
                          value={row.barang_kebutuhan_id}
                          onChange={(val) =>
                            handleKebutuhanChange(row.id, 'barang_kebutuhan_id', val)
                          }
                          barangList={masterBarangList}
                          placeholder="-- Cari / Pilih Barang Kebutuhan --"
                        />
                      </div>
                      <div className="w-28 sm:w-36">
                        <input
                          type="number"
                          min="1"
                          placeholder="Jumlah (Qty)"
                          value={row.qty}
                          onChange={(e) => handleKebutuhanChange(row.id, 'qty', e.target.value)}
                          className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 font-mono text-center font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveKebutuhanRow(row.id)}
                        className="w-10 h-10 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center cursor-pointer transition-all"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* B. Input Keterangan Kebutuhan Shift */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Keterangan Kebutuhan / Catatan Tutup Toko</span>
                </label>
                <textarea
                  rows={3}
                  value={ketKebutuhan}
                  onChange={(e) => setKetKebutuhan(e.target.value)}
                  placeholder="Tuliskan catatan kondisi toko, kendala, atau barang yang perlu di-restock besok..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 font-medium resize-none shadow-2xs"
                />
              </div>

              {/* C. 3 Input Foto Outlet (Luar, Dalam, Belakang) - WAJIB LANGSUNG KAMERA */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-rose-500" />
                      <span>Foto Bukti Fisik Outlet (Langsung Foto)</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Ambil foto langsung kondisi outlet bagian Luar, Dalam, dan Belakang sebelum meninggalkan gerai.
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      arePhotosComplete
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {arePhotosComplete ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>3/3 Lengkap</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        <span>
                          {[fotoLuar, fotoDalam, fotoBelakang].filter(Boolean).length}/3 Foto
                        </span>
                      </>
                    )}
                  </span>
                </div>

                {/* Hidden Direct Camera Inputs (Fallback native hardware camera capture) */}
                <input
                  type="file"
                  ref={fileLuarRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'luar')}
                />
                <input
                  type="file"
                  ref={fileDalamRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'dalam')}
                />
                <input
                  type="file"
                  ref={fileBelakangRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'belakang')}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Foto 1: Luar Tutup */}
                  <div
                    onClick={() => {
                      if (!fotoLuar) openLiveCamera('luar');
                    }}
                    className={`relative rounded-2xl p-4 border-2 flex flex-col items-center justify-center text-center transition-all ${
                      fotoLuar
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:scale-[1.01]'
                    }`}
                  >
                    {fotoLuar ? (
                      <div className="w-full space-y-2.5">
                        <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-xs border border-emerald-300 dark:border-emerald-800">
                          <img
                            src={fotoLuar}
                            alt="Outlet Luar"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1 shadow-md">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            Outlet Luar
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLiveCamera('luar');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 text-[11px] font-bold cursor-pointer flex items-center gap-1 border border-amber-200 dark:border-amber-800/50"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Ambil Ulang</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-2xs">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            1. Foto Outlet Luar
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Kondisi tampak depan gerai
                          </div>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLiveCamera('luar');
                            }}
                            className="w-full px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-transform hover:scale-105"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Ambil Foto</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Foto 2: Dalam Tutup */}
                  <div
                    onClick={() => {
                      if (!fotoDalam) openLiveCamera('dalam');
                    }}
                    className={`relative rounded-2xl p-4 border-2 flex flex-col items-center justify-center text-center transition-all ${
                      fotoDalam
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:scale-[1.01]'
                    }`}
                  >
                    {fotoDalam ? (
                      <div className="w-full space-y-2.5">
                        <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-xs border border-emerald-300 dark:border-emerald-800">
                          <img
                            src={fotoDalam}
                            alt="Outlet Dalam"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1 shadow-md">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            Outlet Dalam
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLiveCamera('dalam');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 text-[11px] font-bold cursor-pointer flex items-center gap-1 border border-amber-200 dark:border-amber-800/50"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Ambil Ulang</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-2xs">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            2. Foto Outlet Dalam
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Area meja masak & kasir
                          </div>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLiveCamera('dalam');
                            }}
                            className="w-full px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-transform hover:scale-105"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Ambil Foto</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Foto 3: Belakang Tutup */}
                  <div
                    onClick={() => {
                      if (!fotoBelakang) openLiveCamera('belakang');
                    }}
                    className={`relative rounded-2xl p-4 border-2 flex flex-col items-center justify-center text-center transition-all ${
                      fotoBelakang
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:scale-[1.01]'
                    }`}
                  >
                    {fotoBelakang ? (
                      <div className="w-full space-y-2.5">
                        <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-xs border border-emerald-300 dark:border-emerald-800">
                          <img
                            src={fotoBelakang}
                            alt="Outlet Belakang"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1 shadow-md">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            Outlet Belakang
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLiveCamera('belakang');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 text-[11px] font-bold cursor-pointer flex items-center gap-1 border border-amber-200 dark:border-amber-800/50"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Ambil Ulang</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-2xs">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            3. Foto Outlet Belakang
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Area penyimpanan & kebersihan
                          </div>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLiveCamera('belakang');
                            }}
                            className="w-full px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-transform hover:scale-105"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Ambil Foto</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* D. Tombol Aksi Simpan & Tutup Toko */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Pastikan seluruh kas fisik telah dihitung dan cocok dengan Kas Bersih sebelum menutup shift.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!arePhotosComplete || submitting}
                  onClick={() => setShowConfirmModal(true)}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    arePhotosComplete && !submitting
                      ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-700 hover:to-amber-700 text-white hover:scale-[1.02] shadow-rose-500/25'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan & Menutup Toko...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>SIMPAN & TUTUP TOKO</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: KAMERA LIVE VIEWFINDER                                           */}
      {/* ========================================================================= */}
      {activeCameraTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Foto Outlet {activeCameraTarget}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {capturedSnapshot ? (
                <img
                  src={capturedSnapshot}
                  alt="Snapshot"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-3">
              {capturedSnapshot ? (
                <>
                  <button
                    type="button"
                    onClick={() => openLiveCamera(activeCameraTarget)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
                  >
                    Ambil Ulang
                  </button>
                  <button
                    type="button"
                    onClick={confirmSnapshot}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Gunakan Foto Ini</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={takeSnapshot}
                  className="w-14 h-14 rounded-full bg-white border-4 border-amber-500 shadow-lg flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                  title="Jepret Foto"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DIALOG KONFIRMASI TUTUP TOKO                                      */}
      {/* ========================================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Konfirmasi Penutupan Toko?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setelah toko ditutup, sesi ini akan diakhiri dan seluruh kasir pada shift berikutnya harus melakukan pembukaan toko baru.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Kas Bersih:</span>
                <span className="font-bold text-emerald-600 font-mono">
                  Rp {laporanKasBersih.kas_bersih.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kebutuhan Dicatat:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {kebutuhanRows.filter((r) => r.barang_kebutuhan_id && Number(r.qty) > 0).length} Item
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Foto Fisik:</span>
                <span className="font-bold text-emerald-600">3/3 Lengkap</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitTutupToko}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all"
              >
                Ya, Tutup Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BERHASIL MENUTUP TOKO & PRINT BLUETOOTH EOD                       */}
      {/* ========================================================================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in zoom-in-95">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-emerald-500/30 shadow-2xl space-y-5 text-center">
            {/* Animasi Ikon Sukses */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Toko Berhasil Ditutup!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sesi penjualan telah diakhiri dan seluruh data pembukuan EOD serta foto fisik telah tersimpan dengan aman.
              </p>
            </div>

            {/* Ringkasan Singkat Struk EOD */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-2">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500">Kode Sesi:</span>
                <span className="font-mono font-bold text-amber-600">{activeKode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kas Bersih Fisik:</span>
                <span className="font-mono font-black text-emerald-600 text-sm">
                  Rp {laporanKasBersih.kas_bersih.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pengeluaran:</span>
                <span className="font-mono font-bold text-rose-500">
                  Rp {laporanKasBersih.total_pengeluaran_kebutuhan.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Notifikasi Status Print */}
            {printSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Laporan EOD berhasil dicetak ke Printer Bluetooth!</span>
              </div>
            )}

            {printError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{printError}</span>
              </div>
            )}

            {/* Tombol Cetak Laporan Bluetooth */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={isPrinting}
                onClick={handlePrintEodBluetooth}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
              >
                {isPrinting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mencari & Menghubungkan Printer...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Cetak Laporan EOD (Bluetooth)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleFinishClosing}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Selesai & Ke Halaman Buka Toko
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
