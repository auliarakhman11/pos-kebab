'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Loader2,
  LogOut,
  Building2,
  Store,
  User,
  Phone,
  CreditCard,
  Truck,
  Sparkles,
  Layers,
  FileText,
  X,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Sun,
  Moon,
  Menu,
  Banknote,
  ArrowRight,
  ChevronUp,
  UserCheck,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import useCartStore, { SelectedVarian } from '@/store/cartStore';
import { useTheme } from '@/lib/theme';
import { db } from '@/lib/db';
import { printReceiptBluetooth, formatReceiptDateTime } from '@/utils/printBluetooth';
import ModalSuksesTransaksi from '@/components/ModalSuksesTransaksi';
import ModalGantiShift from '@/components/ModalGantiShift';
import ModalBarangKebutuhan from '@/components/ModalBarangKebutuhan';
import ModalDaftarTransaksi from '@/components/ModalDaftarTransaksi';
import {
  ProdukItem,
  KategoriItem,
  DeliveryItem,
  PembayaranItem,
  KategoriVarianItem,
} from '@/types/pos.types';

export default function KasirPOSPage() {
  const router = useRouter();
  const { user, cabang, logout, initAuth } = useAuthStore();
  const {
    cart,
    delivery_id,
    buka_toko_data,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    changeDeliveryType,
    setBukaTokoData,
    getTotalBelanja,
    getTotalItems,
  } = useCartStore();

  // Global Theme Mode (Light / Dark)
  const { theme, toggleTheme } = useTheme();

  // Mobile / Tablet Navigation Drawer Toggle
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Popup / Drawer Keranjang untuk Layar Sempit / Tablet Vertikal (< lg)
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // State Data Master POS
  const [loadingInit, setLoadingInit] = useState(true);
  const [kategoris, setKategoris] = useState<KategoriItem[]>([]);
  const [produks, setProduks] = useState<ProdukItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [pembayarans, setPembayarans] = useState<PembayaranItem[]>([]);
  const [kategoriVarians, setKategoriVarians] = useState<KategoriVarianItem[]>([]);

  // Filter & Search
  const [selectedKategoriId, setSelectedKategoriId] = useState<number>(0); // 0 = Semua
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Detail & Varian
  const [activeModalProduk, setActiveModalProduk] = useState<ProdukItem | null>(null);
  const [selectedVarians, setSelectedVarians] = useState<SelectedVarian[]>([]);
  const [itemCatatan, setItemCatatan] = useState<string>('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Checkout & Pembayaran (Customer Name default kosong, Phone hanya angka)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedPembayaranId, setSelectedPembayaranId] = useState<number>(1); // Default Cash
  const [pilihanBayarTipe, setPilihanBayarTipe] = useState<'pas' | number | 'custom'>('pas');
  const [customNominalInput, setCustomNominalInput] = useState<string>('');

  // Modal Sukses / Struk Ringkasan
  const [successTransactionPayload, setSuccessTransactionPayload] = useState<any | null>(null);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState<boolean>(false);

  // Modal Operasional: Ganti Shift & Barang Kebutuhan & Daftar Transaksi
  const [isModalGantiShiftOpen, setIsModalGantiShiftOpen] = useState(false);
  const [isModalKebutuhanOpen, setIsModalKebutuhanOpen] = useState(false);
  const [isModalTransaksiOpen, setIsModalTransaksiOpen] = useState(false);
  const [statusOperasional, setStatusOperasional] = useState<{
    cabang_id: number;
    kota_id: number;
    jumlah_cabang_kota: number;
    is_kebutuhan_enabled: boolean;
    buka_toko_id: number | null;
    kode_buka_toko: string | null;
    tgl_buka_toko: string | null;
    karyawan_jaga: Array<{ id: number; karyawan_id: number; nama: string; ganti: number }>;
  } | null>(null);

  // Modul 6: Offline-First States (Dexie.js)
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotification, setSyncNotification] = useState<{
    type: 'success' | 'warning' | 'info' | 'error';
    message: string;
  } | null>(null);

  const refreshOfflineCount = async () => {
    try {
      const count = await db.offline_transactions.count();
      setOfflineCount(count);
    } catch (e) {
      console.error('Gagal membaca count Dexie:', e);
    }
  };

  const syncOfflineTransactions = async () => {
    if (isSyncing) return;
    try {
      const txs = await db.offline_transactions.toArray();
      if (txs.length === 0) {
        await refreshOfflineCount();
        return;
      }

      setIsSyncing(true);
      let successCount = 0;
      let failCount = 0;

      for (const tx of txs) {
        try {
          const res = await api.post('/checkout', tx.payload_data);
          if (res.data?.success) {
            if (tx.id) {
              await db.offline_transactions.delete(tx.id);
            }
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error('Gagal sync transaksi offline ID:', tx.id, err);
          failCount++;
        }
      }

      await refreshOfflineCount();

      if (successCount > 0 && failCount === 0) {
        setSyncNotification({
          type: 'success',
          message: `Sinkronisasi Berhasil! ${successCount} transaksi offline telah dikirim ke server.`,
        });
      } else if (successCount > 0 && failCount > 0) {
        setSyncNotification({
          type: 'warning',
          message: `${successCount} transaksi berhasil disinkronkan, ${failCount} masih tertunda.`,
        });
      } else if (failCount > 0) {
        setSyncNotification({
          type: 'error',
          message: `Gagal menyinkronkan ${failCount} transaksi offline. Server belum merespons.`,
        });
      }
    } catch (error) {
      console.error('Error syncOfflineTransactions:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    refreshOfflineCount();

    const handleOnline = () => {
      setIsOnline(true);
      setSyncNotification({
        type: 'info',
        message: 'Koneksi kembali online! Memulai sinkronisasi otomatis...',
      });
      syncOfflineTransactions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncNotification({
        type: 'warning',
        message: 'Koneksi internet terputus. Mode Offline aktif.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (syncNotification) {
      const timer = setTimeout(() => {
        setSyncNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [syncNotification]);

  const fetchStatusOperasional = async () => {
    try {
      const res = await api.get('/operasional/status');
      if (res.data?.success && res.data.data) {
        setStatusOperasional(res.data.data);
      }
    } catch (err) {
      console.error('Error get status operasional:', err);
    }
  };

  // Fallback image handling
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});

  // 1. Inisialisasi Auth & Verifikasi Buka Toko
  useEffect(() => {
    fetchStatusOperasional();
  }, []);
  useEffect(() => {
    initAuth();

    const verifyStoreStatus = async () => {
      try {
        const res = await api.get('/status-toko');
        if (res.data?.success) {
          const status = res.data.data;
          // Jika toko belum dibuka, redirect ke halaman /buka-toko
          if (!status?.is_open) {
            router.replace('/buka-toko');
            return;
          }
          // Simpan data buka toko ke Zustand
          setBukaTokoData(status);
        }
      } catch (err) {
        console.error('Error cek status toko:', err);
      }
    };

    verifyStoreStatus();
  }, [router, initAuth, setBukaTokoData]);

  // 2. Fetch Master Data Katalog POS (GET /api/pos/init)
  useEffect(() => {
    const fetchPosData = async () => {
      try {
        setLoadingInit(true);
        const res = await api.get('/pos/init');
        if (res.data?.success && res.data.data) {
          const { kategori, produk, delivery, pembayaran, kategori_varian } = res.data.data;
          setKategoris(kategori || []);
          setProduks(produk || []);
          setDeliveries(delivery || []);
          setPembayarans(pembayaran || []);
          setKategoriVarians(kategori_varian || []);

          if (delivery && delivery.length > 0 && !delivery.some((d: DeliveryItem) => d.id === delivery_id)) {
            changeDeliveryType(delivery[0].id);
          }
        }
      } catch (err) {
        console.error('Error load POS init data:', err);
      } finally {
        setLoadingInit(false);
      }
    };

    fetchPosData();
  }, []);

  // Helper Lookup Harga Produk berdasarkan delivery_id
  const getHargaProduk = (produk: ProdukItem, deliveryId: number): number => {
    const h = produk.harga.find((item) => item.delivery_id === deliveryId);
    return h ? h.harga : 0;
  };

  // Map fungsi lookup harga untuk changeDeliveryType
  const lookupHarga = (produkId: number, targetDeliveryId: number): number | undefined => {
    const p = produks.find((item) => item.id === produkId);
    if (!p) return undefined;
    const h = p.harga.find((item) => item.delivery_id === targetDeliveryId);
    return h ? h.harga : 0;
  };

  // Handler Ganti Delivery Type (Jenis Order)
  const handleDeliveryChange = (newDeliveryId: number) => {
    changeDeliveryType(newDeliveryId, lookupHarga);
  };

  // Filter Katalog Produk berdasarkan Kategori & Pencarian
  const filteredProdukList = useMemo(() => {
    return produks.filter((p) => {
      const matchKategori =
        selectedKategoriId === 0 || p.kategori_id === selectedKategoriId;
      const matchSearch =
        p.nm_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.resep_info.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKategori && matchSearch;
    });
  }, [produks, selectedKategoriId, searchQuery]);

  // Buka Modal Detail Produk
  const handleOpenDetailModal = (produk: ProdukItem) => {
    setActiveModalProduk(produk);
    setSelectedVarians([]);
    setItemCatatan('');
    setItemQty(1);
    setModalError(null);
  };

  // Toggle Pilihan Varian (Multi-select)
  const handleToggleVarian = (varian: { id: number; nm_varian: string; harga: number }) => {
    setSelectedVarians((prev) => {
      const exists = prev.some((v) => v.id === varian.id);
      if (exists) {
        return prev.filter((v) => v.id !== varian.id);
      } else {
        return [...prev, varian];
      }
    });
    setModalError(null);
  };

  // Hitung total harga pada modal (Harga Produk Delivery + Varian) * Qty
  const modalUnitPrice = useMemo(() => {
    if (!activeModalProduk) return 0;
    const basePrice = getHargaProduk(activeModalProduk, delivery_id);
    const varianTotal = selectedVarians.reduce((sum, v) => sum + (v.harga || 0), 0);
    return basePrice + varianTotal;
  }, [activeModalProduk, delivery_id, selectedVarians]);

  const modalTotalPrice = modalUnitPrice * itemQty;

  // Submit Modal Detail ke Keranjang
  const handleConfirmAddToCart = () => {
    if (!activeModalProduk) return;

    // Logika WAJIB Varian: Jika tampil_varian = 1, WAJIB dipilih minimal satu varian
    if (activeModalProduk.tampil_varian === 1 && selectedVarians.length === 0) {
      setModalError('Wajib memilih minimal 1 varian rasa / saos untuk produk ini!');
      return;
    }

    addToCart({
      produk_id: activeModalProduk.id,
      nm_produk: activeModalProduk.nm_produk,
      foto: activeModalProduk.foto,
      harga: getHargaProduk(activeModalProduk, delivery_id),
      qty: itemQty,
      catatan: itemCatatan,
      varian: selectedVarians,
      resep_info: activeModalProduk.resep_info,
    });

    setActiveModalProduk(null);
  };

  // Kalkulasi Total Belanja & Nominal Bayar
  const totalBelanja = getTotalBelanja();
  const totalItemsCount = getTotalItems();

  // Daftar Pecahan Uang (Hanya tampil jika nominal >= total belanja)
  const standardDenominations = [20000, 50000, 100000, 150000, 200000];
  const eligibleDenominations = useMemo(() => {
    return standardDenominations.filter((nominal) => nominal >= totalBelanja);
  }, [totalBelanja]);

  // Hitung Nominal Uang yang Diberikan
  const nominalUangBayar = useMemo(() => {
    if (pilihanBayarTipe === 'pas') {
      return totalBelanja;
    }
    if (typeof pilihanBayarTipe === 'number') {
      return pilihanBayarTipe;
    }
    if (pilihanBayarTipe === 'custom') {
      return Number(customNominalInput) || 0;
    }
    return totalBelanja;
  }, [pilihanBayarTipe, customNominalInput, totalBelanja]);

  // Hitung Uang Kembalian
  const uangKembalian = Math.max(0, nominalUangBayar - totalBelanja);
  const isNominalKurang = nominalUangBayar < totalBelanja;

  // Handler Tombol Bayar (MODUL 4 & MODUL 6 - Offline-First Fallback & Bluetooth Struk)
  const handleProsesPembayaran = async () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong! Pilih produk terlebih dahulu.');
      return;
    }

    if (isNominalKurang) {
      alert('Nominal pembayaran kurang dari total belanja!');
      return;
    }

    const payload = {
      pelanggan: {
        nama: customerName.trim() || '',
        no_tlp: customerPhone.trim() || '',
      },
      delivery_id: delivery_id,
      pembayaran_id: selectedPembayaranId,
      diskon: 0,
      nominal_bayar: nominalUangBayar,
      kembalian: uangKembalian,
      items: cart.map((item) => ({
        produk_id: item.produk_id,
        nm_produk: item.nm_produk,
        qty: item.qty,
        harga: item.harga,
        harga_normal: item.harga,
        catatan: item.catatan,
        varian: (item.varian || []).map((v) => ({
          id: v.id,
          nm_varian: v.nm_varian,
          harga: v.harga,
        })),
      })),
      buka_toko: {
        kode: buka_toko_data?.kode || null,
        buka_toko_id: buka_toko_data?.buka_toko_id || buka_toko_data?.id || null,
      },
    };

    // Helper: Simpan ke Dexie.js saat Offline / Network Error
    const processOfflineCheckout = async () => {
      try {
        // 1. Simpan payload transaksi ke Dexie.js
        await db.offline_transactions.add({
          payload_data: payload,
          created_at: new Date().toISOString(),
          status: 'pending',
        });
        await refreshOfflineCount();

        // 2. Siapkan data struk offline
        const deliveryItem = deliveries.find((d) => d.id === delivery_id);
        const pembayaranItem = pembayarans.find((p) => p.id === selectedPembayaranId);
        const formattedOfflineTime = formatReceiptDateTime(new Date());

        const offlineReceiptData = {
          no_invoice: `OFF-${Date.now().toString().slice(-6)}`,
          urutan: 0,
          cabang_nama: cabang?.nama || 'Cabang Kebab Yasmin',
          cabang_telepon: (cabang as any)?.telepon || undefined,
          waktu_transaksi: formattedOfflineTime,
          waktu_cetak: formattedOfflineTime,
          kasir_nama: user?.name || 'Kasir',
          nm_costumer: customerName.trim() || undefined,
          no_tlp: customerPhone.trim() || undefined,
          jenis_order: deliveryItem?.delivery || 'Dine In',
          pembayaran_nama: pembayaranItem?.pembayaran || 'Cash',
          items: cart.map((item) => {
            const varianTotal = (item.varian || []).reduce((sum, v) => sum + v.harga, 0);
            const totalHarga = (item.harga + varianTotal) * item.qty;
            return {
              qty: item.qty,
              nm_produk: item.nm_produk,
              varian_str:
                item.varian && item.varian.length > 0
                  ? item.varian.map((v) => v.nm_varian).join(', ')
                  : undefined,
              harga_satuan: item.harga,
              total_harga: totalHarga,
              catatan: item.catatan || undefined,
            };
          }),
          subtotal: totalBelanja,
          diskon: 0,
          total_bayar: totalBelanja,
          dibayar: nominalUangBayar,
          kembalian: uangKembalian,
          is_offline: true,
        };

        // 3. Tampilkan notifikasi "Tersimpan Offline. Akan disinkronkan saat online."
        setSyncNotification({
          type: 'warning',
          message: 'Tersimpan Offline. Akan disinkronkan saat online.',
        });

        // 4. Tetap jalankan fungsi print struk Bluetooth (berjalan lokal tanpa internet)
        try {
          await printReceiptBluetooth(offlineReceiptData);
        } catch (printErr) {
          console.warn('Cetak Bluetooth offline:', printErr);
        }

        // 5. Kosongkan keranjang (Zustand) agar kasir bisa melayani antrean pelanggan berikutnya
        clearCart();
        setCustomerName('');
        setCustomerPhone('');
        setPilihanBayarTipe('pas');
        setCustomNominalInput('');
        setIsCartDrawerOpen(false);

        // 6. Tampilkan Modal Sukses Transaksi dengan data offline
        setSuccessTransactionPayload(offlineReceiptData);
      } catch (saveErr) {
        console.error('Gagal menyimpan ke Dexie:', saveErr);
        alert('Gagal menyimpan transaksi offline ke database lokal.');
      }
    };

    // Cek jika sedang offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await processOfflineCheckout();
      return;
    }

    try {
      setIsSubmittingCheckout(true);

      const res = await api.post('/checkout', payload);

      if (res.data?.success && res.data?.data) {
        // 1. Kosongkan keranjang di Zustand store
        clearCart();

        // 2. Reset input form kasir
        setCustomerName('');
        setCustomerPhone('');
        setPilihanBayarTipe('pas');
        setCustomNominalInput('');
        setIsCartDrawerOpen(false);

        // 3. Tampilkan Modal Sukses Transaksi dengan data respons API
        setSuccessTransactionPayload(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Gagal memproses transaksi checkout.');
      }
    } catch (err: any) {
      console.error('Error Checkout:', err);
      // Deteksi jika Network Error / Server unreachable
      const isNetworkError =
        !err.response ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error') ||
        (err.response && err.response.status >= 500);

      if (isNetworkError) {
        // Fallback: Jangan hentikan aplikasi, simpan ke Dexie & cetak struk
        await processOfflineCheckout();
      } else {
        const msg =
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memproses transaksi checkout.';
        alert(`Checkout Gagal: ${msg}`);
      }
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  const handleSelesaiTransaksi = () => {
    setSuccessTransactionPayload(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Format Nama Cabang: Contoh "Cabang Banjar indah"
  const formattedCabangName = useMemo(() => {
    const raw = cabang?.nama?.trim();
    if (!raw) return 'Cabang Banjar indah';
    if (raw.toLowerCase().startsWith('cabang')) {
      return raw;
    }
    return `Cabang ${raw}`;
  }, [cabang]);

  // KOMPONEN RENDER KONTEN KERANJANG & CHECKOUT (DIPAKAI DI DESKTOP SIDEBAR MAUPUN POPUP/DRAWER MOBILE)
  const renderCartAndCheckoutContent = (isPopup = false) => (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      {/* HEADER KERANJANG */}
      <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Keranjang Belanja</h3>
          <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            {totalItemsCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          )}

          {isPopup && (
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-colors ml-1"
              title="Tutup Keranjang"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* UNIFIED SCROLLABLE CONTAINER: GABUNGAN KERANJANG & DETAIL PEMBAYARAN DALAM 1 SCROLL */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 transition-colors">
        {/* SECTION 1: DAFTAR ITEM KERANJANG BELANJA */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-500" />
              Daftar Pesanan ({totalItemsCount} item)
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="py-7 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <ShoppingCart className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-1.5" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Keranjang Masih Kosong</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Pilih menu di katalog untuk menambah ke pesanan.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const varianExtra = (item.varian || []).reduce(
                (acc, v) => acc + (v.harga || 0),
                0
              );
              const lineTotal = (item.harga + varianExtra) * item.qty;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-start justify-between gap-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  {/* KOLOM KIRI: NAMA PRODUK, VARIAN & CATATAN */}
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">
                      {item.nm_produk}
                    </p>

                    {item.varian && item.varian.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.varian.map((v) => (
                          <span
                            key={v.id}
                            className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/60"
                          >
                            {v.nm_varian}
                            {v.harga > 0 && ` (+Rp ${v.harga.toLocaleString('id-ID')})`}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.catatan && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 bg-white dark:bg-slate-900/90 p-1.5 rounded-lg border border-slate-200/70 dark:border-slate-700/60">
                        &ldquo;{item.catatan}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* KOLOM KANAN: TOMBOL KURANG, QTY, TOMBOL TAMBAH, TOMBOL HAPUS & HARGA */}
                  <div className="flex flex-col items-end justify-between shrink-0 gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer active:scale-95"
                          title="Kurangi qty"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-800 dark:text-slate-100">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer active:scale-95"
                          title="Tambah qty"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 dark:text-amber-400">
                        Rp {lineTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SECTION DIVIDER: PEMISAH ELEGAN ANTARA KERANJANG DAN PEMBAYARAN */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              Detail Pesanan & Pembayaran
            </span>
          </div>
        </div>

        {/* SECTION 2: FORM CHECKOUT (JENIS ORDER, PELANGGAN & PEMBAYARAN) */}
        <div className="space-y-3 bg-slate-50/60 dark:bg-slate-800/40 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-colors">
          {/* DROPDOWN JENIS ORDER (DELIVERY) */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Truck className="w-3.5 h-3.5 text-amber-500" />
              Jenis Order (Delivery):
            </label>
            <select
              value={delivery_id}
              onChange={(e) => handleDeliveryChange(Number(e.target.value))}
              className="w-full h-10 px-3 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              {deliveries.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.delivery}
                </option>
              ))}
            </select>
          </div>

          {/* DATA PELANGGAN (NAMA & NO TELEPON ANGKA) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nama Customer:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Isi Nama Customer"
                className="w-full h-9 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                No. Telepon:
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="08xxxxxxxxxx"
                className="w-full h-9 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* DROPDOWN METODE PEMBAYARAN */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              Metode Pembayaran:
            </label>
            <select
              value={selectedPembayaranId}
              onChange={(e) => setSelectedPembayaranId(Number(e.target.value))}
              className="w-full h-10 px-3 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              {pembayarans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.pembayaran}
                </option>
              ))}
            </select>
          </div>

          {/* PILIH BAYAR (UANG PECAHAN / UANG PAS) */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                Pilih Uang Diterima:
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                Total: Rp {totalBelanja.toLocaleString('id-ID')}
              </span>
            </label>

            <select
              value={pilihanBayarTipe}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'pas' || val === 'custom') {
                  setPilihanBayarTipe(val);
                } else {
                  setPilihanBayarTipe(Number(val));
                }
              }}
              className="w-full h-10 px-3 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="pas">
                Uang Pas (Rp {totalBelanja.toLocaleString('id-ID')})
              </option>
              {eligibleDenominations.map((nom) => (
                <option key={nom} value={nom}>
                  Rp {nom.toLocaleString('id-ID')}
                </option>
              ))}
              <option value="custom">Nominal Lainnya...</option>
            </select>

            {/* Input Manual jika memilih 'Nominal Lainnya' */}
            {pilihanBayarTipe === 'custom' && (
              <div className="mt-2">
                <input
                  type="number"
                  value={customNominalInput}
                  onChange={(e) => setCustomNominalInput(e.target.value)}
                  placeholder="Ketik nominal uang..."
                  min={totalBelanja}
                  className="w-full h-9 px-3 text-xs font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. RINGKASAN HARGA & TOMBOL PROSES BAYAR (STICKY FOOTER KERANJANG) */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 space-y-2.5 shrink-0">
        <div className="space-y-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Total Belanja</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              Rp {totalBelanja.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Uang Diterima</span>
            <span className="text-slate-800 dark:text-slate-200">
              Rp {nominalUangBayar.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
              Uang Kembalian
            </span>
            <span
              className={`text-sm font-black ${isNominalKurang
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
                }`}
            >
              {isNominalKurang
                ? 'Uang Kurang!'
                : `Rp ${uangKembalian.toLocaleString('id-ID')}`}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={cart.length === 0 || isNominalKurang || isSubmittingCheckout}
          onClick={handleProsesPembayaran}
          className={`w-full h-11 sm:h-12 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99] ${cart.length === 0 || isNominalKurang || isSubmittingCheckout
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
            : 'bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/25'
            }`}
        >
          {isSubmittingCheckout ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>MEMPROSES TRANSAKSI...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>PROSES BAYAR & CETAK STRUK</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (loadingInit) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors">
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
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Menyiapkan Terminal Kasir (POS)...</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Mengambil katalog produk, varian & harga</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 font-sans transition-colors pb-20 lg:pb-0">
      {/* NOTIFIKASI TOAST SINKRONISASI / STATUS JARINGAN */}
      {syncNotification && (
        <div
          className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 transition-all animate-in fade-in slide-in-from-top-3 max-w-[90vw] ${
            syncNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
              : syncNotification.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200'
              : syncNotification.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
              : 'bg-sky-50 border-sky-300 text-sky-800 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-200'
          }`}
        >
          {syncNotification.type === 'success' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
          {syncNotification.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
          {syncNotification.type === 'error' && <X className="w-4 h-4 text-rose-600 shrink-0" />}
          {syncNotification.type === 'info' && <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />}
          <span>{syncNotification.message}</span>
          <button
            type="button"
            onClick={() => setSyncNotification(null)}
            className="ml-2 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER KASIR POS                                                   */}
      {/* ========================================================================= */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-6 py-2 shadow-xs transition-colors">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* SISI KIRI: BRAND LOGO + NAMA CABANG (Contoh: "Cabang Banjar indah") */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative w-24 sm:w-28 h-8 sm:h-9 shrink-0">
              {/* GANTI LOGO KETIKA DARK MODE SESUAI UPLOAD PENGGUNA */}
              <Image
                src={theme === 'dark' ? '/logo-yasmin-dark.png' : '/logo-yasmin.png'}
                alt="Yasmin Kebab"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden xs:block" />

            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap">
                {formattedCabangName}
              </h1>
            </div>
          </div>

          {/* SISI TENGAH: NAVBAR MENU HALAMAN (DESKTOP VIEW) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => router.push('/kasir')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Kasir</span>
            </button>
            <button
              type="button"
              onClick={() => setIsModalGantiShiftOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5 hover:bg-white/60 dark:hover:bg-slate-700/60 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Ganti Shift</span>
            </button>
            {statusOperasional?.is_kebutuhan_enabled && (
              <button
                type="button"
                onClick={() => setIsModalKebutuhanOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5 hover:bg-white/60 dark:hover:bg-slate-700/60 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>Barang Kebutuhan</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsModalTransaksiOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5 hover:bg-white/60 dark:hover:bg-slate-700/60 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Daftar Transaksi</span>
            </button>
            {/* <button
              type="button"
              onClick={() => router.push('/buka-toko')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5 hover:bg-white/60 dark:hover:bg-slate-700/60 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Buka Toko</span>
            </button> */}
            <button
              type="button"
              onClick={() => router.push('/tutup-toko')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-all flex items-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Tutup Toko</span>
            </button>
          </nav>

          {/* SISI KANAN: STATUS JARINGAN (ONLINE / OFFLINE) + TOMBOL SINKRON + TOGGLE DARK MODE + TOMBOL KELUAR */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Indikator Status Jaringan (🟢 Online / 🔴 Offline) */}
            <div
              className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 animate-pulse'
              }`}
              title={isOnline ? 'Terhubung ke server online' : 'Mode offline aktif, transaksi disimpan ke IndexedDB'}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="hidden xs:inline">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {offlineCount > 0 && (
                <span
                  className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isOnline
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                      : 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100'
                  }`}
                  title={`${offlineCount} transaksi tersimpan lokal`}
                >
                  {offlineCount}
                </span>
              )}
            </div>

            {/* Tombol Sinkronisasi Manual (jika online & ada offlineCount) */}
            {isOnline && offlineCount > 0 && (
              <button
                type="button"
                disabled={isSyncing}
                onClick={syncOfflineTransactions}
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                title="Sinkronkan transaksi offline sekarang"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isSyncing ? 'Sinkron...' : `Sinkron (${offlineCount})`}
                </span>
              </button>
            )}

            {/* Tombol Toggle Theme Light / Dark (Di sebelah kiri tombol Keluar) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
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

            {/* Tombol Keluar (Logout) */}
            <button
              type="button"
              onClick={handleLogout}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:border-rose-900 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Keluar</span>
            </button>

            {/* Tombol Hamburger Navigasi untuk Mobile & Tablet */}
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="lg:hidden h-8 sm:h-9 w-8 sm:w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Menu Navigasi"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* MOBILE / TABLET NAV DRAWER (TAMPIL KETIKA HAMBURGER DIKLIK) */}
        {mobileNavOpen && (
          <div className="lg:hidden mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => {
                router.push('/kasir');
                setMobileNavOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-amber-500 text-white shadow-xs"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Kasir</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalGantiShiftOpen(true);
                setMobileNavOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Ganti Shift</span>
            </button>
            {statusOperasional?.is_kebutuhan_enabled && (
              <button
                type="button"
                onClick={() => {
                  setIsModalKebutuhanOpen(true);
                  setMobileNavOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>Barang Kebutuhan</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsModalTransaksiOpen(true);
                setMobileNavOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Daftar Transaksi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                router.push('/buka-toko');
                setMobileNavOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Buka Toko</span>
            </button>
            <button
              type="button"
              onClick={() => {
                router.push('/tutup-toko');
                setMobileNavOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Tutup Toko</span>
            </button>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN POS WORKSPACE: 2-COLUMN LAYOUT                                     */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ========================================================================= */}
        {/* LAYOUT KIRI: KATALOG MENU PRODUK                                          */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 overflow-y-auto lg:max-h-[calc(100vh-60px)]">
          {/* ===================================================================== */}
          {/* STICKY TOP BAR: SEARCH BAR, MENAMPILKAN JUMLAH MENU & KATEGORI          */}
          {/* ===================================================================== */}
          <div className="sticky -top-3 sm:-top-5 z-20 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-md pt-2 sm:pt-3 pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
            {/* SEARCH BAR & JUMLAH MENU */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-2.5">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama menu / resep bahan..."
                  className="w-full h-10 sm:h-11 pl-10 pr-9 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 self-end sm:self-center">
                Menampilkan <span className="text-amber-600 dark:text-amber-400 font-extrabold">{filteredProdukList.length}</span> Menu
              </div>
            </div>

            {/* HORIZONTAL SCROLL: KATEGORI MENU (PADDING TERJAGA DI TABLET & MOBILE) */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedKategoriId(0)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${selectedKategoriId === 0
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
              >
                Semua Menu
              </button>

              {kategoris.map((kat) => {
                const isSelected = selectedKategoriId === kat.id;
                return (
                  <button
                    key={kat.id}
                    type="button"
                    onClick={() => setSelectedKategoriId(kat.id)}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${isSelected
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                      }`}
                  >
                    {kat.kategori}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRID KATALOG PRODUK */}
          {filteredProdukList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center my-auto transition-colors">
              <Store className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tidak ada produk ditemukan</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                Coba pilih kategori lain atau ketik kata kunci yang berbeda di pencarian.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 pb-6">
              {filteredProdukList.map((produk) => {
                const hargaSatuan = getHargaProduk(produk, delivery_id);
                const hasVarian = produk.tampil_varian === 1;
                const isImgBroken = brokenImages[produk.id];

                // URL Gambar Produk dari https://admin.kebabyasmin.id/
                const imageUrl = produk.foto
                  ? `https://admin.kebabyasmin.id/${produk.foto.replace(/^\/+/, '')}`
                  : null;

                return (
                  <div
                    key={produk.id}
                    onClick={() => handleOpenDetailModal(produk)}
                    className="group bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/70 shadow-xs hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer active:scale-[0.98]"
                  >
                    {/* FOTO PRODUK DENGAN NEXT/IMAGE */}
                    <div className="relative w-full aspect-4/3 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {imageUrl && !isImgBroken ? (
                        <Image
                          src={imageUrl}
                          alt={produk.nm_produk}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => {
                            setBrokenImages((prev) => ({ ...prev, [produk.id]: true }));
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/80 p-4">
                          <Store className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-bold text-center">Foto Kebab</span>
                        </div>
                      )}

                      {/* BADGE VARIAN JIKA TAMPIL_VARIAN === 1 */}
                      {hasVarian && (
                        <span className="absolute top-2 right-2 bg-amber-500/90 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Varian
                        </span>
                      )}
                    </div>

                    {/* KONTEN KARTU: NAMA & HARGA */}
                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {produk.nm_produk}
                        </h4>
                        {produk.resep_info && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                            {produk.resep_info}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                          Rp {hargaSatuan.toLocaleString('id-ID')}
                        </span>
                        <span className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* LAYOUT KANAN: SIDEBAR KERANJANG & CHECKOUT (HANYA TAMPIL DI DESKTOP >= lg)  */}
        {/* Pada layar tablet vertikal / mobile (< lg), dipindahkan ke Popup/Drawer      */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex flex-col w-[420px] xl:w-[450px] border-l border-slate-200 dark:border-slate-800 h-auto lg:max-h-[calc(100vh-60px)] shadow-lg z-20">
          {renderCartAndCheckoutContent(false)}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOMBOL MELAYANG (FLOATING ACTION BAR) UNTUK TABLET VERTIKAL & MOBILE     */}
      {/* Hanya aktif ketika layar sempit atau dibuka vertikal (< lg)                */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
        <button
          type="button"
          onClick={() => setIsCartDrawerOpen(true)}
          className="w-full bg-slate-900/95 dark:bg-amber-500/95 text-white dark:text-slate-950 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-amber-500/20 border border-slate-700/50 dark:border-amber-400 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative p-1 bg-white/10 dark:bg-slate-950/10 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-amber-400 dark:text-slate-950" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-slate-300 dark:text-slate-900 leading-tight">
                {totalItemsCount > 0 ? `${totalItemsCount} Item di Keranjang` : 'Keranjang Kosong'}
              </p>
              <p className="text-sm font-black text-white dark:text-slate-950">
                Rp {totalBelanja.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-500 dark:bg-slate-950 text-white dark:text-amber-400 px-3.5 py-2 rounded-xl text-xs font-black shadow-xs">
            <span>Lihat Keranjang & Bayar</span>
            <ChevronUp className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. POPUP / SLIDE-OVER DRAWER KERANJANG & PEMBAYARAN (TABLET VERTIKAL/MOBILE)*/}
      {/* ========================================================================= */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end lg:hidden animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {renderCartAndCheckoutContent(true)}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL DETAIL PRODUK & VARIAN (TUGAS 3)                                  */}
      {/* ========================================================================= */}
      {activeModalProduk && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
            {/* HEADER MODAL */}
            <div className="relative p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/80 dark:bg-slate-800/60">
              <div className="flex items-center gap-3 pr-8">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                  {activeModalProduk.foto && !brokenImages[activeModalProduk.id] ? (
                    <Image
                      src={`https://admin.kebabyasmin.id/${activeModalProduk.foto.replace(/^\/+/, '')}`}
                      alt={activeModalProduk.nm_produk}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                      <Store className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 leading-tight">
                    {activeModalProduk.nm_produk}
                  </h3>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                    Rp {getHargaProduk(activeModalProduk, delivery_id).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalProduk(null)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BODY MODAL */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* INFO RESEP / BAHAN */}
              {activeModalProduk.resep_info && (
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1 mb-0.5">
                    <FileText className="w-3.5 h-3.5" />
                    Bahan & Resep:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {activeModalProduk.resep_info}
                  </p>
                </div>
              )}

              {/* LOGIKA PILIHAN VARIAN */}
              {activeModalProduk.tampil_varian === 1 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Pilih Varian (Wajib):
                    </label>
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                      Wajib Pilih Min. 1
                    </span>
                  </div>

                  {kategoriVarians.map((katVarian) => (
                    <div
                      key={katVarian.id}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                    >
                      <h5 className="text-xs font-black text-slate-700 dark:text-slate-200">
                        {katVarian.kategori_varian}
                      </h5>

                      <div className="grid grid-cols-2 gap-2">
                        {katVarian.varian.map((v) => {
                          const isSelected = selectedVarians.some((sel) => sel.id === v.id);
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() =>
                                handleToggleVarian({
                                  id: v.id,
                                  nm_varian: v.nm_varian,
                                  harga: v.harga,
                                })
                              }
                              className={`p-2 rounded-xl text-left border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${isSelected
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                                }`}
                            >
                              <span className="truncate mr-1">{v.nm_varian}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {v.harga > 0 && (
                                  <span
                                    className={`text-[10px] font-bold ${isSelected ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'
                                      }`}
                                  >
                                    +Rp {v.harga.toLocaleString('id-ID')}
                                  </span>
                                )}
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CATATAN TAMBAHAN UNTUK DAPUR */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  Catatan Pesanan (Opsional):
                </label>
                <textarea
                  value={itemCatatan}
                  onChange={(e) => setItemCatatan(e.target.value)}
                  placeholder="Contoh: Pedas sedang, ekstra sayur, tanpa bawang..."
                  rows={2}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              {/* JUMLAH QTY */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Jumlah Pesanan:</span>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setItemQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-black text-slate-800 dark:text-slate-100">
                    {itemQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemQty((q) => q + 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* PERINGATAN ERROR VALIDASI */}
              {modalError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}
            </div>

            {/* FOOTER MODAL */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">Total Item:</p>
                <p className="text-base font-black text-slate-900 dark:text-amber-400">
                  Rp {modalTotalPrice.toLocaleString('id-ID')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleConfirmAddToCart}
                disabled={activeModalProduk.tampil_varian === 1 && selectedVarians.length === 0}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${activeModalProduk.tampil_varian === 1 && selectedVarians.length === 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25'
                  }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Tambah ke Keranjang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL SUKSES TRANSAKSI & CETAK STRUK BLUETOOTH                         */}
      {/* ========================================================================= */}
      <ModalSuksesTransaksi
        isOpen={!!successTransactionPayload}
        onClose={handleSelesaiTransaksi}
        data={successTransactionPayload}
      />

      {/* ========================================================================= */}
      {/* 7. MODAL GANTI SHIFT                                                      */}
      {/* ========================================================================= */}
      <ModalGantiShift
        isOpen={isModalGantiShiftOpen}
        onClose={() => setIsModalGantiShiftOpen(false)}
        onSuccess={fetchStatusOperasional}
        bukaTokoId={statusOperasional?.buka_toko_id}
        currentKaryawanIds={(statusOperasional?.karyawan_jaga || []).map((j) => j.karyawan_id)}
      />

      {/* ========================================================================= */}
      {/* 8. MODAL BARANG KEBUTUHAN (HPP STOK GUDANG + MARKUP 10%)                  */}
      {/* ========================================================================= */}
      <ModalBarangKebutuhan
        isOpen={isModalKebutuhanOpen}
        onClose={() => setIsModalKebutuhanOpen(false)}
        bukaTokoId={statusOperasional?.buka_toko_id}
      />

      {/* ========================================================================= */}
      {/* 9. MODAL RIWAYAT TRANSAKSI, CETAK ULANG & VOID / REFUND                   */}
      {/* ========================================================================= */}
      <ModalDaftarTransaksi
        isOpen={isModalTransaksiOpen}
        onClose={() => setIsModalTransaksiOpen(false)}
        bukaTokoId={statusOperasional?.buka_toko_id}
        cabangNama={cabang?.nama}
      />
    </div>
  );
}
