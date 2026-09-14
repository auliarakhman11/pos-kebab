'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Store, LogOut, CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';

export default function KasirPage() {
  const router = useRouter();
  const { user, cabang, logout, initAuth } = useAuthStore();
  const [storeStatus, setStoreStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
    const checkStatus = async () => {
      try {
        const res = await api.get('/status-toko');
        if (res.data?.success) {
          setStoreStatus(res.data.data);
          if (!res.data.data?.is_open) {
            router.replace('/buka-toko');
          }
        }
      } catch (err) {
        console.error('Failed to fetch store status:', err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [router, initAuth]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-10">
              <Image
                src="/logo-yasmin.png"
                alt="Yasmin Kebab"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cabang</span>
              <span className="text-sm font-bold text-slate-800">{cabang?.nama || 'Kebab Yasmin'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Toko BUKA (Shift Aktif)
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Toko Berhasil Dibuka!</h1>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            Sesi operasional shift hari ini telah aktif. Anda siap melayani pelanggan Kebab Yasmin.
          </p>

          {storeStatus && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Kode Shift:</span>
                <span className="font-mono font-bold text-slate-700">{storeStatus.kode || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Karyawan Jaga:</span>
                <span className="font-bold text-slate-700">{storeStatus.nm_karyawan || user?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Buka:</span>
                <span className="font-bold text-slate-700">
                  {storeStatus.buka ? new Date(storeStatus.buka).toLocaleTimeString('id-ID') : '-'}
                </span>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 font-medium text-left mb-6 flex items-start gap-3">
            <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Modul 3: Halaman Kasir POS Modern</p>
              <p className="mt-0.5 text-amber-700">
                Fitur katalog menu, varian produk, keranjang, transaksi penjualan, dan cetak struk bluetooth akan segera aktif di modul selanjutnya.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
