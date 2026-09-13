'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import useAuthStore from '@/store/authStore';

export default function BukaTokoPage() {
  const router = useRouter();
  const { user, cabang, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center">
        <div className="relative w-48 h-20 mx-auto mb-4">
          <Image
            src="/logo-yasmin.png"
            alt="Yasmin Kebab"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-black text-slate-800">Form Buka Toko</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Selamat datang di portal operasional shift,{' '}
          <span className="font-bold text-slate-700">{user?.name || 'Kasir'}</span>!
        </p>

        <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs space-y-2 mb-6 border border-slate-100">
          <div>
            <span className="text-slate-400">Cabang:</span>{' '}
            <span className="font-bold text-slate-700">{cabang?.nama || '-'}</span>
          </div>
          <div>
            <span className="text-slate-400">Username:</span>{' '}
            <span className="font-bold text-slate-700">{user?.username || '-'}</span>
          </div>
          <div>
            <span className="text-slate-400">Status Toko:</span>{' '}
            <span className="font-bold text-amber-600">Menunggu Input Barang Bawaan & Foto Shift</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full h-11 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sesi (Logout)</span>
        </button>
      </div>
    </div>
  );
}
