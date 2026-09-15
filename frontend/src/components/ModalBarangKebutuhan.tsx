'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  X,
  Check,
  Loader2,
  AlertCircle,
  Receipt,
  Package,
  Search,
  ChevronDown,
} from 'lucide-react';
import api from '@/lib/api';

interface MasterBarang {
  id: number;
  nm_barang: string;
  harga?: number;
  satuan?: {
    id: number;
    satuan: string;
  };
}

interface FormRow {
  id: string;
  barang_id: number | '';
  qty: number | '';
}

interface KebutuhanItem {
  id: number;
  kd_gabungan: string;
  barang_id: number;
  nm_barang: string;
  qty: number;
  harga_satuan: number;
  total_harga: number;
  tgl: string;
}

interface ModalBarangKebutuhanProps {
  isOpen: boolean;
  onClose: () => void;
  bukaTokoId?: number | null;
}

// Searchable Select untuk Barang Kebutuhan dengan filter pencarian instan
function SearchableBarangSelect({
  value,
  onChange,
  barangList,
  placeholder = '-- Cari / Pilih Barang Kebutuhan --',
}: {
  value: number | '';
  onChange: (id: number | '') => void;
  barangList: MasterBarang[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = barangList.find((b) => b.id === value);

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
      {/* Hidden input for HTML5 standard required validation */}
      <input
        type="text"
        value={value ? String(value) : ''}
        required
        readOnly
        tabIndex={-1}
        className="opacity-0 absolute pointer-events-none w-0 h-0 bottom-0 left-0"
        aria-hidden="true"
      />

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
            ? `${selectedItem.nm_barang}${selectedItem.satuan ? ` (${selectedItem.satuan.satuan})` : ''}`
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
                const isSelected = item.id === value;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onChange(item.id);
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
                    {item.satuan && (
                      <span className={`text-[10px] ml-1 shrink-0 ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
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

export default function ModalBarangKebutuhan({
  isOpen,
  onClose,
  bukaTokoId,
}: ModalBarangKebutuhanProps) {
  // Master barang dropdown
  const [masterBarangList, setMasterBarangList] = useState<MasterBarang[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // Form rows
  const [rows, setRows] = useState<FormRow[]>([
    { id: 'row-1', barang_id: '', qty: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Riwayat kebutuhan tersimpan
  const [kebutuhanList, setKebutuhanList] = useState<KebutuhanItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingKd, setDeletingKd] = useState<string | null>(null);

  // Fetch master barang & riwayat kebutuhan saat modal terbuka
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setRows([{ id: `row-${Date.now()}`, barang_id: '', qty: '' }]);

    const fetchMaster = async () => {
      setLoadingMaster(true);
      try {
        const res = await api.get('/kebutuhan/barang');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setMasterBarangList(res.data.data);
        }
      } catch (err: any) {
        console.error('Gagal mengambil master barang kebutuhan:', err);
      } finally {
        setLoadingMaster(false);
      }
    };

    fetchMaster();
    fetchRiwayat();
  }, [isOpen]);

  const fetchRiwayat = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/kebutuhan');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setKebutuhanList(res.data.data);
      } else {
        setKebutuhanList([]);
      }
    } catch (err: any) {
      console.error('Gagal mengambil riwayat kebutuhan:', err);
    } finally {
      setLoadingList(false);
    }
  };

  if (!isOpen) return null;

  // Handler tambah & hapus baris input
  const handleAddRow = () => {
    setRows((prev) => [...prev, { id: `row-${Date.now()}`, barang_id: '', qty: '' }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleChangeRow = (id: string, field: 'barang_id' | 'qty', value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Submit form kebutuhan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validasi baris
    if (rows.length === 0) {
      setErrorMsg('Tambahkan minimal 1 baris barang kebutuhan.');
      return;
    }

    const hasEmptyBarang = rows.some((r) => r.barang_id === '');
    if (hasEmptyBarang) {
      setErrorMsg('Pilih barang kebutuhan di semua baris input.');
      return;
    }

    const hasEmptyQty = rows.some((r) => !r.qty || Number(r.qty) <= 0);
    if (hasEmptyQty) {
      setErrorMsg('Isi jumlah (qty) minimal 1 di semua baris input.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        buka_toko_id: bukaTokoId || undefined,
        items: rows.map((r) => ({
          barang_id: Number(r.barang_id),
          qty: Number(r.qty),
        })),
      };

      const res = await api.post('/kebutuhan', payload);

      if (res.data?.success) {
        setSuccessMsg('Barang kebutuhan berhasil dicatat ke jurnal akuntansi!');
        // Reset form ke 1 baris kosong
        setRows([{ id: `row-${Date.now()}`, barang_id: '', qty: '' }]);
        // Refresh tabel riwayat
        await fetchRiwayat();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.data?.message || 'Gagal menyimpan barang kebutuhan.');
      }
    } catch (err: any) {
      console.error('Error addKebutuhan:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat menyimpan barang kebutuhan.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus baris kebutuhan (DELETE /api/kebutuhan/:kd_gabungan)
  const handleDeleteItem = async (kdGabungan: string, nmBarang: string) => {
    if (!confirm(`Hapus pencatatan kebutuhan "${nmBarang}" (${kdGabungan})?\nSepasang jurnal debit dan kredit akan dihapus bersih.`)) {
      return;
    }

    setDeletingKd(kdGabungan);
    try {
      const res = await api.delete(`/kebutuhan/${encodeURIComponent(kdGabungan)}`);
      if (res.data?.success) {
        setSuccessMsg(`Jurnal kebutuhan ${kdGabungan} berhasil dihapus.`);
        await fetchRiwayat();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.data?.message || 'Gagal menghapus jurnal kebutuhan.');
      }
    } catch (err: any) {
      console.error('Error deleteKebutuhan:', err);
      setErrorMsg(err.response?.data?.message || 'Gagal menghapus jurnal kebutuhan.');
    } finally {
      setDeletingKd(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* HEADER MODAL */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Input Barang Kebutuhan Outlet</span>
              </h3>
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
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* ALERT NOTIFIKASI */}
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

          {/* BAGIAN 1: FORM INPUT DINAMIS */}
          <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                Tambah Kebutuhan Baru
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {rows.map((row, idx) => (
                <div key={row.id} className="flex items-center gap-2">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">
                    {idx + 1}.
                  </span>

                  {/* SEARCHABLE SELECT BARANG */}
                  <SearchableBarangSelect
                    value={row.barang_id}
                    onChange={(selectedId) =>
                      handleChangeRow(row.id, 'barang_id', selectedId)
                    }
                    barangList={masterBarangList}
                    placeholder="-- Cari / Pilih Barang Kebutuhan --"
                  />

                  {/* INPUT QTY */}
                  <div className="w-28 sm:w-32">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Jumlah (Qty)"
                      value={row.qty}
                      onChange={(e) =>
                        handleChangeRow(
                          row.id,
                          'qty',
                          e.target.value ? Number(e.target.value) : ''
                        )
                      }
                      className="w-full h-10 px-3 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100"
                      required
                    />
                  </div>

                  {/* TOMBOL HAPUS BARIS */}
                  <button
                    type="button"
                    disabled={rows.length <= 1}
                    onClick={() => handleRemoveRow(row.id)}
                    className="w-9 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || loadingMaster}
                className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Jurnal...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan Barang Kebutuhan</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* BAGIAN 2: LIST DATA KEBUTUHAN TERINPUT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-500" />
                Daftar Kebutuhan Sesi Buka Toko Ini ({kebutuhanList.length})
              </h4>
              <button
                type="button"
                onClick={fetchRiwayat}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                Refresh Data
              </button>
            </div>

            {loadingList ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-1" />
                <span className="text-xs">Memuat riwayat...</span>
              </div>
            ) : kebutuhanList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Package className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-1.5" />
                <span>Belum ada barang kebutuhan yang dicatat pada sesi buka toko ini.</span>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Barang</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                        <th className="py-2.5 px-3 text-right">Total Debit</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {kebutuhanList.map((item, index) => {
                        const isDeleting = deletingKd === item.kd_gabungan;
                        return (
                          <tr key={item.kd_gabungan} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-semibold">{index + 1}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                {item.nm_barang}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {item.kd_gabungan}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                              {item.qty}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                              Rp {item.harga_satuan.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-amber-600 dark:text-amber-400">
                              Rp {item.total_harga.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteItem(item.kd_gabungan, item.nm_barang)}
                                className="h-8 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
                                title="Hapus pencatatan kebutuhan ini"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Hapus</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
