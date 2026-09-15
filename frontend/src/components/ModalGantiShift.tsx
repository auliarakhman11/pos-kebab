'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  Check,
  Loader2,
  AlertCircle,
  Search,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';

interface Karyawan {
  id: number;
  nama: string;
  kota_id?: number;
}

interface ModalGantiShiftProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentKaryawanIds?: number[];
  bukaTokoId?: number | null;
}

export default function ModalGantiShift({
  isOpen,
  onClose,
  onSuccess,
  currentKaryawanIds = [],
  bukaTokoId,
}: ModalGantiShiftProps) {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load master karyawan aktif saat modal terbuka
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setSearchQuery('');
    setSelectedIds(currentKaryawanIds.length > 0 ? [...currentKaryawanIds] : []);

    const fetchKaryawan = async () => {
      setLoading(true);
      try {
        const res = await api.get('/karyawan');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setKaryawanList(res.data.data);
        } else {
          setKaryawanList([]);
        }
      } catch (err: any) {
        console.error('Gagal mengambil daftar karyawan:', err);
        setErrorMsg('Gagal memuat daftar karyawan dari server.');
      } finally {
        setLoading(false);
      }
    };

    fetchKaryawan();
  }, [isOpen, currentKaryawanIds]);

  if (!isOpen) return null;

  const toggleSelectKaryawan = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((k) => k.id));
    }
  };

  const filteredList = karyawanList.filter((k) =>
    k.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg('Pilih minimal satu karyawan untuk shift baru.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        buka_toko_id: bukaTokoId || undefined,
        karyawan_baru_ids: selectedIds,
      };

      const res = await api.post('/ganti-shift', payload);

      if (res.data?.success) {
        setSuccessMsg('Pergantian shift berhasil disimpan!');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.data?.message || 'Gagal memproses pergantian shift.');
      }
    } catch (err: any) {
      console.error('Error gantiShift:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memproses pergantian shift.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* HEADER MODAL */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Pergantian Shift Petugas</span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Pilih satu atau lebih karyawan yang bertugas pada shift saat ini.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY MODAL */}
        <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* NOTIFIKASI ERROR / SUKSES */}
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SEARCH BOX & SELECT ALL */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama karyawan..."
                className="w-full h-10 pl-9 pr-4 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100"
              />
            </div>
            {karyawanList.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap transition-colors"
              >
                {selectedIds.length === filteredList.length ? 'Batal Semua' : 'Pilih Semua'}
              </button>
            )}
          </div>

          {/* DAFTAR KARYAWAN */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
              <span className="text-xs font-semibold">Memuat daftar karyawan...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              {searchQuery ? `Tidak ada karyawan bernama "${searchQuery}"` : 'Tidak ada karyawan aktif ditemukan'}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredList.map((karyawan) => {
                const isSelected = selectedIds.includes(karyawan.id);
                return (
                  <div
                    key={karyawan.id}
                    onClick={() => toggleSelectKaryawan(karyawan.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {isSelected ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                          {karyawan.nama}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          ID: #{karyawan.id} • Role: MS / Anggota
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STATUS PEMILIHAN */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Petugas Terpilih:</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg">
              {selectedIds.length} Orang
            </span>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedIds.length === 0}
            className={`h-10 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              selectedIds.length === 0 || submitting
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25 active:scale-95'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Shift...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Pergantian Shift ({selectedIds.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
