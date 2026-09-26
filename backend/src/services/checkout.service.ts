import prisma from '../prisma';
import { CheckoutRequestDto, CheckoutSuccessResponseData, CheckoutReceiptItem } from '../types/checkout.types';
import { getZonaWaktu, formatReceiptDate } from '../utils/fileHelper';

export class CheckoutService {
  /**
   * Memproses transaksi checkout kasir dengan transaksi atomik ($transaction)
   */
  async prosesCheckout(
    cabangId: number,
    adminId: number,
    payload: CheckoutRequestDto
  ): Promise<CheckoutSuccessResponseData> {
    const {
      pelanggan,
      delivery_id,
      pembayaran_id,
      diskon: overallDiskonInput,
      nominal_bayar: nominalBayarInput,
      items,
      buka_toko,
    } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      const error: any = new Error('Keranjang belanja kosong. Pilih produk terlebih dahulu.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Ambil Informasi Cabang & Kasir yang Sedang Login
    const cabang = await prisma.cabang.findUnique({
      where: { id: cabangId },
    });

    if (!cabang) {
      const error: any = new Error('Cabang tidak valid atau tidak ditemukan.');
      error.statusCode = 400;
      throw error;
    }

    const kotaId = cabang.kota_id || 0;

    // Ambil data kasir untuk mendeteksi zona waktu (Asia/Jakarta = WIB atau Asia/Makassar = WITA)
    const userKasir = await prisma.usersKasir.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, time_zone: true },
    });

    const effectiveTimeZone = userKasir?.time_zone || cabang.time_zone || 'Asia/Makassar';
    const { zonaWaktu, dateStr } = getZonaWaktu(effectiveTimeZone);

    // 2. Ambil Sesi Buka Toko Aktif
    let bukaTokoRecord: any = null;
    if (buka_toko?.buka_toko_id) {
      bukaTokoRecord = await prisma.bukaToko.findUnique({
        where: { id: BigInt(buka_toko.buka_toko_id) },
      });
    }

    if (!bukaTokoRecord || bukaTokoRecord.tutup !== null) {
      bukaTokoRecord = await prisma.bukaToko.findFirst({
        where: {
          cabang_id: cabangId,
          tutup: null,
        },
        orderBy: { id: 'desc' },
      });
    }

    if (!bukaTokoRecord) {
      const error: any = new Error('Toko belum dibuka atau sesi buka toko telah ditutup.');
      error.statusCode = 400;
      throw error;
    }

    const bukaTokoId = Number(bukaTokoRecord.id);
    const bukaTokoKode = bukaTokoRecord.kode || `ST${cabangId}`;

    // Sesuai Aturan Bisnis POS: Seluruh transaksi penjualan field 'tgl' WAJIB mengikuti tgl buka_toko yang masih buka
    // meskipun transaksi terjadi lewat tengah malam (hari esoknya).
    // Sedangkan created_at dan updated_at tetap mencatat waktu real-time (zonaWaktu).
    const tglTransaksi = bukaTokoRecord.tgl;

    // Ambil info nama karyawan yang sedang bertugas jaga shift
    const activeJaga = await prisma.jagaOutlet.findMany({
      where: {
        buka_toko_id: BigInt(bukaTokoId),
        ganti: 0,
      },
      include: {
        karyawan: true,
      },
    });

    const namaKasirJaga = activeJaga.length > 0
      ? activeJaga.map((j) => j.karyawan?.nama).filter(Boolean).join(', ')
      : (bukaTokoRecord.nm_karyawan || 'Kasir');

    // Ambil detail delivery & pembayaran untuk struk
    const deliveryRecord = await prisma.delivery.findUnique({
      where: { id: Number(delivery_id) },
    });
    const pembayaranRecord = await prisma.pembayaran.findUnique({
      where: { id: BigInt(pembayaran_id) },
    });

    // 3. Generate no_invoice: 'INV' + dmy + 5 random string
    // Format tanggal dmy mengikuti zona waktu kasir
    const [yStr, mStr, dStr] = dateStr.split('-');
    const dmy = `${dStr}${mStr}${yStr.slice(-2)}`;
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const noInvoice = `INV${dmy}${randomStr}`;

    const customerName = (pelanggan?.nama || '').trim();
    const customerPhone = (pelanggan?.no_tlp || '').trim();
    const deliveryId = Number(delivery_id) || 1;
    const pembayaranId = Number(pembayaran_id) || 1;
    const overallDiskon = Number(overallDiskonInput) || 0;

    // Prefetch seluruh resep produk dalam keranjang untuk efisiensi
    // Sesuai aturan: Filter HANYA bahan yang field aktif = 'Y' (berelasi dengan tabel bahan)
    const produkIds = Array.from(new Set(items.map((it) => Number(it.produk_id))));
    const allRecipes = await prisma.resep.findMany({
      where: {
        produk_id: { in: produkIds },
        bahan: {
          aktif: 'Y',
        },
      },
    });

    // Ambil harga normal (delivery_id = 1) untuk semua produk di keranjang
    const normalPrices = await prisma.harga.findMany({
      where: {
        produk_id: { in: produkIds },
        delivery_id: 1,
      },
      select: { produk_id: true, harga: true },
    });
    const normalPriceMap = new Map(normalPrices.map((p) => [p.produk_id, p.harga]));

    // Ambil seluruh bahan_id unik yang ada di resep
    const uniqueBahanIds = Array.from(new Set(allRecipes.map((r) => r.bahan_id)));

    // Hitung Harga Satuan Bahan (HPP) sesuai instruksi:
    // 1. Ambil harga tertinggi dari tabel stok_gudang (where jenis_bahan: 1, jenis: 1, void: 0, qty > 0, tgl >= '2026-02-22')
    //    Rumus max: (COALESCE(harga, 0) + COALESCE(harga_hutang, 0)) / qty
    // 2. Jika tidak ada di stok_gudang, ambil dari tabel harga_bahan where bahan_id & kota_id
    // 3. Jika tetap kosong, fallback ke bahan.harga
    const hppBahanMap = new Map<number, number>();

    if (uniqueBahanIds.length > 0) {
      const stokGudangList = await prisma.stokGudang.findMany({
        where: {
          bahan_id: { in: uniqueBahanIds },
          jenis_bahan: 1,
          jenis: 1,
          void: 0,
          qty: { gt: 0 },
          tgl: { gte: new Date('2026-02-22T00:00:00.000Z') },
        },
        select: {
          bahan_id: true,
          harga: true,
          harga_hutang: true,
          qty: true,
        },
      });

      const hargaBahanList = await prisma.hargaBahan.findMany({
        where: {
          bahan_id: { in: uniqueBahanIds },
          kota_id: kotaId,
        },
        select: {
          bahan_id: true,
          harga: true,
        },
      });
      const hargaBahanMap = new Map(hargaBahanList.map((hb) => [hb.bahan_id, hb.harga]));

      const masterBahanList = await prisma.bahan.findMany({
        where: { id: { in: uniqueBahanIds } },
        select: { id: true, harga: true, harga_beli: true },
      });
      const masterBahanMap = new Map(masterBahanList.map((mb) => [mb.id, mb.harga || mb.harga_beli || 0]));

      for (const bId of uniqueBahanIds) {
        const sgMatching = stokGudangList.filter((s) => s.bahan_id === bId);
        let maxUnitPrice = 0;

        for (const sg of sgMatching) {
          const totalBiaya = (Number(sg.harga) || 0) + (Number(sg.harga_hutang) || 0);
          const unitPrice = totalBiaya / sg.qty;
          if (unitPrice > maxUnitPrice) {
            maxUnitPrice = unitPrice;
          }
        }

        if (maxUnitPrice > 0) {
          hppBahanMap.set(bId, maxUnitPrice);
        } else if (hargaBahanMap.has(bId) && (hargaBahanMap.get(bId) || 0) > 0) {
          hppBahanMap.set(bId, hargaBahanMap.get(bId)!);
        } else {
          hppBahanMap.set(bId, masterBahanMap.get(bId) || 0);
        }
      }
    }

    // Eksekusi Atomik Seluruh Rangkaian Database di Prisma $transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // A. Tentukan Nomor Urutan (Antrian)
        // Cari urutan terakhir di InvoiceKasir berdasarkan kode_buka_toko & cabang_id
        const lastInvoice = await tx.invoiceKasir.findFirst({
          where: {
            kode: bukaTokoKode,
            cabang_id: cabangId,
          },
          orderBy: {
            urutan: 'desc',
          },
        });

        const urutan = lastInvoice && lastInvoice.urutan ? lastInvoice.urutan + 1 : 30;

        // B. Looping Keranjang (Cart) -> Insert Penjualan & Varian & Potong Stok Resep
        let totalSubtotalPenjualan = 0;
        let totalQtyAllItems = 0;
        let totalNormalSalesAllItems = 0;

        const receiptItems: CheckoutReceiptItem[] = [];

        for (const item of items) {
          const pId = Number(item.produk_id);
          const qty = Number(item.qty) || 1;
          const harga = Number(item.harga) || 0;
          
          const dbHargaNormal = normalPriceMap.get(pId);
          const hargaNormal = dbHargaNormal !== undefined ? dbHargaNormal : (Number(item.harga_normal) || harga);
          
          const diskonItem = Number(item.diskon) || 0;
          const varianList = Array.isArray(item.varian) ? item.varian : [];

          // Hitung total_varian = sum(v.harga) * qty
          const totalVarianSatuan = varianList.reduce((acc, v) => acc + (Number(v.harga) || 0), 0);
          const totalVarian = totalVarianSatuan * qty;

          // Hitung total_penjualan = (qty * harga) - diskonItem + total_varian
          const totalPenjualan = qty * harga - diskonItem + totalVarian;

          totalSubtotalPenjualan += totalPenjualan;
          totalQtyAllItems += qty;
          totalNormalSalesAllItems += qty * hargaNormal;

          // 1. Insert ke tabel penjualan_kasir (tgl = tglTransaksi buka_toko, created_at = zonaWaktu)
          const newPenjualanKasir = await tx.penjualanKasir.create({
            data: {
              no_invoice: noInvoice,
              nm_costumer: customerName || null,
              produk_id: pId,
              qty: qty,
              harga: harga,
              harga_normal: hargaNormal,
              catatan: item.catatan ? String(item.catatan).trim() : null,
              delivery_id: deliveryId,
              pembayaran_id: BigInt(pembayaranId),
              diskon: diskonItem,
              total: totalPenjualan,
              total_varian: totalVarian,
              void: 0,
              admin: adminId,
              cabang_id: cabangId,
              kota_id: kotaId,
              tgl: tglTransaksi,
              online: 0,
              created_at: zonaWaktu,
              updated_at: zonaWaktu,
            },
          });

          // 2. Jika ada varian, insert detailnya ke tabel penjualan_varian
          for (const v of varianList) {
            const vId = Number(v.id);
            if (!vId) continue;

            await tx.penjualanVarian.create({
              data: {
                penjualan_id: newPenjualanKasir.id,
                no_invoice: noInvoice,
                varian_id: BigInt(vId),
                qty: qty,
                harga: Number(v.harga) || 0,
                tgl: tglTransaksi,
                created_at: zonaWaktu,
                updated_at: zonaWaktu,
              },
            });
          }

          // 3. Logika Potong Stok (Berdasarkan Resep)
          const productRecipes = allRecipes.filter((r) => r.produk_id === pId);
          for (const rec of productRecipes) {
            const takaran = Number(rec.takaran) || 0;
            if (takaran > 0) {
              const hppBahan = hppBahanMap.get(rec.bahan_id) || 0;
              const qtyKredit = Math.round(takaran * qty);

              await tx.stok.create({
                data: {
                  kode: bukaTokoKode,
                  no_invoice: noInvoice,
                  penjualan_id: newPenjualanKasir.id,
                  produk_id: pId,
                  kota_id: kotaId,
                  cabang_id: cabangId,
                  delivery_id: deliveryId,
                  bahan_id: rec.bahan_id,
                  debit: 0,
                  kredit: qtyKredit,
                  harga: Math.round(hppBahan),
                  tgl: tglTransaksi,
                  admin: adminId,
                  jenis: 'Keluar',
                  status: 'buka',
                  created_at: zonaWaktu,
                  updated_at: zonaWaktu,
                },
              });
            }
          }

          // Kumpulkan data rincian struk
          const varianStr = varianList.map((v) => v.nm_varian).filter(Boolean).join(', ');
          receiptItems.push({
            qty: qty,
            nm_produk: item.nm_produk || `Produk #${pId}`,
            varian_str: varianStr ? `+ ${varianStr}` : undefined,
            harga_satuan: harga + totalVarianSatuan,
            total_harga: totalPenjualan,
            catatan: item.catatan || undefined,
          });
        }

        // C. Logika Jurnal Akuntansi (Persen Pengeluaran)
        // Ambil data dari tabel persen_pengeluaran berdasarkan cabang_id
        const persenList = await tx.persenPengeluaran.findMany({
          where: { cabang_id: cabangId },
        });

        for (const p of persenList) {
          let nilaiHitung = 0;
          if (p.jenis === 1) {
            // Jika jenis == 1, rumusnya: jumlah_persen * (qty * harga_normal) / 100
            nilaiHitung = (p.jumlah * totalNormalSalesAllItems) / 100;
          } else {
            // Jika jenis lain: jumlah_persen * qty
            nilaiHitung = p.jumlah * totalQtyAllItems;
          }

          // Jika hasil hitung > 0, insert 2 baris ke tabel jurnal:
          // 1 baris untuk Debit (akun sesuai akun_id di pengaturan) & 1 baris Kredit (akun_id = 26)
          // Keterangan jurnal diisi dengan nama akun (nm_akun dari akun_pengeluaran)
          if (nilaiHitung > 0) {
            const akun = await tx.akunPengeluaran.findUnique({
              where: { id: p.akun_id },
              select: { nm_akun: true },
            });
            const namaAkunKeterangan = akun?.nm_akun || `Akun ${p.akun_id}`;

            // Baris Debit
            await tx.jurnal.create({
              data: {
                kd_gabungan: noInvoice,
                buka_toko_id: BigInt(bukaTokoId),
                transaksi_id: 0,
                kota_id: kotaId,
                cabang_id: cabangId,
                buku_id: 1,
                akun_id: p.akun_id,
                bahan_id: 0,
                barang_id: 0,
                varian_id: BigInt(0),
                debit: nilaiHitung,
                kredit: 0,
                qty_debit: 0,
                qty_kredit: 0,
                user_id: adminId,
                tgl: tglTransaksi,
                ket: namaAkunKeterangan,
                void: 0,
                p_opname: 0,
                created_at: zonaWaktu,
                updated_at: zonaWaktu,
              },
            });

            // Baris Kredit (akun_id = 26)
            await tx.jurnal.create({
              data: {
                kd_gabungan: noInvoice,
                buka_toko_id: BigInt(bukaTokoId),
                transaksi_id: 0,
                kota_id: kotaId,
                cabang_id: cabangId,
                buku_id: 1,
                akun_id: 26, // Akun Kredit Kas/Pengeluaran = 26
                bahan_id: 0,
                barang_id: 0,
                varian_id: BigInt(0),
                debit: 0,
                kredit: nilaiHitung,
                qty_debit: 0,
                qty_kredit: 0,
                user_id: adminId,
                tgl: tglTransaksi,
                ket: namaAkunKeterangan,
                void: 0,
                p_opname: 0,
                created_at: zonaWaktu,
                updated_at: zonaWaktu,
              },
            });
          }
        }

        // D. Insert Invoice Utama (invoice_kasir)
        const totalPendapatan = Math.max(0, totalSubtotalPenjualan - overallDiskon);
        const nominalBayar = nominalBayarInput !== undefined && nominalBayarInput !== null
          ? Number(nominalBayarInput)
          : totalPendapatan;
        const kembalian = Math.max(0, nominalBayar - totalPendapatan);

        const newInvoiceKasir = await tx.invoiceKasir.create({
          data: {
            no_invoice: noInvoice,
            kode: bukaTokoKode,
            urutan: urutan,
            nm_costumer: customerName || null,
            nm_kasir: namaKasirJaga || null,
            total: totalPendapatan,
            dibayar: nominalBayar,
            diskon: overallDiskon,
            no_tlp: customerPhone || null,
            void: 0,
            ket_void: null,
            admin: adminId,
            user_void: null,
            tgl: tglTransaksi,
            delivery_id: deliveryId,
            pembayaran_id: BigInt(pembayaranId),
            cabang_id: cabangId,
            kota_id: kotaId,
            print: 0,
            online: 0,
            created_at: zonaWaktu,
            updated_at: zonaWaktu,
          },
        });

        // E. Bagi Hasil Karyawan Jaga (Gaji Shift)
        // Cari siapa saja yang jaga hari ini (jaga_outlet where buka_toko_id dan ganti = 0)
        if (activeJaga.length > 0) {
          const jumlahKaryawanJaga = activeJaga.length;
          const jumlahPenghasilan = totalPendapatan / jumlahKaryawanJaga;

          for (const kj of activeJaga) {
            await tx.penjualanGaji.create({
              data: {
                buka_toko_id: BigInt(bukaTokoId),
                kota_id: kotaId,
                cabang_id: cabangId,
                invoice_id: newInvoiceKasir.id,
                karyawan_id: kj.karyawan_id,
                jumlah: jumlahPenghasilan,
                tgl: tglTransaksi,
                void: 0,
                persen_gaji: cabang.persen_gaji || 0,
                created_at: zonaWaktu,
                updated_at: zonaWaktu,
              },
            });
          }
        }

        // F. Bagi Hasil Karyawan Office
        // Ambil data karyawan_office_kota untuk cabang ini dan pastikan di tabel karyawan_office field aktif = 1
        const officeKotaList = await tx.karyawanOfficeKota.findMany({
          where: { cabang_id: cabangId },
        });

        const officeKaryawanIds = officeKotaList.map((ok) => ok.karyawan_id);
        const activeOfficeStaff = await tx.karyawanOffice.findMany({
          where: {
            id: { in: officeKaryawanIds },
            aktif: 1,
          },
        });
        const officeStaffMap = new Map(activeOfficeStaff.map((s) => [s.id, s]));

        for (const ok of officeKotaList) {
          const officeStaff = officeStaffMap.get(ok.karyawan_id);
          // Hanya proses bagi hasil jika karyawan office berstatus aktif = 1
          if (!officeStaff) continue;

          const persenGaji = officeStaff.persen || 0;

          await tx.penjualanGajiOffice.create({
            data: {
              buka_toko_id: BigInt(bukaTokoId),
              kota_id: kotaId,
              cabang_id: cabangId,
              invoice_id: newInvoiceKasir.id,
              karyawan_id: ok.karyawan_id,
              jumlah: totalPendapatan,
              persen_gaji: persenGaji,
              tgl: tglTransaksi,
              void: 0,
              created_at: zonaWaktu,
              updated_at: zonaWaktu,
            },
          });
        }

        return {
          noInvoice,
          urutan,
          totalSubtotalPenjualan,
          overallDiskon,
          totalPendapatan,
          nominalBayar,
          kembalian,
          receiptItems,
        };
      },
      {
        timeout: 30000,
        maxWait: 10000,
      }
    );

    // Format Waktu Transaksi & Waktu Cetak untuk Struk sesuai zona waktu kasir (Contoh: "15 Sep 2026 01:47")
    const waktuTransaksiStr = formatReceiptDate(zonaWaktu, effectiveTimeZone);
    const waktuCetakStr = formatReceiptDate(new Date(), effectiveTimeZone);

    // Generate link WhatsApp dengan format pesan rapi
    let waLink = '';
    if (customerPhone) {
      let cleanPhone = customerPhone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      } else if (!cleanPhone.startsWith('62')) {
        cleanPhone = '62' + cleanPhone;
      }

      let waText = `*STRUK PEMBELIAN KEBAB YASMIN*\n`;
      waText += `Cabang: ${cabang.nama}\n`;
      waText += `No. Invoice: ${result.noInvoice}\n`;
      waText += `Antrian: #${result.urutan}\n`;
      waText += `Waktu: ${waktuTransaksiStr}\n`;
      waText += `Kasir: ${namaKasirJaga}\n`;
      waText += `--------------------------------\n`;
      for (const item of result.receiptItems) {
        waText += `${item.qty}x ${item.nm_produk} = Rp ${item.total_harga.toLocaleString('id-ID')}\n`;
        if (item.varian_str) {
          waText += `   ${item.varian_str}\n`;
        }
      }
      waText += `--------------------------------\n`;
      waText += `Subtotal: Rp ${result.totalSubtotalPenjualan.toLocaleString('id-ID')}\n`;
      if (result.overallDiskon > 0) {
        waText += `Diskon: -Rp ${result.overallDiskon.toLocaleString('id-ID')}\n`;
      }
      waText += `*Total: Rp ${result.totalPendapatan.toLocaleString('id-ID')}*\n`;
      waText += `Bayar: Rp ${result.nominalBayar.toLocaleString('id-ID')}\n`;
      waText += `Kembalian: Rp ${result.kembalian.toLocaleString('id-ID')}\n\n`;
      waText += `Terimakasih telah menikmati sajian Kebab Yasmin! Surganya Ngebab! 🌯✨`;

      waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
    }

    return {
      no_invoice: result.noInvoice,
      urutan: result.urutan,
      cabang_nama: cabang.nama,
      cabang_alamat: cabang.alamat || undefined,
      cabang_telepon: cabang.no_tlpn || '0813-4103-733',
      waktu_transaksi: waktuTransaksiStr,
      waktu_cetak: waktuCetakStr,
      kasir_nama: namaKasirJaga,
      nm_costumer: customerName || '-',
      no_tlp: customerPhone || '-',
      jenis_order: deliveryRecord?.delivery || 'Normal',
      pembayaran_nama: pembayaranRecord?.pembayaran || 'Cash',
      items: result.receiptItems,
      subtotal: result.totalSubtotalPenjualan,
      diskon: result.overallDiskon,
      total_bayar: result.totalPendapatan,
      dibayar: result.nominalBayar,
      kembalian: result.kembalian,
      wa_link: waLink || undefined,
    };
  }
}

export const checkoutService = new CheckoutService();
export default checkoutService;
