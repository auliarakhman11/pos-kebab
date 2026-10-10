'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  X,
  Check,
  Loader2,
  AlertCircle,
  Search,
  UserCheck,
  Camera,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';

interface Karyawan {
  id: number;
  nama: string;
  kota_id?: number;
}

export interface KaryawanSesiItem {
  id?: number;
  karyawan_id: number;
  nama?: string;
  ganti?: number;
  foto?: string | null;
}

interface ModalGantiShiftProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentKaryawanIds?: number[];
  bukaTokoId?: number | null;
  karyawanSesiIni?: KaryawanSesiItem[];
}

export default function ModalGantiShift({
  isOpen,
  onClose,
  onSuccess,
  currentKaryawanIds = [],
  bukaTokoId,
  karyawanSesiIni = [],
}: ModalGantiShiftProps) {
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // State Foto Selfie per Karyawan: Map karyawan_id -> Base64 / URL path
  const [selfieMap, setSelfieMap] = useState<Record<number, string>>({});

  // Penanda apakah foto berasal dari data Buka Toko (existing) atau baru dijepret ulang
  const [isExistingPhoto, setIsExistingPhoto] = useState<Record<number, boolean>>({});

  // State Modal Kamera Live Viewfinder
  const [activeCameraKaryawan, setActiveCameraKaryawan] = useState<Karyawan | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string>('');

  // Refs Kamera & Fallback Native HP
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeFileInputRef = useRef<HTMLInputElement | null>(null);

  // Load master karyawan aktif saat modal dibuka & inisialisasi foto yang sudah ada
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setSearchQuery('');
    setSelectedIds(currentKaryawanIds.length > 0 ? [...currentKaryawanIds] : []);
    setActiveCameraKaryawan(null);
    setCapturedSnapshot('');

    // Inisialisasi foto dari sesi buka toko saat ini (jika pegawai sudah selfie saat buka toko)
    const initialSelfieMap: Record<number, string> = {};
    const initialExistingMap: Record<number, boolean> = {};

    if (Array.isArray(karyawanSesiIni)) {
      for (const item of karyawanSesiIni) {
        if (item.foto && typeof item.foto === 'string') {
          initialSelfieMap[item.karyawan_id] = item.foto;
          initialExistingMap[item.karyawan_id] = true;
        }
      }
    }

    setSelfieMap(initialSelfieMap);
    setIsExistingPhoto(initialExistingMap);

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
  }, [isOpen, currentKaryawanIds, karyawanSesiIni]);

  // Bersihkan stream kamera saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelectKaryawan = (id: number) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const filteredList = karyawanList.filter((k) =>
    k.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Buka Modal Kamera Live untuk Selfie Karyawan Terpilih
  const openCameraModal = async (karyawan: Karyawan) => {
    setActiveCameraKaryawan(karyawan);
    setCapturedSnapshot('');
    setErrorMsg(null);

    // Otomatis pastikan karyawan masuk dalam daftar terpilih
    if (!selectedIds.includes(karyawan.id)) {
      setSelectedIds((prev) => [...prev, karyawan.id]);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Kamera depan HP / Webcam laptop
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
      console.warn('getUserMedia gagal diakses langsung, memicu input kamera native HP:', err);
      // Fallback ke input capture kamera native HP
      nativeFileInputRef.current?.click();
    }
  };

  // Tutup Modal Kamera & Bersihkan Video Stream
  const closeCameraModal = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setActiveCameraKaryawan(null);
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
        // Balikkan gambar horizontal agar hasil foto tidak mirror
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedSnapshot(dataUrl);

        // Hentikan stream kamera saat snapshot sudah tertangkap
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      }
    }
  };

  // Konfirmasi & Gunakan Foto Snapshot Baru
  const confirmCapturedPhoto = () => {
    if (!capturedSnapshot || !activeCameraKaryawan) return;

    setSelfieMap((prev) => ({
      ...prev,
      [activeCameraKaryawan.id]: capturedSnapshot,
    }));

    // Ditandai sebagai foto baru (bukan foto lama)
    setIsExistingPhoto((prev) => ({
      ...prev,
      [activeCameraKaryawan.id]: false,
    }));

    closeCameraModal();
  };

  // Ulangi Pengambilan Foto (Start Camera Kembali)
  const restartCamera = async () => {
    setCapturedSnapshot('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
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
      console.error('Gagal restart kamera:', err);
    }
  };

  // Handler Fallback Kamera Native File Input (HP)
  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCameraKaryawan) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setSelfieMap((prev) => ({
          ...prev,
          [activeCameraKaryawan.id]: base64,
        }));
        setIsExistingPhoto((prev) => ({
          ...prev,
          [activeCameraKaryawan.id]: false,
        }));
        closeCameraModal();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Hitung Karyawan Terpilih yang Belum Memiliki Foto Selfie
  const missingSelfieIds = selectedIds.filter((id) => !selfieMap[id]);
  const isAllSelfieReady = selectedIds.length > 0 && missingSelfieIds.length === 0;

  // Submit Simpan Pergantian Shift
  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg('Pilih minimal satu karyawan untuk shift baru.');
      return;
    }

    if (missingSelfieIds.length > 0) {
      setErrorMsg(
        `Masih ada ${missingSelfieIds.length} petugas yang belum memiliki foto selfie wajah. Semua petugas shift baru wajib berselfie.`
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        buka_toko_id: bukaTokoId || undefined,
        karyawan_baru: selectedIds.map((id) => ({
          karyawan_id: id,
          // Jika menggunakan foto lama buka toko, kirim null dan is_ganti_foto = false
          // Jika mengambil foto baru, kirim string base64 dan is_ganti_foto = true
          foto: isExistingPhoto[id] ? null : selfieMap[id],
          is_ganti_foto: !isExistingPhoto[id],
        })),
        karyawan_baru_ids: selectedIds,
      };

      const res = await api.post('/ganti-shift', payload);

      if (res.data?.success) {
        setSuccessMsg('Pergantian shift & status petugas berhasil disimpan!');
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
    <>
      {/* Hidden Fallback Input Kamera Native HP */}
      <input
        ref={nativeFileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleNativeFileChange}
        className="hidden"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
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
                  Pilih petugas shift baru. Petugas yang sudah selfie saat Buka Toko otomatis menggunakan foto yang tersimpan.
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
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 font-semibold animate-in fade-in">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* PANDUAN EFISIENSI FOTO & ABSENSI */}
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <Camera className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Mekanisme Foto & Jam Absen:</span>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 mt-0.5 leading-relaxed">
                  Pegawai yang sudah berselfie saat Buka Toko otomatis siap tanpa perlu selfie ulang. Petugas baru wajib mengambil selfie wajah.
                </p>
              </div>
            </div>

            {/* SEARCH BOX */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama karyawan..."
                className="w-full h-10 pl-9 pr-4 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* DAFTAR KARYAWAN */}
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                <span className="text-xs font-semibold">Memuat daftar karyawan...</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                {searchQuery
                  ? `Tidak ada karyawan bernama "${searchQuery}"`
                  : 'Tidak ada karyawan aktif ditemukan'}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredList.map((karyawan) => {
                  const isSelected = selectedIds.includes(karyawan.id);
                  const hasSelfie = Boolean(selfieMap[karyawan.id]);
                  const selfieImg = selfieMap[karyawan.id];
                  const isExisting = Boolean(isExistingPhoto[karyawan.id]);

                  return (
                    <div
                      key={karyawan.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? hasSelfie
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/70 shadow-xs'
                            : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 shadow-xs'
                          : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* INFORMASI KARYAWAN & CHECKBOX */}
                      <div
                        onClick={() => toggleSelectKaryawan(karyawan.id)}
                        className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                      >
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>

                        {/* Thumbnail Foto Selfie Jika Sudah Diambil */}
                        {hasSelfie ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0 shadow-xs bg-slate-100">
                            <img
                              src={selfieImg}
                              alt={karyawan.nama}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <Users className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                            {karyawan.nama}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            ID: #{karyawan.id} • Role: MS / Anggota
                          </span>
                        </div>
                      </div>

                      {/* AREA SELFIE STATUS & TOMBOL AMBIL SELFIE */}
                      {isSelected && (
                        <div className="flex items-center gap-2 pl-9 sm:pl-0 shrink-0">
                          {hasSelfie ? (
                            <>
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>{isExisting ? 'Foto Buka Toko' : 'Selfie Siap'}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCameraModal(karyawan);
                                }}
                                className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs hover:text-amber-600"
                                title="Ambil Ulang Selfie"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Foto Ulang</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCameraModal(karyawan);
                              }}
                              className="h-8.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 animate-pulse"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Ambil Selfie</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* STATUS REKAP PEMILIHAN & KESIAPAN SELFIE */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                <span>Petugas Terpilih:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-lg">
                  {selectedIds.length} Orang
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">Status Selfie:</span>
                {selectedIds.length === 0 ? (
                  <span className="text-[11px] text-slate-400 font-semibold">Belum ada pilihan</span>
                ) : isAllSelfieReady ? (
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Semua Selfie Lengkap ({selectedIds.length})
                  </span>
                ) : (
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-lg">
                    {missingSelfieIds.length} Belum Selfie
                  </span>
                )}
              </div>
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
              disabled={submitting || !isAllSelfieReady}
              className={`h-10 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                !isAllSelfieReady || submitting
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
                  <span>
                    Simpan Pergantian Shift
                    {selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP OVERLAY: VIEWFINDER KAMERA LIVE UNTUK SELFIE PETUGAS                */}
      {/* ========================================================================= */}
      {activeCameraKaryawan && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Header Popup Kamera */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span>Selfie: {activeCameraKaryawan.nama}</span>
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Arahkan wajah ke kamera depan HP / Webcam.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCameraModal}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewfinder Video / Snapshot Preview */}
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 mb-4 flex items-center justify-center shadow-inner">
              {capturedSnapshot ? (
                <img
                  src={capturedSnapshot}
                  alt="Snapshot Selfie"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              )}

              {/* Status Badge */}
              {capturedSnapshot && (
                <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Foto Berhasil Dijepret</span>
                </div>
              )}
            </div>

            {/* Shutter Kontrol */}
            <div className="flex items-center gap-2.5">
              {!capturedSnapshot ? (
                <button
                  type="button"
                  onClick={captureLivePhoto}
                  className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 tracking-wide"
                >
                  <Camera className="w-4 h-4" />
                  <span>JEPRET SELFIE SEKARANG</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={restartCamera}
                    className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
    </>
  );
}
