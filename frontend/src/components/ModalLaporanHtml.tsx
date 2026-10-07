import React from 'react';
import { X, Printer } from 'lucide-react';
import { LaporanEodDataForPrint } from '@/utils/printBluetooth';

interface ModalLaporanHtmlProps {
  isOpen: boolean;
  onClose: () => void;
  data: LaporanEodDataForPrint | null;
}

export default function ModalLaporanHtml({ isOpen, onClose, data }: ModalLaporanHtmlProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 print:w-full print:max-w-none print:h-auto print:border-none print:shadow-none print:rounded-none">
        {/* Header Modal (Tidak di-print) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 print:hidden">
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-800 dark:text-white">Preview Laporan Toko</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="w-10 h-10 sm:w-auto sm:px-4 sm:py-2.5 rounded-full sm:rounded-xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print (PDF/Kertas)</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Konten Laporan (Di-print) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-black print:overflow-visible print:p-0 print:text-black" id="printable-report">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Kop Laporan */}
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold uppercase">{data.cabang_nama}</h1>
              <p className="text-sm">Buka dari {data.waktu_buka}</p>
              <p className="text-sm">Sampai {data.waktu_tutup}</p>
              
              {data.ket_kebutuhan && (
                <div className="mt-4">
                  <h3 className="font-bold text-red-600">Kebutuhan:</h3>
                  <p className="text-sm font-semibold whitespace-pre-line">{data.ket_kebutuhan}</p>
                </div>
              )}
            </div>

            {/* Tabel Penjualan, Pengeluaran, Kas */}
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs sm:text-sm text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={5} className="border border-black p-1.5 font-bold">Laporan Penjualan</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1.5 font-bold">Jenis Order</th>
                    <th className="border border-black p-1.5 font-bold">Jenis Pembayaran</th>
                    <th className="border border-black p-1.5 font-bold">Jumlah Transaksi</th>
                    <th className="border border-black p-1.5 font-bold">Produk Terjual</th>
                    <th className="border border-black p-1.5 font-bold">Total Penjualan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.laporan_penjualan.length > 0 ? (
                    data.laporan_penjualan.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-1.5">{item.delivery_nama}</td>
                        <td className="border border-black p-1.5">{item.pembayaran_nama}</td>
                        <td className="border border-black p-1.5">{item.total_transaksi}</td>
                        <td className="border border-black p-1.5">-</td>
                        <td className="border border-black p-1.5 text-right">{item.total_penjualan.toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="border border-black p-1.5 italic">Tidak ada transaksi</td></tr>
                  )}
                  {/* Row Total Penjualan */}
                  <tr className="font-bold">
                    <td colSpan={4} className="border border-black p-1.5">Total</td>
                    <td className="border border-black p-1.5 text-right">
                      {data.laporan_penjualan.reduce((sum, item) => sum + item.total_penjualan, 0).toLocaleString('id-ID')}
                    </td>
                  </tr>

                  {/* Laporan Pengeluaran */}
                  <tr className="bg-gray-100">
                    <th colSpan={5} className="border border-black p-1.5 font-bold">Laporan Pengeluaran</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th colSpan={3} className="border border-black p-1.5 font-bold">Jenis</th>
                    <th colSpan={2} className="border border-black p-1.5 font-bold">Total</th>
                  </tr>
                  <tr>
                    <td colSpan={3} className="border border-black p-1.5">Kebutuhan</td>
                    <td colSpan={2} className="border border-black p-1.5 text-right">
                      Rp. {data.laporan_kas_bersih.total_pengeluaran_kebutuhan.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  {/* Laporan Kas */}
                  <tr className="bg-gray-100">
                    <th colSpan={5} className="border border-black p-1.5 font-bold">Laporan Kas</th>
                  </tr>
                  <tr>
                    <td colSpan={3} className="border border-black p-1.5 text-left pl-2">Total Cash (Termasuk Modal)</td>
                    <td colSpan={2} className="border border-black p-1.5 text-right">
                      Rp. {data.laporan_kas_bersih.total_penjualan_cash.toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr className="font-bold">
                    <td colSpan={3} className="border border-black p-1.5 text-left pl-2">Sisa Cash (Kas Bersih)</td>
                    <td colSpan={2} className="border border-black p-1.5 text-right">
                      Rp. {data.laporan_kas_bersih.kas_bersih.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tabel Detail Produk Terjual */}
            <div className="w-full overflow-x-auto mt-6">
              <table className="w-full border-collapse border border-black text-xs sm:text-sm text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={4} className="border border-black p-1.5 font-bold">Detail Perproduk</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1.5 font-bold">Produk</th>
                    <th className="border border-black p-1.5 font-bold">Order</th>
                    <th className="border border-black p-1.5 font-bold">Terjual</th>
                    <th className="border border-black p-1.5 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.detail_produk_terjual.length > 0 ? (
                    data.detail_produk_terjual.map((prod, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-1.5 text-left uppercase">{prod.nm_produk}</td>
                        <td className="border border-black p-1.5 uppercase">{prod.delivery_nama}</td>
                        <td className="border border-black p-1.5">{prod.qty_terjual}</td>
                        <td className="border border-black p-1.5 text-right">Rp. {prod.total_uang.toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="border border-black p-1.5 italic">Tidak ada produk terjual</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tabel Barang Bawaan */}
            <div className="w-full overflow-x-auto mt-6">
              <table className="w-full border-collapse border border-black text-xs sm:text-sm text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th colSpan={4} className="border border-black p-1.5 font-bold">Laporan Barang Bawaan</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1.5 font-bold">Barang</th>
                    <th className="border border-black p-1.5 font-bold">Stok Awal</th>
                    <th className="border border-black p-1.5 font-bold">Terjual</th>
                    <th className="border border-black p-1.5 font-bold">Stok Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {data.laporan_barang_bawaan.length > 0 ? (
                    data.laporan_barang_bawaan.map((brg, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-1.5 text-left">{brg.nm_bahan}</td>
                        <td className="border border-black p-1.5">{brg.masuk} {brg.satuan}</td>
                        <td className="border border-black p-1.5">{brg.keluar} {brg.satuan}</td>
                        <td className="border border-black p-1.5">{brg.sisa_fisik} {brg.satuan}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="border border-black p-1.5 italic">Tidak ada data stok</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Style for printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}} />
    </div>
  );
}
