'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Printer,
  Share2,
  X,
  RotateCcw,
  Loader2,
  AlertCircle,
  Check,
  Receipt,
  Store,
  Clock,
  User,
  ExternalLink,
} from 'lucide-react';
import {
  printReceiptBluetooth,
  formatReceiptDateTime,
  ReceiptDataForPrint,
} from '../utils/printBluetooth';

export interface ModalSuksesTransaksiProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    no_invoice: string;
    urutan: number;
    cabang_nama: string;
    cabang_telepon?: string;
    waktu_transaksi: string;
    waktu_cetak?: string;
    kasir_nama: string;
    nm_costumer?: string;
    no_tlp?: string;
    jenis_order?: string;
    pembayaran_nama?: string;
    items: {
      qty: number;
      nm_produk: string;
      varian_str?: string;
      harga_satuan?: number;
      total_harga: number;
      catatan?: string;
    }[];
    subtotal: number;
    diskon?: number;
    total_bayar: number;
    dibayar: number;
    kembalian: number;
    wa_link?: string;
    is_offline?: boolean;
  } | null;
}

export default function ModalSuksesTransaksi({
  isOpen,
  onClose,
  data,
}: ModalSuksesTransaksiProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const handlePrintBluetooth = async () => {
    try {
      setIsPrinting(true);
      setPrintError(null);
      setPrintSuccess(false);

      const receiptPayload: ReceiptDataForPrint = {
        no_invoice: data.no_invoice,
        urutan: data.urutan,
        cabang_nama: data.cabang_nama,
        cabang_telepon: data.cabang_telepon || '0813-4103-733',
        waktu_transaksi: formatReceiptDateTime(data.waktu_transaksi),
        waktu_cetak: formatReceiptDateTime(data.waktu_cetak),
        kasir_nama: data.kasir_nama,
        nm_costumer: data.nm_costumer || '-',
        jenis_order: data.jenis_order || 'Normal',
        items: data.items,
        subtotal: data.subtotal,
        diskon: data.diskon || 0,
        total_bayar: data.total_bayar,
        dibayar: data.dibayar,
        kembalian: data.kembalian,
      };

      await printReceiptBluetooth(receiptPayload);

      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 4000);
    } catch (err: any) {
      console.error('Gagal cetak Bluetooth:', err);
      setPrintError(err.message || 'Gagal menyambungkan ke printer Bluetooth.');
    } finally {
      setIsPrinting(false);
    }
  };

  const formattedCabang = data.cabang_nama?.toLowerCase().startsWith('cabang')
    ? data.cabang_nama
    : `Cabang ${data.cabang_nama}`;

  const isOfflineTx = !!data.is_offline || data.no_invoice?.startsWith('OFF-');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto transition-colors">
        {/* HEADER MODAL DENGAN STATUS SUKSES / OFFLINE */}
        <div
          className={`p-5 text-white flex items-center justify-between ${
            isOfflineTx
              ? 'bg-gradient-to-r from-amber-600 to-amber-700'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">
                {isOfflineTx ? 'Transaksi Tersimpan Offline!' : 'Transaksi Berhasil Dicatat!'}
              </h2>
              <p className="text-xs text-white/80 font-medium mt-0.5">
                {isOfflineTx ? 'Akan disinkronkan saat online' : `No. Invoice: `}
                {!isOfflineTx && <span className="font-mono font-bold">{data.no_invoice}</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTAINER ISI MODAL */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* BADGE NOMOR ANTRIAN MENCOLOK */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Nomor Antrian Pesanan
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {formattedCabang}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-amber-500/30 border-2 border-amber-300">
              {data.urutan}
            </div>
          </div>

          {/* SIMULASI STRUK KERTAS THERMAL */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 font-mono text-[11px] space-y-1.5 text-slate-700 dark:text-slate-200 shadow-inner">
            {/* Header Nota dengan Logo Resmi Kebab Yasmin */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center">
              <div className="mb-1.5 w-32 py-1 px-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/60 shadow-xs flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-yasmin.png"
                  alt="Logo Kebab Yasmin"
                  className="w-full h-auto max-h-12 object-contain dark:hidden"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-yasmin-dark.png"
                  alt="Logo Kebab Yasmin"
                  className="w-full h-auto max-h-12 object-contain hidden dark:block"
                />
              </div>
              <p className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                {formattedCabang}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Surganya Ngebab!</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{data.cabang_telepon || '0813-4103-733'}</p>
            </div>

            {/* Info Transaksi */}
            <div className="text-[10px] space-y-0.5 py-0.5">
              {data.no_invoice && (
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500">No. Inv:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{data.no_invoice}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Waktu:</span>
                <span>{formatReceiptDateTime(data.waktu_transaksi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Kasir:</span>
                <span className="font-semibold">{data.kasir_nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Costumer:</span>
                <span>{data.nm_costumer || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Jenis Order:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {data.jenis_order || 'Normal'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Antrian:</span>
                <span className="font-bold text-slate-900 dark:text-white">#{data.urutan}</span>
              </div>
            </div>

            {/* Garis Pemisah */}
            <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-1" />

            {/* List Produk */}
            <div className="space-y-1 py-0.5 text-[10px]">
              {data.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-medium">
                    <span className="flex-1 pr-2 truncate">
                      {item.qty} &times; {item.nm_produk}
                    </span>
                    <span className="shrink-0 font-bold">
                      {item.total_harga.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {item.varian_str && (
                    <p className="text-[9px] text-amber-700 dark:text-amber-400 pl-3">
                      + {item.varian_str}
                    </p>
                  )}
                  {item.catatan && (
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 italic pl-3">
                      &ldquo;{item.catatan}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Garis Pemisah */}
            <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-1" />

            {/* Total Pembayaran */}
            <div className="space-y-0.5 pt-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Subtotal ({data.items.reduce((s, i) => s + i.qty, 0)} item):</span>
                <span>Rp {data.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {data.diskon && data.diskon > 0 ? (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Diskon:</span>
                  <span>-Rp {data.diskon.toLocaleString('id-ID')}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-xs font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Total Pembayaran:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  Rp {data.total_bayar.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Dibayar:</span>
                <span className="font-mono">Rp {data.dibayar.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                <span>Kembalian:</span>
                <span className="font-mono">Rp {data.kembalian.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Footer Nota */}
            <div className="text-center pt-1.5 border-t border-dashed border-slate-300 dark:border-slate-600 text-[9px] text-slate-400 dark:text-slate-500">
              <p>Instagram: @kebabyasmin.id | Youtube: kebabyasmin</p>
              <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">*** LUNAS / TERBAYAR ***</p>
            </div>
          </div>

          {/* STATUS NOTIFIKASI CETAK BLUETOOTH */}
          {printSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Struk berhasil dikirim ke printer Bluetooth!</span>
            </div>
          )}

          {printError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{printError}</span>
            </div>
          )}

          {/* AKSI TOMBOL UTAMA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {/* 1. TOMBOL CETAK STRUK BLUETOOTH */}
            <button
              type="button"
              onClick={handlePrintBluetooth}
              disabled={isPrinting}
              className={`h-12 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isPrinting
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 active:scale-95'
              }`}
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghubungkan...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Cetak Struk (Bluetooth)</span>
                </>
              )}
            </button>

            {/* 2. TOMBOL WHATSAPP */}
            {data.wa_link ? (
              <a
                href={data.wa_link}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/25 active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim Nota (WhatsApp)</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ) : (
              <div
                title="Nomor telepon pelanggan tidak diinput"
                className="h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200 dark:border-slate-700"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp (Tanpa No. HP)</span>
              </div>
            )}
          </div>

          {/* 3. TOMBOL SELESAI & TRANSAKSI BARU */}
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>SELESAI & TRANSAKSI BARU</span>
          </button>
        </div>
      </div>
    </div>
  );
}
