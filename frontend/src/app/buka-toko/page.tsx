'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';
import {
  Store,
  Users,
  PackagePlus,
  Camera,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  X,
  Building2,
  Sparkles,
  Check,
  UserPlus,
  RefreshCw,
  ArrowRight,
  Search,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { useTheme } from '@/lib/theme';

// Helper Utility: Konversi File Gambar ke Base64 String
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

interface Karyawan {
  id: number;
  nama: string;
  kota_id?: number;
}

interface JagaShiftItem {
  karyawan_id: number;
  nama: string;
  role: 3; // Seluruh petugas shift otomatis Role 3 (Anggota / MS)
  foto: string; // Base64
}

interface BahanItem {
  id: number;
  bahan: string;
  harga?: number;
  harga_beli?: number;
  possition?: number;
}

interface BarangBawaanRow {
  id: string;
  bahan_id: number | '';
  qty: number | '';
}


/**
 * Komponen Searchable Dropdown / Select untuk Bahan Baku
 * Memudahkan kasir mencari bahan dari ratusan data (diurutkan berdasarkan possition ASC)
 */
function SearchableBahanSelect({
  value,
  onChange,
  bahanList,
  placeholder = '-- Pilih Bahan Baku --',
}: {
  value: number | '';
  onChange: (id: number | '') => void;
  bahanList: BahanItem[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = bahanList.find((b) => b.id === value);

  // Filter bahan berdasarkan input pencarian
  const filteredList = bahanList.filter((b) =>
    b.bahan.toLowerCase().includes(searchTerm.toLowerCase())
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
        className="w-full h-11 px-3.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-slate-800 flex items-center justify-between cursor-pointer transition-all hover:border-slate-300 text-left shadow-2xs"
      >
        <span
          className={
            selectedItem
              ? 'text-slate-800 font-bold truncate'
              : 'text-slate-400 font-normal truncate'
          }
        >
          {selectedItem
            ? `${selectedItem.bahan}`
            : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 animate-in fade-in zoom-in-95 duration-100 min-w-[280px]">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik nama bahan..."
              className="w-full h-9 pl-9 pr-8 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredList.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 font-medium">
                Bahan &ldquo;{searchTerm}&rdquo; tidak ditemukan
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelected = item.id === value;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onChange(item.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors flex items-center justify-between ${isSelected
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'hover:bg-amber-50 hover:text-amber-900 text-slate-700'
                      }`}
                  >
                    <span className="truncate">{item.bahan}</span>

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

export default function BukaTokoPage() {
  const router = useRouter();
  const { user, cabang, logout, initAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  // Status Pengecekan Toko & Loading Form Data
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  // Kode Transaksi Buka Toko & Stok ('ST' + dmy + random(5) + cabang_id)
  const [kodeBukaToko, setKodeBukaToko] = useState<string>('');

  // Data Master Dropdown dari Database
  const [bahanList, setBahanList] = useState<BahanItem[]>([]);
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);

  // 1. STATE BARANG BAWAAN (STOK AWAL)
  const [barangRows, setBarangRows] = useState<BarangBawaanRow[]>([
    { id: 'row-1', bahan_id: '', qty: '' },
  ]);
  const [stokTersimpan, setStokTersimpan] = useState(false);
  const [savingStok, setSavingStok] = useState(false);

  // 2. STATE FOTO OUTLET (3 FOTO: LUAR, DALAM, BELAKANG)
  const [fotoLuar, setFotoLuar] = useState<string>('');
  const [fotoDalam, setFotoDalam] = useState<string>('');
  const [fotoBelakang, setFotoBelakang] = useState<string>('');

  // 3. STATE KARYAWAN JAGA & SELFIE (ROLE: 3 / MS)
  const [jagaList, setJagaList] = useState<JagaShiftItem[]>([]);

  // Modal State: Pilih Karyawan
  const [isModalPilihKaryawanOpen, setIsModalPilihKaryawanOpen] = useState(false);
  const [searchKaryawanQuery, setSearchKaryawanQuery] = useState('');

  // Modal State: Kamera Live Viewfinder
  // Bisa digunakan untuk: 'outlet_luar' | 'outlet_dalam' | 'outlet_belakang' | 'selfie_karyawan'
  const [activeCameraTarget, setActiveCameraTarget] = useState<
    'outlet_luar' | 'outlet_dalam' | 'outlet_belakang' | 'selfie_karyawan' | null
  >(null);
  const [karyawanTerpilih, setKaryawanTerpilih] = useState<Karyawan | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string>('');

  // Video & Stream Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Native Hardware Camera Fallback (Hidden inputs with capture)
  const fileLuarRef = useRef<HTMLInputElement>(null);
  const fileDalamRef = useRef<HTMLInputElement>(null);
  const fileBelakangRef = useRef<HTMLInputElement>(null);
  const fileSelfieRef = useRef<HTMLInputElement>(null);

  // Submit, Loading & Alert State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processLoading, setProcessLoading] = useState<{
    active: boolean;
    title: string;
    subtitle: string;
    step?: string;
  } | null>(null);

  // CEK STATUS TOKO SAAT PERTAMA KALI HALAMAN DIMUAT
  useEffect(() => {
    initAuth();

    const checkStoreStatus = async () => {
      try {
        const token = Cookies.get('pos_access_token');
        const res = await api.get('/status-toko', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // Jika toko terdeteksi BUKA, langsung redirect ke /kasir
        if (res.data?.success && res.data.data?.is_open) {
          router.replace('/kasir');
          return;
        }
      } catch (err: any) {
        console.error('Error cek status toko:', err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStoreStatus();
  }, [router, initAuth]);

  // Fetch Data Form: Bahan (where aktif = 'Y' order by possition ASC) & Karyawan (where kota_id = cabang.kota_id and aktif = 1)
  useEffect(() => {
    const loadFormData = async () => {
      setLoadingData(true);
      const token = Cookies.get('pos_access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const res = await api.get('/buka-toko/form-data', { headers });
        if (res.data?.success && res.data.data) {
          const {
            bahan = [],
            karyawan = [],
            kode,
            stok_saved = [],
            stok_tersimpan = false,
          } = res.data.data;

          setBahanList(bahan);
          setKaryawanList(karyawan);

          // Gunakan kode transaksi dari server (jika ada stok 'buka' aktif, server akan memakai kode tersebut)
          if (kode) {
            setKodeBukaToko(kode);
          } else {
            generateLocalKode();
          }

          // Jika sebelumnya kasir sudah menyimpan stok masuk untuk sesi ini, tampilkan kembali baris-barisnya
          if (Array.isArray(stok_saved) && stok_saved.length > 0) {
            const restoredRows: BarangBawaanRow[] = stok_saved.map((item: any, idx: number) => ({
              id: `row-saved-${item.bahan_id}-${idx}-${Date.now()}`,
              bahan_id: Number(item.bahan_id),
              qty: Number(item.qty) || '',
            }));
            setBarangRows(restoredRows);
            setStokTersimpan(true);
          } else if (stok_tersimpan) {
            setStokTersimpan(true);
          }
          return;
        }
      } catch (e: any) {
        console.error('Gagal mengambil data form buka toko dari API:', e);
        setErrorMsg('Gagal memuat daftar bahan dan karyawan dari database server.');
        generateLocalKode();
      } finally {
        setLoadingData(false);
      }
    };

    const generateLocalKode = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dmy = `${day}${month}${year}`;
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      const cId = cabang?.id || 1;
      setKodeBukaToko(`ST${dmy}${randomStr}${cId}`);
    };

    if (!checkingStatus) {
      loadFormData();
    }
  }, [checkingStatus, cabang?.id]);

  // Handler: Tambah & Hapus Baris Form Barang Bawaan
  const handleAddBarangRow = () => {
    setBarangRows((prev) => [
      ...prev,
      { id: `row-${Date.now()}`, bahan_id: '', qty: '' },
    ]);
  };

  const handleRemoveBarangRow = (id: string) => {
    if (barangRows.length <= 1) {
      setErrorMsg('Minimal harus ada 1 baris barang bawaan.');
      return;
    }
    setBarangRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleBarangChange = (id: string, field: 'bahan_id' | 'qty', value: any) => {
    setBarangRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
    setStokTersimpan(false);
  };

  // Handler: Simpan Stok Barang Bawaan ke Tabel Stok (POST /api/buka-toko/stok)
  const handleSimpanStok = async () => {
    setErrorMsg(null);
    const validRows = barangRows.filter(
      (r) => r.bahan_id !== '' && Number(r.qty) > 0
    );

    if (validRows.length === 0) {
      setErrorMsg('Pilih bahan dan masukkan jumlah bawa (qty) minimal 1 barang bawaan!');
      return;
    }

    setSavingStok(true);
    setProcessLoading({
      active: true,
      title: 'Menyimpan Stok Barang Bawaan...',
      subtitle: 'Memvalidasi data dan menyinkronkan stok awal ke server database...',
      step: 'Sinkronisasi Stok Masuk',
    });

    try {
      const token = Cookies.get('pos_access_token');
      const payload = {
        bahan_id: validRows.map((r) => Number(r.bahan_id)),
        debit: validRows.map((r) => Number(r.qty)),
        kode: kodeBukaToko,
      };

      const res = await api.post('/buka-toko/stok', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data?.success) {
        if (res.data.data?.kode) setKodeBukaToko(res.data.data.kode);
        setStokTersimpan(true);
        setSuccessMsg('Stok barang bawaan berhasil disimpan ke sistem!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.data?.message || 'Gagal menyimpan stok.');
      }
    } catch (err: any) {
      console.error('Error addStok:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menyimpan stok barang bawaan.');
    } finally {
      setSavingStok(false);
      setProcessLoading(null);
    }
  };

  // KAMERA LANGSUNG (LIVE VIEW FINDER):
  // Membuka kamera belakang untuk outlet atau kamera depan untuk selfie
  const openCameraModal = async (
    target: 'outlet_luar' | 'outlet_dalam' | 'outlet_belakang' | 'selfie_karyawan',
    karyawan?: Karyawan
  ) => {
    setActiveCameraTarget(target);
    if (karyawan) setKaryawanTerpilih(karyawan);
    setCapturedSnapshot('');

    const isSelfie = target === 'selfie_karyawan';
    const facingMode = isSelfie ? 'user' : { ideal: 'environment' };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode as any,
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
      console.warn('getUserMedia tidak dapat diakses langsung, memicu kamera native HP:', err);
      closeCameraModal();
      if (target === 'outlet_luar') fileLuarRef.current?.click();
      if (target === 'outlet_dalam') fileDalamRef.current?.click();
      if (target === 'outlet_belakang') fileBelakangRef.current?.click();
      if (target === 'selfie_karyawan') fileSelfieRef.current?.click();
    }
  };

  const closeCameraModal = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setActiveCameraTarget(null);
    setCapturedSnapshot('');
  };

  // Jepret Frame dari Kamera Live
  const captureLivePhoto = () => {
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

  // Konfirmasi Penggunaan Foto yang Baru Dijepret
  const confirmCapturedPhoto = () => {
    if (!capturedSnapshot) return;

    if (activeCameraTarget === 'outlet_luar') setFotoLuar(capturedSnapshot);
    if (activeCameraTarget === 'outlet_dalam') setFotoDalam(capturedSnapshot);
    if (activeCameraTarget === 'outlet_belakang') setFotoBelakang(capturedSnapshot);

    if (activeCameraTarget === 'selfie_karyawan' && karyawanTerpilih) {
      const updatedList = jagaList.filter((j) => j.karyawan_id !== karyawanTerpilih.id);
      updatedList.push({
        karyawan_id: karyawanTerpilih.id,
        nama: karyawanTerpilih.nama,
        role: 3, // Otomatis Role 3 (Anggota / MS)
        foto: capturedSnapshot,
      });
      setJagaList(updatedList);
      setKaryawanTerpilih(null);
    }

    closeCameraModal();
  };

  // Handler Fallback Kamera Native HP
  const handleNativeCameraPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'luar' | 'dalam' | 'belakang' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      if (target === 'luar') setFotoLuar(base64);
      if (target === 'dalam') setFotoDalam(base64);
      if (target === 'belakang') setFotoBelakang(base64);
      if (target === 'selfie' && karyawanTerpilih) {
        const updatedList = jagaList.filter((j) => j.karyawan_id !== karyawanTerpilih.id);
        updatedList.push({
          karyawan_id: karyawanTerpilih.id,
          nama: karyawanTerpilih.nama,
          role: 3,
          foto: base64,
        });
        setJagaList(updatedList);
        setKaryawanTerpilih(null);
      }
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg('Gagal memproses gambar dari kamera.');
    }
  };

  const handleHapusKaryawanJaga = (karyawanId: number) => {
    setJagaList((prev) => prev.filter((j) => j.karyawan_id !== karyawanId));
  };

  // VALIDASI KELENGKAPAN SEBELUM BUKA TOKO
  const isStokValid =
    stokTersimpan ||
    barangRows.some((r) => r.bahan_id !== '' && Number(r.qty) > 0);

  const isKaryawanValid = jagaList.length > 0;
  const isFotoOutletValid = Boolean(fotoLuar && fotoDalam && fotoBelakang);

  // Tombol Buka Toko hanya aktif jika SEMUA syarat terpenuhi
  const isFormSiapBuka = isStokValid && isKaryawanValid && isFotoOutletValid;

  // SUBMIT DATA BUKA TOKO KE API (POST /api/buka-toko)
  const handleSubmitBukaToko = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isFormSiapBuka) {
      setErrorMsg('Semua inputan wajib diisi lengkap sebelum membuka toko!');
      return;
    }

    setIsSubmitting(true);
    setProcessLoading({
      active: true,
      title: 'Mempersiapkan Berkas Buka Toko...',
      subtitle: 'Memeriksa kelengkapan foto outlet, selfie petugas jaga shift, dan stok awal...',
      step: 'Tahap 1 / 3: Verifikasi Berkas',
    });

    try {
      const token = Cookies.get('pos_access_token');
      const validRows = barangRows.filter((r) => r.bahan_id !== '' && Number(r.qty) > 0);

      const payload = {
        kode: kodeBukaToko,
        foto_luar: fotoLuar,
        foto_dalam: fotoDalam,
        foto_belakang: fotoBelakang,
        ms: jagaList.map((m) => m.karyawan_id),
        img_kry: jagaList.map((m) => m.foto),
        karyawan_jaga: jagaList.map((j) => ({
          karyawan_id: j.karyawan_id,
          role: 3,
          foto: j.foto,
        })),
        barang_bawaan: validRows.map((r) => ({
          bahan_id: Number(r.bahan_id),
          qty: Number(r.qty),
        })),
      };

      setProcessLoading({
        active: true,
        title: 'Menyimpan Data Buka Toko...',
        subtitle: 'Mengunggah foto dan mendaftarkan sesi buka toko ke server database...',
        step: 'Tahap 2 / 3: Sinkronisasi Server',
      });

      const res = await api.post('/buka-toko', payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.data?.success) {
        setProcessLoading({
          active: true,
          title: 'Buka Toko Berhasil!',
          subtitle: 'Mengarahkan Anda ke Halaman Kasir POS...',
          step: 'Tahap 3 / 3: Selesai',
        });
        setSuccessMsg('Berhasil Membuka Toko! Mengalihkan ke Halaman Kasir POS...');
        setTimeout(() => {
          router.replace('/kasir');
        }, 1200);
      } else {
        setProcessLoading(null);
        setErrorMsg(res.data?.message || 'Gagal memproses Buka Toko.');
      }
    } catch (err: any) {
      setProcessLoading(null);
      console.error('Submit Buka Toko error:', err);
      const message =
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memproses pembukaan toko.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Loading Screen saat Pengecekan Status Toko
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center max-w-sm w-full text-center">
          <div className="relative w-36 h-14 mb-4">
            <Image
              src={theme === 'dark' ? '/logo-yasmin-dark.png' : '/logo-yasmin.png'}
              alt="Yasmin Kebab"
              fill
              className="object-contain"
              priority
            />
          </div>
          <Loader2 className="w-9 h-9 text-amber-500 animate-spin mb-3" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Memeriksa Status Operasional...</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Menghubungkan ke server cabang</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-24 transition-colors">
      {/* HIDDEN NATIVE CAMERA INPUTS (Khusus Kamera Hardware HP) */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileLuarRef}
        onChange={(e) => handleNativeCameraPhoto(e, 'luar')}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileDalamRef}
        onChange={(e) => handleNativeCameraPhoto(e, 'dalam')}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileBelakangRef}
        onChange={(e) => handleNativeCameraPhoto(e, 'belakang')}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        capture="user"
        ref={fileSelfieRef}
        onChange={(e) => handleNativeCameraPhoto(e, 'selfie')}
        className="hidden"
      />

      {/* HEADER UTAMA & TOMBOL LOGOUT */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 sm:px-8 py-3 transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-9">
              <Image
                src={theme === 'dark' ? '/logo-yasmin-dark.png' : '/logo-yasmin.png'}
                alt="Yasmin Kebab"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-black px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
                STATUS: TUTUP
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                Form Persiapan Operasional
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-end gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                {cabang?.nama || 'Cabang Kebab Yasmin'}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Kasir: {user?.name || user?.username || 'Petugas'}
              </span>
            </div>

            {/* Tombol Toggle Theme Light / Dark */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
              className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
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
              onClick={handleLogout}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-8">
        {/* BANNER STATUS TOKO TUTUP */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-amber-500/15 mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Toko Belum Dibuka Hari Ini</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Prosedur Buka Toko (Store Opening)</h1>
            <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Lengkapi stok barang bawaan awal, pilih petugas shift beserta foto selfie (kamera depan), dan foto 3 sudut outlet menggunakan kamera belakang sebelum membuka kasir.
            </p>
            {kodeBukaToko && (
              <div className="mt-4 inline-flex items-center gap-2 bg-black/20 border border-white/20 px-3 py-1.5 rounded-xl text-xs font-mono">
                <span className="text-amber-200">Kode Sesi:</span>
                <span className="font-bold tracking-wider">{kodeBukaToko}</span>
              </div>
            )}
          </div>
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-15 pointer-events-none">
            <Store className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* NOTIFIKASI ERROR / SUKSES */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3.5 rounded-2xl mb-6 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm font-semibold">{errorMsg}</div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-4 rounded-2xl mb-6 flex items-center gap-3 shadow-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="flex-1 text-sm font-bold">{successMsg}</div>
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
          </div>
        )}

        {/* CHECKLIST KELENGKAPAN (SYARAT WAJIB BUKA TOKO) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs mb-8">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
            Syarat Kelengkapan Buka Toko (Wajib Lengkap):
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${isStokValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isStokValid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-bold block">1. Barang Bawaan</span>
                <span className="text-[11px] opacity-80">
                  {isStokValid ? 'Sudah Diinput / Disimpan' : 'Belum diisi'}
                </span>
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${isFotoOutletValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isFotoOutletValid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-bold block">2. Foto Outlet (3 Foto)</span>
                <span className="text-[11px] opacity-80">
                  {[fotoLuar, fotoDalam, fotoBelakang].filter(Boolean).length}/3 Foto Lengkap
                </span>
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${isKaryawanValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isKaryawanValid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-bold block">3. Karyawan & Selfie</span>
                <span className="text-[11px] opacity-80">
                  {jagaList.length > 0 ? `${jagaList.length} Petugas Siap` : 'Belum ada petugas'}
                </span>
              </div>
            </div>


          </div>
        </div>

        <div className="space-y-8">
          {/* TAHAP 1: FORM INPUT BARANG BAWAAN (SEARCHABLE SELECT BAHAN BAKU) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800">
                    1. Input Barang Bawaan (Stok Awal)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cari bahan dari database dan masukkan jumlah bawa (qty).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddBarangRow}
                  className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Baris</span>
                </button>

                <button
                  type="button"
                  disabled={savingStok}
                  onClick={handleSimpanStok}
                  className={`h-10 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${stokTersimpan
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95'
                    }`}
                >
                  {savingStok ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{stokTersimpan ? '✓ Stok Disimpan' : 'Simpan Stok Masuk'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {barangRows.map((row, index) => (
                <div
                  key={row.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl transition-all hover:border-slate-300"
                >
                  <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 self-start sm:self-center">
                    {index + 1}
                  </div>

                  {/* Searchable Select untuk Bahan Baku */}
                  <SearchableBahanSelect
                    value={row.bahan_id}
                    onChange={(selectedId) => handleBarangChange(row.id, 'bahan_id', selectedId)}
                    bahanList={bahanList}
                    placeholder="-- Cari / Pilih Bahan Baku --"
                  />

                  {/* Input Qty (Jumlah Bawa) */}
                  <div className="w-full sm:w-44">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 sm:hidden">
                      Jumlah Bawa (Qty)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={row.qty}
                        onChange={(e) =>
                          handleBarangChange(
                            row.id,
                            'qty',
                            e.target.value ? Number(e.target.value) : ''
                          )
                        }
                        placeholder="Jumlah"
                        className="w-full h-11 px-4 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-slate-800"
                      />
                      <span className="absolute right-3 text-[11px] font-semibold text-slate-400 pointer-events-none">
                        Qty
                      </span>
                    </div>
                  </div>

                  {/* Tombol Hapus Baris */}
                  <button
                    type="button"
                    onClick={() => handleRemoveBarangRow(row.id)}
                    className="h-11 w-11 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-slate-400 flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0 self-end sm:self-center"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* TAHAP 2: FOTO OUTLET (KLIK LANGSUNG MEMBUKA KAMERA BELAKANG) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800">
                    2. Foto Outlet (Luar, Dalam, Belakang)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Klik kotak untuk langsung membuka kamera belakang HP. Foto langsung tampil di layar setelah dijepret.
                  </p>
                </div>
              </div>
              <div className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                {[fotoLuar, fotoDalam, fotoBelakang].filter(Boolean).length}/3 Foto
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Foto 1: Luar */}
              <div>
                <span className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Foto Tampak Luar (Plang/Etalase)
                </span>

                {fotoLuar ? (
                  <div className="relative group w-full h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs">
                    <img src={fotoLuar} alt="Luar Outlet" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openCameraModal('outlet_luar')}
                        className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Buka Kamera Ulang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFotoLuar('')}
                        className="p-1.5 bg-rose-500 text-white rounded-xl shadow-md cursor-pointer hover:bg-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 bg-emerald-500/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> Foto Selesai Dijepret
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => openCameraModal('outlet_luar')}
                    className="w-full h-56 rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/60 hover:bg-amber-50/30 flex flex-col items-center justify-center text-center p-4 transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 group-hover:bg-amber-200 text-amber-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Klik untuk Buka Kamera</span>
                    <span className="text-[11px] text-slate-400 mt-1">Kamera belakang HP</span>
                  </div>
                )}
              </div>

              {/* Foto 2: Dalam */}
              <div>
                <span className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Foto Tampak Dalam (Area Masak)
                </span>

                {fotoDalam ? (
                  <div className="relative group w-full h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs">
                    <img src={fotoDalam} alt="Dalam Outlet" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openCameraModal('outlet_dalam')}
                        className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Buka Kamera Ulang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFotoDalam('')}
                        className="p-1.5 bg-rose-500 text-white rounded-xl shadow-md cursor-pointer hover:bg-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 bg-emerald-500/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> Foto Selesai Dijepret
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => openCameraModal('outlet_dalam')}
                    className="w-full h-56 rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/60 hover:bg-amber-50/30 flex flex-col items-center justify-center text-center p-4 transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 group-hover:bg-amber-200 text-amber-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Klik untuk Buka Kamera</span>
                    <span className="text-[11px] text-slate-400 mt-1">Kamera belakang HP</span>
                  </div>
                )}
              </div>

              {/* Foto 3: Belakang */}
              <div>
                <span className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Foto Tampak Belakang Outlet
                </span>

                {fotoBelakang ? (
                  <div className="relative group w-full h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs">
                    <img
                      src={fotoBelakang}
                      alt="Belakang Outlet"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openCameraModal('outlet_belakang')}
                        className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Buka Kamera Ulang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFotoBelakang('')}
                        className="p-1.5 bg-rose-500 text-white rounded-xl shadow-md cursor-pointer hover:bg-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 bg-emerald-500/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> Foto Selesai Dijepret
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => openCameraModal('outlet_belakang')}
                    className="w-full h-56 rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/60 hover:bg-amber-50/30 flex flex-col items-center justify-center text-center p-4 transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 group-hover:bg-amber-200 text-amber-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Klik untuk Buka Kamera</span>
                    <span className="text-[11px] text-slate-400 mt-1">Kamera belakang HP</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TAHAP 3: PILIH KARYAWAN JAGA & SELFIE (ROLE: 3 / MS SEMUA) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800">
                    3. Karyawan Jaga & Foto Selfie
                  </h2>
                  <p className="text-xs text-slate-400">
                    Pilih nama karyawan cabang ini, lalu ambil foto selfie wajahnya dengan kamera depan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalPilihKaryawanOpen(true)}
                className="h-11 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Pilih Karyawan Jaga</span>
              </button>
            </div>

            {/* List Karyawan Yang Sudah Difoto Selfie */}
            {jagaList.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center flex flex-col items-center justify-center">
                <Users className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">Belum ada karyawan jaga yang dipilih</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik tombol &ldquo;+ Pilih Karyawan Jaga&rdquo; untuk memilih petugas dan mengambil foto selfie wajahnya.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jagaList.map((petugas) => (
                  <div
                    key={petugas.karyawan_id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center gap-3 relative shadow-xs"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                      <img
                        src={petugas.foto}
                        alt={petugas.nama}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{petugas.nama}</p>
                      <div className="mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                          Anggota Shift (MS)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleHapusKaryawanJaga(petugas.karyawan_id)}
                      className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                      title="Hapus Petugas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TAHAP 4: TOMBOL BUKA TOKO (HANYA AKTIF JIKA SEMUA TAHAP LENGKAP) */}
          <div className="pt-4 border-t border-slate-200">
            {isFormSiapBuka ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">
                      Semua Syarat Buka Toko Telah Lengkap!
                    </h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Stok bawaan awal, 3 foto outlet, dan petugas shift (MS) telah siap. Tekan tombol untuk membuka toko dan masuk ke kasir.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitBukaToko}
                  className={`w-full sm:w-auto min-w-[240px] h-14 px-8 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 transition-all cursor-pointer ${isSubmitting
                    ? 'bg-slate-400 cursor-not-allowed opacity-75'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 active:scale-95'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Membuka Toko...</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-5 h-5" />
                      <span>BUKA TOKO SEKARANG</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center text-xs font-semibold text-slate-500">
                Lengkapi seluruh tahapan di atas (Barang Bawaan, 3 Foto Outlet, dan Karyawan Jaga + Selfie) agar tombol Buka Toko dapat aktif.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* POPUP 1: MODAL DAFTAR NAMA KARYAWAN SESUAI KOTA CABANG (kota_id & aktif = 1) */}
      {/* ========================================================================= */}
      {isModalPilihKaryawanOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-800">Pilih Karyawan Cabang</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalPilihKaryawanOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Menampilkan karyawan aktif ({karyawanList.length} orang) untuk kota cabang{' '}
              <span className="font-bold text-slate-700">{cabang?.nama || 'ini'}</span>.
            </p>

            {/* Input Pencarian Karyawan */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchKaryawanQuery}
                onChange={(e) => setSearchKaryawanQuery(e.target.value)}
                placeholder="Cari nama karyawan..."
                className="w-full h-9 pl-9 pr-8 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800"
              />
              {searchKaryawanQuery && (
                <button
                  type="button"
                  onClick={() => setSearchKaryawanQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {loadingData ? (
                <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
                  <span className="text-xs font-medium">Memuat data karyawan aktif...</span>
                </div>
              ) : karyawanList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  Belum ada data karyawan aktif untuk cabang ini.
                </div>
              ) : (
                karyawanList
                  .filter((k) =>
                    k.nama.toLowerCase().includes(searchKaryawanQuery.toLowerCase())
                  )
                  .map((k) => {
                    const alreadySelected = jagaList.some((j) => j.karyawan_id === k.id);
                    return (
                      <div
                        key={k.id}
                        onClick={() => {
                          setIsModalPilihKaryawanOpen(false);
                          setSearchKaryawanQuery('');
                          openCameraModal('selfie_karyawan', k);
                        }}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${alreadySelected
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-slate-50 border-slate-200 hover:border-amber-400 hover:bg-amber-50/50'
                          }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{k.nama}</p>
                          <p className="text-[10px] text-slate-400">ID Karyawan: #{k.id}</p>
                        </div>

                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Ambil Selfie</span>
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 2: MODAL KAMERA LANGSUNG (OUTLET & SELFIE - MURNI KAMERA, NO UPLOAD)   */}
      {/* ========================================================================= */}
      {activeCameraTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-500" />
                  {activeCameraTarget === 'selfie_karyawan'
                    ? `Selfie Karyawan: ${karyawanTerpilih?.nama}`
                    : activeCameraTarget === 'outlet_luar'
                      ? 'Kamera Belakang: Foto Outlet Luar'
                      : activeCameraTarget === 'outlet_dalam'
                        ? 'Kamera Belakang: Foto Outlet Dalam'
                        : 'Kamera Belakang: Foto Outlet Belakang'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeCameraTarget === 'selfie_karyawan'
                    ? 'Kamera depan aktif untuk foto selfie wajah petugas shift (MS).'
                    : 'Kamera belakang aktif untuk memfoto kondisi fisik outlet.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCameraModal}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewfinder Kamera Live / Pratinjau Foto Langsung */}
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 mb-4 flex items-center justify-center shadow-inner">
              {capturedSnapshot ? (
                <img
                  src={capturedSnapshot}
                  alt="Hasil Foto"
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

              {/* Status Banner */}
              {capturedSnapshot && (
                <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Foto Berhasil Diambil</span>
                </div>
              )}
            </div>

            {/* Kontrol Shutter Kamera - MURNI KAMERA (Tanpa Upload File) */}
            <div className="flex items-center gap-3">
              {!capturedSnapshot ? (
                <button
                  type="button"
                  onClick={captureLivePhoto}
                  className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 tracking-wide"
                >
                  <Camera className="w-4 h-4" />
                  <span>JEPRET FOTO SEKARANG</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedSnapshot('');
                      const isSelfie = activeCameraTarget === 'selfie_karyawan';
                      const facingMode = isSelfie ? 'user' : { ideal: 'environment' };
                      navigator.mediaDevices
                        .getUserMedia({
                          video: {
                            facingMode: facingMode as any,
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                          },
                          audio: false,
                        })
                        .then((stream) => {
                          streamRef.current = stream;
                          if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            videoRef.current.play();
                          }
                        });
                    }}
                    className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Ulangi Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={confirmCapturedPhoto}
                    className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Gunakan Foto Ini</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 3: MODAL PROSES LOADING SISTEM (DESKRIPSI PROSES SEDANG BERJALAN)       */}
      {/* ========================================================================= */}
      {processLoading?.active && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-7 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600 shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            {processLoading.step && (
              <span className="text-[11px] font-black tracking-wider uppercase text-amber-700 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-200 mb-2">
                {processLoading.step}
              </span>
            )}

            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight mb-2">
              {processLoading.title}
            </h3>

            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {processLoading.subtitle}
            </p>

            {/* Progress Bar Animation */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-6">
              <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 h-full rounded-full w-full animate-pulse" />
            </div>

            <span className="text-[10px] text-slate-400 mt-2 font-medium">
              Mohon tunggu, jangan tutup atau refresh halaman...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
