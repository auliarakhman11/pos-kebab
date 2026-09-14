import prisma from '../prisma';

export class PosService {
  /**
   * Mengambil seluruh data awal untuk Halaman Kasir POS:
   * - Kategori produk (possition ASC, exclude '0')
   * - Produk aktif (hapus = 0) beserta tabel harga dan resep (bahan)
   * - Jenis delivery / order (event != 1, default 1: Normal)
   * - Jenis pembayaran aktif (aktif = '1')
   * - Kategori varian & varian aktif
   */
  async getPosInitData() {
    const [kategoriList, produkList, deliveryList, pembayaranList, kategoriVarianList] =
      await Promise.all([
        prisma.kategori.findMany({
          where: {
            NOT: {
              kategori: '0',
            },
          },
          orderBy: {
            possition: 'asc',
          },
        }),
        prisma.produk.findMany({
          where: {
            hapus: 0,
          },
          include: {
            harga: true,
            resep: {
              include: {
                bahan: true,
              },
            },
          },
          orderBy: {
            possition: 'asc',
          },
        }),
        prisma.delivery.findMany({
          where: {
            event: {
              not: 1,
            },
          },
          orderBy: {
            id: 'asc',
          },
        }),
        prisma.pembayaran.findMany({
          where: {
            aktif: '1',
          },
          orderBy: {
            id: 'asc',
          },
        }),
        prisma.kategoriVarian.findMany({
          where: {
            aktif: 1,
          },
          include: {
            varian: true,
          },
        }),
      ]);

    // Format serialized data (BigInt safe conversion)
    const formattedPembayaran = pembayaranList.map((p) => ({
      id: Number(p.id),
      pembayaran: p.pembayaran,
      aktif: p.aktif,
    }));

    const formattedKategoriVarian = kategoriVarianList.map((kv) => ({
      id: Number(kv.id),
      kategori_varian: kv.kategori_varian,
      aktif: kv.aktif,
      varian: kv.varian.map((v) => ({
        id: Number(v.id),
        nm_varian: v.nm_varian,
        kategori_varian_id: Number(v.kategori_varian_id),
        harga: v.harga,
      })),
    }));

    const formattedProduk = produkList.map((p) => {
      // Buat ringkasan info resep (misal: "Tortilla Besar, Beef Grill, Saus")
      const resepInfo = p.resep
        .map((r) => r.bahan?.bahan)
        .filter(Boolean)
        .join(', ');

      return {
        id: p.id,
        kategori_id: p.kategori_id,
        nm_produk: p.nm_produk,
        foto: p.foto,
        diskon: p.diskon,
        status: p.status,
        tampil_varian: p.tampil_varian,
        possition: p.possition,
        harga: p.harga.map((h) => ({
          id: h.id,
          delivery_id: h.delivery_id,
          harga: h.harga,
        })),
        resep_info: resepInfo || 'Standar Resep Kebab Yasmin',
      };
    });

    return {
      kategori: kategoriList,
      produk: formattedProduk,
      delivery: deliveryList,
      pembayaran: formattedPembayaran,
      kategori_varian: formattedKategoriVarian,
    };
  }
}

export const posService = new PosService();
export default posService;
