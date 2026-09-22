/**
 * Utilitas Web Bluetooth API & Generator Raw Byte-Array ESC/POS
 * Didesain khusus untuk thermal printer kasir Kebab Yasmin (58mm / 32 kolom & 80mm / 48 kolom).
 */

export interface ReceiptDataForPrint {
  no_invoice: string;
  urutan: number;
  cabang_nama: string;
  cabang_telepon?: string;
  waktu_transaksi: string;
  waktu_cetak?: string;
  kasir_nama: string;
  nm_costumer?: string;
  jenis_order?: string;
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
}

// Data Raster Bit Image Monokrom Logo Resmi Kebab Yasmin (ESC/POS GS v 0)
// Lebar: 384 dots (48 bytes, terpusat rapi di printer 58mm & 80mm), Tinggi: 109 dots (~1.3 cm)
// Diproses dengan high-contrast dithering & 100% offline-ready tanpa delay koneksi/canvas
export const KEBAB_YASMIN_LOGO_RASTER_B64 =
  'HXYwADAAbQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAB/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/+AAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//AAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AA/gAH4AAAAAAAAAAAAAeAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAP//AA/wAP4AAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAf//gAf4AfwAAAAAAAAAAAAAfgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//gA' +
  'P4AfwAAAAAAAAAAAAA/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPw///gAP8A/gAAAAAAAAA' +
  'AAAAfgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf8///wAH8A/gAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAA/+///wAH+B/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAB/////wAD+B/A/+AB/wAD/w/8AeAH/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB' +
  '/////wAD/D+D//gH/8AP////A/Af/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/////wAB/D+H//' +
  'wP/+Af////gfg//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHj/////wAA/n8H//wf//A/////wfh/' +
  '/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////wAA/n8P//4///g/////wfh//+AAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAA///////wAAf34PwP4/A/h/h/4f4fj/D/AAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAB///////wAAf/4AAH4/Afh/A/wP4fj+B/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///////w' +
  'AAP/wAAH4/gHh+AfgH4fj8A/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///////gAAH/gAAf4/4AB+' +
  'AfgH4fj8A/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////gAAH/gAP/4//gB+AfgH4fj8A/AAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAD///////wAAD/AB//4f/8B+AfgH4fj8A/AAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAf/////////gAD/AH//4f//B+AfgH4fj8A/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/' +
  '////////wAB/AP/34H//h+AfgH4fj8A/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/////////4AB+AP' +
  '8H4D//x+AfgH4fj8A/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////8AB+AfwH4AP/x+AfgH4f' +
  'j8A/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////8AB+AfgH4AA/x+AfgH4fj8A/AAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAB//////////+AB+AfgH5+Afx+AfgH4/j8A/AAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAB/////9////+AB/AfgP5/APx+AfgH4/j8A/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/////qv///+' +
  'AB/Afwfx/gfx+AfgH4/j8A/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/////VX///+AB/Af//w///x+Af' +
  'gH4/j8A/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAB////+qr///+AB/AP//g///h+AfgH4/j8A/AAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAB//9f9VX///+AB/AP//Af//B+AfgH4/j8A/AAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAB//6r+qv///8AA/AH/+AP/+B+AfgH4/j8A/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//1V9Vf/' +
  '//8AAeAB/4AD/4B+AfgD4fD8AfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//qr6q/qv/8AAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/VV9V/VX/8AAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAf/qr6r+qr/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAf/VX9X9VV/8AAAAAAAAAAAAAAAAAAAAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/qr' +
  '//6qq/8AAAAAAAAAAAAAAAAAAABgwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/1X//1VX/8AAAAAAA' +
  'AAAAAAAAAAAACAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/+///qqv++AAAAOAPgAAOAAAAAcAAEA' +
  'EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfP////1Vf4+AAAAeAfgAAPAAAAAeAAJwCAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAfB//Af6r/w+AAAA+A/AAAPgAAAAfAAJ/6AAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAfAf+AH9X/A+AAAA+B+AAAPgAAAAfAAI/6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAH/AD6v+A+' +
  'AAAA+D8AAAPgAAAAfAAQGKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAB/wB9f4A+AAAA+H4AfgPjgA' +
  'fgfHgQgDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAf8A+/ww+AAAA+PwB/4Pv8B/4ff4Q/iAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAfAAH+A//Bw+AAAA+fgD/8P/+D/8f/8J/iAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAfAAB/gf+Aw+AAAA+/AH/+P/+H/+f/8J/iAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAA' +
  '/wf8AA+AAAA/+AHw+P5/Hw+fz+EBkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAAP8fwAA+AAAA/+AP' +
  'gfPwfAAefg+GAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAED+fgAA+AAAA//APgfPgfAA+fA+GAY' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAOB//BgA+AAAA//gP//PgPgf+fAfP/gAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAfAAOAf+DgA+AAAA//wP//PgPj/+fAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAPAAAAP8BgA+AAAA+PwP//PgPn/+fAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAH8AAA+A' +
  'AAA+H4P//PgPn4efAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAB+AAY+AAAA+D8PgAPgPvg' +
  'efAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAA/AA4+AAAA+B+PgAPgfPg+fA+AAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAPAAAAAfgAYeAAAA+B+PwfPwfPg+fg+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAPAAABwPwAAeAAAA+A/H5+H5/Pz8Pz+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAABwH4AAe' +
  'AAAA+Afj/+H/+H/8P/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAgD8AAeAAAA+APj/8D/8H/' +
  '4H/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAOAAB+AAeAAAA+APw/4B/4D/wB/wAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAPAAOAAA/AAeAAAAAAAAHAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAPAAEAAAfAAeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAPg' +
  'AeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////////+AAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////////+IAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAABP/////////8YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAABv/////////8YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABn/////' +
  '////4wAcAAAAAAAAABiAABgAGBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAz/////////5wB+AAAAAAA' +
  'AAD3AABgAGAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5/////////zgB+REhocTiIcDzGg5sHGxwAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAY/////////HABm5v39+f3M+DzPz9+fH5wAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAMf///////+OAB45v3dmd3N3D7dzd3bndgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHH/' +
  '//////4cAA87umcuZ3M3Dfc2NmLmNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADh///////hwAAezuOd' +
  '+Z2c+Dfcz5nfsdgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4P/////8AAADOzuH9uZ39mDPdyBnbuYA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////AAAAD+/uH7/539/DPf3Z+/37gAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAB///gAAAAB8fsDZ2Zhd/DHNj44dnzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AG4AAGcAAAZwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAH4AAAfgAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAADwAAAPAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAA=';

let cachedLogoRasterBytes: Uint8Array | null = null;

export function getLogoRasterBytes(): Uint8Array {
  if (cachedLogoRasterBytes) return cachedLogoRasterBytes;
  try {
    if (typeof atob === 'function') {
      const bin = atob(KEBAB_YASMIN_LOGO_RASTER_B64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      cachedLogoRasterBytes = bytes;
      return bytes;
    } else if (typeof Buffer !== 'undefined') {
      cachedLogoRasterBytes = new Uint8Array(Buffer.from(KEBAB_YASMIN_LOGO_RASTER_B64, 'base64'));
      return cachedLogoRasterBytes;
    }
  } catch (err) {
    console.warn('Gagal decode ESC/POS logo:', err);
  }
  return new Uint8Array(0);
}

// Byte Command ESC/POS Standard
export const ESC_COMMANDS = {
  INIT: [0x1b, 0x40], // Inisialisasi printer
  ALIGN_LEFT: [0x1b, 0x61, 0x00],
  ALIGN_CENTER: [0x1b, 0x61, 0x01],
  ALIGN_RIGHT: [0x1b, 0x61, 0x02],
  BOLD_ON: [0x1b, 0x45, 0x01],
  BOLD_OFF: [0x1b, 0x45, 0x00],
  UNDERLINE_ON: [0x1b, 0x2d, 0x01],
  UNDERLINE_OFF: [0x1b, 0x2d, 0x00],
  FONT_A: [0x1b, 0x4d, 0x00], // Font A Standar (12x24 dots, 32 kolom pada 58mm)
  FONT_B: [0x1b, 0x4d, 0x01], // Font B Kecil / Compressed (9x17 dots, ~40-42 kolom pada 58mm) -> Hemat kertas!
  FONT_NORMAL: [0x1d, 0x21, 0x00],
  FONT_DOUBLE_SIZE: [0x1d, 0x21, 0x11], // 2x Lebar & 2x Tinggi
  FONT_LARGE: [0x1d, 0x21, 0x22], // 3x
  FONT_HUGE: [0x1d, 0x21, 0x33], // 4x Font untuk Nomor Antrian
  LINE_SPACING_DEFAULT: [0x1b, 0x32], // Default line spacing (~32-34 dots)
  LINE_SPACING_TIGHT: [0x1b, 0x33, 20], // Spasi baris rapat (20 dots) -> Memangkas panjang kertas ~35%!
  FEED_LINES: (n: number) => [0x1b, 0x64, n],
  CUT_PAPER: [0x1d, 0x56, 0x00], // Full Cut
  PARTIAL_CUT: [0x1d, 0x56, 0x01], // Partial Cut
};

/**
 * Helper class untuk merakit byte ESC/POS secara terstruktur
 */
export class EscPosBuilder {
  private buffer: number[] = [];
  private encoder: TextEncoder;

  constructor() {
    this.encoder = new TextEncoder();
    this.init();
  }

  init(): this {
    this.buffer.push(...ESC_COMMANDS.INIT);
    return this;
  }

  alignCenter(): this {
    this.buffer.push(...ESC_COMMANDS.ALIGN_CENTER);
    return this;
  }

  alignLeft(): this {
    this.buffer.push(...ESC_COMMANDS.ALIGN_LEFT);
    return this;
  }

  alignRight(): this {
    this.buffer.push(...ESC_COMMANDS.ALIGN_RIGHT);
    return this;
  }

  bold(enable: boolean = true): this {
    this.buffer.push(...(enable ? ESC_COMMANDS.BOLD_ON : ESC_COMMANDS.BOLD_OFF));
    return this;
  }

  underline(enable: boolean = true): this {
    this.buffer.push(...(enable ? ESC_COMMANDS.UNDERLINE_ON : ESC_COMMANDS.UNDERLINE_OFF));
    return this;
  }

  fontSmall(): this {
    this.buffer.push(...ESC_COMMANDS.FONT_B);
    return this;
  }

  fontNormal(): this {
    this.buffer.push(...ESC_COMMANDS.FONT_A);
    return this;
  }

  lineSpacingTight(spacing: number = 20): this {
    this.buffer.push(0x1b, 0x33, spacing);
    return this;
  }

  lineSpacingDefault(): this {
    this.buffer.push(...ESC_COMMANDS.LINE_SPACING_DEFAULT);
    return this;
  }

  fontSize(type: 'normal' | 'double' | 'large' | 'huge'): this {
    switch (type) {
      case 'double':
        this.buffer.push(...ESC_COMMANDS.FONT_DOUBLE_SIZE);
        break;
      case 'large':
        this.buffer.push(...ESC_COMMANDS.FONT_LARGE);
        break;
      case 'huge':
        this.buffer.push(...ESC_COMMANDS.FONT_HUGE);
        break;
      default:
        this.buffer.push(...ESC_COMMANDS.FONT_NORMAL);
        break;
    }
    return this;
  }

  rawBytes(bytes: Uint8Array | number[]): this {
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  printLogo(): this {
    // Karena logo gambar raster (GS v 0) sering corrupt/rusak pada beberapa printer Bluetooth,
    // kita ganti menjadi teks tebal berukuran ganda agar selalu aman, rapi, dan terbaca jelas.
    this.alignCenter();
    this.bold(true);
    this.fontSize('double');
    this.line('KEBAB YASMIN');
    this.fontSize('normal');
    this.bold(false);
    return this;
  }

  text(str: string): this {
    const bytes = this.encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  line(str: string = ''): this {
    this.text(str + '\n');
    return this;
  }

  feed(lines: number = 1): this {
    this.buffer.push(...ESC_COMMANDS.FEED_LINES(lines));
    return this;
  }

  cut(): this {
    this.feed(2); // Cukup 2 feed agar pas di pisau cutter tanpa membuang kertas
    this.buffer.push(...ESC_COMMANDS.CUT_PAPER);
    return this;
  }

  /**
   * Format dua kolom teks kiri dan kanan (misal nama barang di kiri, harga di kanan)
   */
  twoColumns(left: string, right: string, width: number = 38): this {
    const spaceCount = width - left.length - right.length;
    if (spaceCount >= 0) {
      this.line(left + ' '.repeat(spaceCount) + right);
    } else {
      // Jika teks kiri terlalu panjang, buat baris kedua rapi
      const maxLeftWidth = width - right.length - 1;
      this.line(left.substring(0, maxLeftWidth) + ' ' + right);
      if (left.length > maxLeftWidth) {
        // Cari indentasi (misal jika diawali "1  " maka gunakan spasi sepanjang itu)
        const match = left.match(/^(\d+\s+)/);
        const indentStr = match ? ' '.repeat(match[1].length) : '  ';
        let remainingText = left.substring(maxLeftWidth).trim();
        
        while (remainingText.length > 0) {
          const chunk = remainingText.substring(0, width - indentStr.length);
          this.line(indentStr + chunk);
          remainingText = remainingText.substring(width - indentStr.length).trim();
        }
      }
    }
    return this;
  }

  divider(width: number = 38, char: string = '-'): this {
    this.line(char.repeat(width));
    return this;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Format tanggal dan waktu menjadi "15 Sep 2026 01:47"
 */
export function formatReceiptDateTime(date: Date = new Date()): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

/**
 * Generate Byte Array ESC/POS lengkap sesuai format struk resmi Kebab Yasmin.
 * Didesain khusus hemat kertas (Font B 9x17 + Line Spacing rapat 20 dots + Logo Kebab Yasmin).
 */
export function generateEscPosReceiptBytes(data: ReceiptDataForPrint, width: number = 38): Uint8Array {
  const b = new EscPosBuilder();

  // 1. CETAK LOGO RESMI KEBAB YASMIN DI ATAS STRUK
  b.printLogo();

  const formattedCabang = data.cabang_nama?.toLowerCase().startsWith('cabang')
    ? data.cabang_nama
    : `Cabang ${data.cabang_nama}`;

  const telepon = data.cabang_telepon || '0813-4103-733';
  const waktuTransaksi = data.waktu_transaksi || formatReceiptDateTime();
  const waktuCetak = data.waktu_cetak || formatReceiptDateTime();
  const kasirNama = data.kasir_nama || 'Kasir';
  const pelangganNama = data.nm_costumer || '-';
  const jenisOrder = data.jenis_order || 'Normal';

  // 2. HEADER STRUK (Rata Tengah)
  b.alignCenter();
  b.bold(true);
  b.line(formattedCabang);
  b.bold(false);
  b.line('Surganya Ngebab!');
  b.line(`Telp: ${telepon}`);

  // 3. METADATA TRANSAKSI (Rata Kiri, sejajar dengan spasi agar rapi)
  b.divider(width, '-');
  b.alignLeft();
  if (data.no_invoice) {
    b.line(`No. Inv     : ${data.no_invoice}`);
  }
  b.line(`Waktu       : ${waktuTransaksi}`);
  b.line(`Kasir       : ${kasirNama}`);
  b.line(`Costumer    : ${pelangganNama}`);
  b.line(`Jenis Order : ${jenisOrder}`);
  b.line(`Antrian     : ${data.urutan}`); // Antrian disejajarkan ke kiri

  // 4. GARIS PEMISAH
  b.divider(width, '-');

  // 5. DETAIL ITEM PESANAN
  b.alignLeft();
  let totalItemCount = 0;
  for (const item of data.items) {
    totalItemCount += item.qty;
    const priceStr = item.total_harga.toLocaleString('id-ID');
    const firstLineLeft = `${item.qty}  ${item.nm_produk}`;

    b.twoColumns(firstLineLeft, priceStr, width);

    if (item.varian_str) {
      b.line(`   + ${item.varian_str}`);
    }

    if (item.catatan) {
      b.line(`   (${item.catatan})`);
    }
  }

  // 6. GARIS PEMISAH
  b.divider(width, '-');

  // 7. RINGKASAN SUBTTOTAL, DISKON, TOTAL, BAYAR, KEMBALIAN
  b.alignLeft();
  b.twoColumns(`Subtotal (${totalItemCount} item)`, data.subtotal.toLocaleString('id-ID'), width);

  if (data.diskon && data.diskon > 0) {
    b.twoColumns('Diskon Promo', `-${data.diskon.toLocaleString('id-ID')}`, width);
  }

  b.bold(true);
  b.twoColumns('TOTAL BAYAR', data.total_bayar.toLocaleString('id-ID'), width);
  b.bold(false);
  b.twoColumns('Tunai / Bayar', data.dibayar.toLocaleString('id-ID'), width);
  b.twoColumns('Kembalian', data.kembalian.toLocaleString('id-ID'), width);

  b.divider(width, '=');

  // 8. FOOTER STRUK (Rata Tengah)
  b.alignCenter();
  b.line('Terima Kasih Atas Kunjungan Anda');
  b.line('IG: @kebabyasmin.id | YT: kebabyasmin');
  b.bold(true);
  b.line('*** LUNAS / TERBAYAR ***');
  b.bold(false);
  b.line(`<--- ${waktuCetak} --->`);

  // 9. TIKET NOMOR ANTRIAN (Ringkas, hemat kertas & tetap jelas untuk kasir/dapur)
  b.feed(1);
  b.divider(width, '-');
  b.bold(true);
  b.line('NOMOR ANTRIAN');
  b.fontSize('double');
  b.line(` ${data.urutan} `);
  b.fontSize('normal');
  b.line(formattedCabang);
  b.divider(width, '=');

  // 10. FEED & CUT (Minimal feed 2 agar pas cutter printer, tidak boros)
  b.feed(2);
  b.cut();

  return b.getBytes();
}

/**
 * UUID Service & Karakteristik Thermal Printer Bluetooth
 */
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Thermal ESC/POS Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
];

/**
 * Kirim buffer ke Bluetooth Device secara bertahap (Chunking) untuk mencegah packet drop
 */
async function sendBytesChunked(characteristic: any, bytes: Uint8Array, chunkSize: number = 256): Promise<void> {
  let offset = 0;
  while (offset < bytes.length) {
    const chunk = bytes.slice(offset, offset + chunkSize);
    if (characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
    offset += chunkSize;
    // Delay 30ms antar chunk agar buffer printer tidak overflow
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
}

/**
 * Format data untuk Cetak Laporan EOD (Tutup Toko)
 */
export interface LaporanEodDataForPrint {
  cabang_nama: string;
  kode_sesi: string;
  waktu_buka: string;
  waktu_tutup: string;
  kasir_nama: string;
  laporan_penjualan: {
    delivery_nama: string;
    pembayaran_nama: string;
    total_transaksi: number;
    total_penjualan: number;
  }[];
  detail_produk_terjual: {
    nm_produk: string;
    delivery_nama: string;
    qty_terjual: number;
    total_uang: number;
  }[];
  laporan_pengeluaran: {
    total_pengeluaran: number;
    items: {
      nm_barang: string;
      qty: number;
      total_harga: number;
    }[];
  };
  laporan_kas_bersih: {
    total_penjualan_cash: number;
    total_pengeluaran_kebutuhan: number;
    kas_bersih: number;
  };
  laporan_barang_bawaan: {
    nm_bahan: string;
    satuan: string;
    masuk: number;
    keluar: number;
    refund: number;
    sisa_fisik: number;
  }[];
  ket_kebutuhan?: string;
}

/**
 * Generate Byte-array ESC/POS untuk Laporan EOD Tutup Toko (58mm / 38 Kolom Hemat Kertas)
 */
export function generateEscPosEodBytes(data: LaporanEodDataForPrint, width: number = 38): Uint8Array {
  const b = new EscPosBuilder();

  // 1. LOGO RESMI KEBAB YASMIN
  b.printLogo();

  // 2. HEADER LAPORAN
  b.alignCenter();
  b.bold(true);
  b.line(data.cabang_nama.toUpperCase());
  b.line('LAPORAN REKAP TUTUP TOKO (EOD)');
  b.bold(false);
  b.divider(width, '=');

  // 3. INFO SESI
  b.alignLeft();
  b.twoColumns('Kode Sesi', data.kode_sesi, width);
  b.twoColumns('Kasir Jaga', data.kasir_nama, width);
  b.twoColumns('Jam Buka', data.waktu_buka, width);
  b.twoColumns('Jam Tutup', data.waktu_tutup, width);
  b.divider(width, '=');

  // 4. RINGKASAN KAS BERSIH (Highlight Utama)
  b.alignCenter();
  b.bold(true);
  b.line('*** RINGKASAN KAS BERSIH ***');
  b.bold(false);
  b.alignLeft();
  b.twoColumns('Penjualan Tunai (Cash)', `Rp ${data.laporan_kas_bersih.total_penjualan_cash.toLocaleString('id-ID')}`, width);
  b.twoColumns('Pengeluaran Kebutuhan', `Rp ${data.laporan_kas_bersih.total_pengeluaran_kebutuhan.toLocaleString('id-ID')}`, width);
  b.divider(width, '-');
  b.bold(true);
  b.twoColumns('KAS BERSIH SHIFT', `Rp ${data.laporan_kas_bersih.kas_bersih.toLocaleString('id-ID')}`, width);
  b.bold(false);
  b.divider(width, '=');

  // 5. REKAP PENJUALAN (Group Order & Pembayaran)
  b.bold(true);
  b.line('REKAP PENJUALAN KASIR');
  b.bold(false);
  if (data.laporan_penjualan.length === 0) {
    b.line('(Belum ada transaksi penjualan)');
  } else {
    for (const item of data.laporan_penjualan) {
      b.twoColumns(`${item.delivery_nama} - ${item.pembayaran_nama}`, `${item.total_transaksi}x`, width);
      b.twoColumns('', `Rp ${item.total_penjualan.toLocaleString('id-ID')}`, width);
    }
  }
  b.divider(width, '-');

  // 6. DETAIL PRODUK TERJUAL
  b.bold(true);
  b.line('DETAIL PRODUK TERJUAL');
  b.bold(false);
  if (data.detail_produk_terjual.length === 0) {
    b.line('(Tidak ada produk terjual)');
  } else {
    for (const prod of data.detail_produk_terjual) {
      b.twoColumns(`${prod.nm_produk} [${prod.delivery_nama}]`, `${prod.qty_terjual} pcs`, width);
      b.twoColumns('', `Rp ${prod.total_uang.toLocaleString('id-ID')}`, width);
    }
  }
  b.divider(width, '-');

  // 7. PENGELUARAN KEBUTUHAN
  b.bold(true);
  b.line('RINCIAN PENGELUARAN');
  b.bold(false);
  if (data.laporan_pengeluaran.items.length === 0) {
    b.line('(Tidak ada pengeluaran kebutuhan)');
  } else {
    for (const keb of data.laporan_pengeluaran.items) {
      b.twoColumns(`${keb.nm_barang} (${keb.qty} pcs)`, `Rp ${keb.total_harga.toLocaleString('id-ID')}`, width);
    }
  }
  b.divider(width, '-');

  // 8. STOK FISIK BARANG BAWAAN
  b.bold(true);
  b.line('STOK FISIK BARANG BAWAAN');
  b.bold(false);
  b.line('Bahan | Masuk - Kel - Ref = Sisa');
  if (data.laporan_barang_bawaan.length === 0) {
    b.line('(Tidak ada data stok awal)');
  } else {
    for (const st of data.laporan_barang_bawaan) {
      b.line(`${st.nm_bahan} (${st.satuan})`);
      b.twoColumns(`M:${st.masuk} K:${st.keluar} R:${st.refund}`, `Sisa: ${st.sisa_fisik}`, width);
    }
  }
  b.divider(width, '=');

  // 9. CATATAN KEBUTUHAN
  if (data.ket_kebutuhan) {
    b.bold(true);
    b.line('CATATAN KEBUTUHAN SHIFT:');
    b.bold(false);
    b.line(data.ket_kebutuhan);
    b.divider(width, '-');
  }

  // 10. KOLOM TANDA TANGAN
  b.feed(1);
  b.twoColumns('Kasir Jaga,', 'Supervisor,', width);
  b.feed(2);
  b.twoColumns('(...............)', '(...............)', width);
  b.feed(1);
  b.alignCenter();
  b.line('*** TERIMA KASIH ***');
  b.line('KEBAB YASMIN INDONESIA');

  // 11. FEED & CUT (Minimal feed agar hemat kertas)
  b.feed(2);
  b.cut();

  return b.getBytes();
}

/**
 * Kirim raw byte array ke Bluetooth Device
 */
async function sendRawBytesBluetooth(rawBytes: Uint8Array): Promise<void> {
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  if (!nav || !nav.bluetooth) {
    throw new Error(
      'Browser Anda belum mendukung Web Bluetooth API. Gunakan Google Chrome pada Android, Windows, macOS, atau ChromeOS.'
    );
  }

  let device: any = null;
  try {
    device = await nav.bluetooth.requestDevice({
      filters: [{ services: [PRINTER_SERVICES[0]] }],
      optionalServices: PRINTER_SERVICES,
    });
  } catch (filterErr: any) {
    if (filterErr.name === 'NotFoundError') {
      throw new Error('Pencarian printer Bluetooth dibatalkan.');
    }
    try {
      device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });
    } catch (fallbackErr: any) {
      throw new Error(fallbackErr.message || 'Gagal menghubungkan ke printer Bluetooth.');
    }
  }

  if (!device || !device.gatt) {
    throw new Error('Perangkat printer tidak valid.');
  }

  const server = await device.gatt.connect();
  let targetCharacteristic: any = null;

  for (const serviceUuid of PRINTER_SERVICES) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      const characteristics = await service.getCharacteristics();

      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          targetCharacteristic = char;
          break;
        }
      }
      if (targetCharacteristic) break;
    } catch (e) {
      continue;
    }
  }

  if (!targetCharacteristic) {
    try {
      const services = await server.getPrimaryServices();
      for (const s of services) {
        const chars = await s.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            targetCharacteristic = c;
            break;
          }
        }
        if (targetCharacteristic) break;
      }
    } catch (e) {
      console.warn('Gagal menelusuri primary services:', e);
    }
  }

  if (!targetCharacteristic) {
    if (device.gatt.connected) device.gatt.disconnect();
    throw new Error('Karakteristik printer untuk mencetak data tidak ditemukan pada perangkat ini.');
  }

  await sendBytesChunked(targetCharacteristic, rawBytes);

  await new Promise((resolve) => setTimeout(resolve, 500));
  if (device.gatt.connected) {
    device.gatt.disconnect();
  }
}

/**
 * Fungsi Utama: Cetak Struk Transaksi via Web Bluetooth API (navigator.bluetooth)
 */
export async function printReceiptBluetooth(data: ReceiptDataForPrint): Promise<{ success: boolean; message: string }> {
  const rawBytes = generateEscPosReceiptBytes(data);
  await sendRawBytesBluetooth(rawBytes);

  return {
    success: true,
    message: 'Struk berhasil dikirim ke printer thermal Bluetooth!',
  };
}

/**
 * Fungsi Utama: Cetak Laporan EOD Tutup Toko via Web Bluetooth API
 */
export async function printLaporanEodBluetooth(data: LaporanEodDataForPrint): Promise<{ success: boolean; message: string }> {
  const rawBytes = generateEscPosEodBytes(data);
  await sendRawBytesBluetooth(rawBytes);

  return {
    success: true,
    message: 'Laporan EOD berhasil dikirim ke printer thermal Bluetooth!',
  };
}

