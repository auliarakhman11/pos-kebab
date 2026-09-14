'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronDown,
  UserCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import axios from 'axios';
import useAuthStore from '@/store/authStore';
import { useTheme } from '@/lib/theme';

interface KasirOption {
  id: number;
  name: string;
  username: string;
  cabang_id: number;
  cabang: {
    id: number;
    nama: string;
    kota_id: number;
    off: number;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { theme, toggleTheme } = useTheme();

  const [kasirList, setKasirList] = useState<KasirOption[]>([]);
  const [loadingKasirList, setLoadingKasirList] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ambil daftar user kasir dari cabang yang aktif (cabang.off = 0)
  useEffect(() => {
    const fetchKasirList = async () => {
      try {
        setLoadingKasirList(true);
        const res = await axios.get('http://localhost:5000/api/kasir-list');
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setKasirList(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedUsername(res.data.data[0].username);
          }
        }
      } catch (err) {
        console.error('Failed to load kasir list:', err);
        setErrorMessage('Gagal memuat daftar kasir dari server backend. Pastikan server aktif di port 5000.');
      } finally {
        setLoadingKasirList(false);
      }
    };

    fetchKasirList();
  }, []);

  const selectedKasir = kasirList.find((k) => k.username === selectedUsername);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedUsername || !password) {
      setErrorMessage('Silakan pilih akun kasir dan masukkan kata sandi.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username: selectedUsername,
        password,
      });

      if (response.data?.success && response.data?.data) {
        const { accessToken, refreshToken, user, cabang } = response.data.data;

        // Simpan ke Zustand & Cookies
        setAuth({
          user,
          cabang,
          accessToken,
          refreshToken,
        });

        setSuccessMessage(`Login berhasil! Selamat bertugas di Cabang ${cabang?.nama || ''}. Mengarahkan ke Buka Toko...`);

        setTimeout(() => {
          router.push('/buka-toko');
        }, 800);
      } else {
        setErrorMessage(response.data?.message || 'Gagal login. Silakan periksa kembali kata sandi Anda.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const serverMessage =
        err.response?.data?.message ||
        'Gagal terhubung ke server backend (port 5000). Pastikan backend sedang berjalan.';
      setErrorMessage(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans transition-colors">
      {/* Tombol Toggle Theme Light / Dark di pojok kanan atas */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
          className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs backdrop-blur-xs"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Decorative Warm Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header with Official Logo (Beralih otomatis saat Dark Mode) */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative w-64 h-28 mb-1 drop-shadow-sm hover:scale-105 transition-transform duration-300">
            <Image
              src={theme === 'dark' ? '/logo-yasmin-dark.png' : '/logo-yasmin.png'}
              alt="Yasmin Kebab - Surganya Ngebab"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-xs">
            Kasir kebab yasmin
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/70 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800 transition-colors">
          <div className="mb-6">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Masuk Akun Kasir</h2>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-rose-700 dark:text-rose-400 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-start gap-3 text-emerald-700 dark:text-emerald-400 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium leading-relaxed">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dropdown Pemilihan User Kasir */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Pilih Outlet / Kasir</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
                  <UserCircle2 className="w-5 h-5" />
                </div>
                <select
                  value={selectedUsername}
                  onChange={(e) => setSelectedUsername(e.target.value)}
                  disabled={loadingKasirList || loading}
                  className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  required
                >
                  {loadingKasirList ? (
                    <option value="">Memuat daftar kasir...</option>
                  ) : kasirList.length === 0 ? (
                    <option value="">Tidak ada kasir aktif</option>
                  ) : (
                    kasirList.map((k) => (
                      <option key={k.id} value={k.username}>
                        {k.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  {loadingKasirList ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>

            {/* Input Kata Sandi */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi kasir"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full h-12 pl-11 pr-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 transition-all font-medium disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || loadingKasirList || kasirList.length === 0}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memverifikasi Kata Sandi...</span>
                  </>
                ) : (
                  <span>Masuk Kasir</span>
                )}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Sistem POS & ERP Kebab Yasmin &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
