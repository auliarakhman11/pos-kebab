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
  FONT_NORMAL: [0x1d, 0x21, 0x00],
  FONT_DOUBLE_SIZE: [0x1d, 0x21, 0x11], // 2x Lebar & 2x Tinggi
  FONT_LARGE: [0x1d, 0x21, 0x22], // 3x
  FONT_HUGE: [0x1d, 0x21, 0x33], // 4x Font untuk Nomor Antrian
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

  feed(lines: number = 2): this {
    this.buffer.push(...ESC_COMMANDS.FEED_LINES(lines));
    return this;
  }

  cut(): this {
    this.feed(3);
    this.buffer.push(...ESC_COMMANDS.CUT_PAPER);
    return this;
  }

  /**
   * Format dua kolom teks kiri dan kanan (misal nama barang di kiri, harga di kanan)
   */
  twoColumns(left: string, right: string, width: number = 32): this {
    const spaceCount = width - left.length - right.length;
    if (spaceCount >= 0) {
      this.line(left + ' '.repeat(spaceCount) + right);
    } else {
      // Jika teks kiri terlalu panjang, potong atau buat 2 baris
      const maxLeftWidth = width - right.length - 1;
      this.line(left.substring(0, maxLeftWidth) + ' ' + right);
      if (left.length > maxLeftWidth) {
        this.line('  ' + left.substring(maxLeftWidth));
      }
    }
    return this;
  }

  divider(width: number = 32, char: string = '-'): this {
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
 * Generate Byte Array ESC/POS lengkap sesuai format struk resmi Kebab Yasmin
 */
export function generateEscPosReceiptBytes(data: ReceiptDataForPrint, width: number = 32): Uint8Array {
  const b = new EscPosBuilder();

  const formattedCabang = data.cabang_nama?.toLowerCase().startsWith('cabang')
    ? data.cabang_nama
    : `Cabang ${data.cabang_nama}`;

  const telepon = data.cabang_telepon || '0813-4103-733';
  const waktuTransaksi = data.waktu_transaksi || formatReceiptDateTime();
  const waktuCetak = data.waktu_cetak || formatReceiptDateTime();
  const kasirNama = data.kasir_nama || 'Kasir';
  const pelangganNama = data.nm_costumer || '';
  const jenisOrder = data.jenis_order || 'Normal';

  // 1. HEADER STRUK (Rata Tengah)
  b.alignCenter();
  b.bold(true);
  b.line(formattedCabang);
  b.bold(false);
  b.line('Surganya Ngebab!');
  b.line(telepon);
  b.line();

  // 2. METADATA TRANSAKSI (Rata Kiri)
  b.alignLeft();
  b.line(`Waktu         : ${waktuTransaksi}`);
  b.line(`Kasir         : ${kasirNama}`);
  b.line(`Costumer      : ${pelangganNama}`);
  b.line(`Jenis Order   : ${jenisOrder}`);

  // Antrian di tengah
  b.alignCenter();
  b.bold(true);
  b.line(`Antrian       : ${data.urutan}`);
  b.bold(false);

  // 3. GARIS PEMISAH
  b.divider(width, '-');

  // 4. DETAIL ITEM PESANAN
  b.alignLeft();
  let totalItemCount = 0;
  for (const item of data.items) {
    totalItemCount += item.qty;
    const priceStr = item.total_harga.toLocaleString('id-ID');
    const firstLineLeft = `${item.qty}   ${item.nm_produk}`;

    b.twoColumns(firstLineLeft, priceStr, width);

    if (item.varian_str) {
      b.line(`    ${item.varian_str}`);
    }

    if (item.catatan) {
      b.line(`    (${item.catatan})`);
    }
  }

  // 5. GARIS PEMISAH
  b.divider(width, '-');

  // 6. RINGKASAN SUBTTOTAL, DISKON, TOTAL, BAYAR, KEMBALIAN
  b.alignLeft();
  b.twoColumns(`Subtotal ${totalItemCount} Produk`, data.subtotal.toLocaleString('id-ID'), width);

  if (data.diskon && data.diskon > 0) {
    b.twoColumns('Diskon', `-${data.diskon.toLocaleString('id-ID')}`, width);
  }

  b.bold(true);
  b.twoColumns('Total Pembayaran', data.total_bayar.toLocaleString('id-ID'), width);
  b.bold(false);
  b.twoColumns('Dibayar', data.dibayar.toLocaleString('id-ID'), width);
  b.twoColumns('Kembalian', data.kembalian.toLocaleString('id-ID'), width);

  b.divider(width, '=');

  // 7. FOOTER STRUK
  b.alignCenter();
  b.line('Terimakasih');
  b.line('Instagram : kebabyasmin.id');
  b.line('Youtube : kebabyasmin');
  b.bold(true);
  b.line('*** TERBAYAR ***');
  b.bold(false);
  b.line(`<------- ${waktuCetak} ------->`);
  b.line();

  // 8. JEDA KERTAS / TIKET NOMOR ANTRIAN KHUSUS
  b.feed(2);
  b.line('+------------------------------+');
  b.bold(true);
  b.line('Nomor Antrian');
  b.line(formattedCabang);
  b.line();

  // Nomor Antrian Font Ekstra Besar & Tebal
  b.fontSize('huge');
  b.underline(true);
  b.line(` ${data.urutan} `);
  b.underline(false);
  b.fontSize('normal');
  b.bold(false);

  b.line();
  b.line('+------------------------------+');

  // 9. FEED & CUT
  b.feed(4);
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
 * Fungsi Utama: Cetak Struk via Web Bluetooth API (navigator.bluetooth)
 */
export async function printReceiptBluetooth(data: ReceiptDataForPrint): Promise<{ success: boolean; message: string }> {
  // 1. Cek dukungan Web Bluetooth di browser
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  if (!nav || !nav.bluetooth) {
    throw new Error(
      'Browser Anda belum mendukung Web Bluetooth API. Gunakan Google Chrome pada Android, Windows, macOS, atau ChromeOS.'
    );
  }

  // 2. Tampilkan dialog pairing perangkat Bluetooth
  let device: any = null;
  try {
    device = await nav.bluetooth.requestDevice({
      filters: [{ services: [PRINTER_SERVICES[0]] }],
      optionalServices: PRINTER_SERVICES,
    });
  } catch (filterErr: any) {
    // Jika filter spesifik gagal atau dibatalkan, coba minta seluruh perangkat Bluetooth
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

  // 3. Connect ke GATT Server
  const server = await device.gatt.connect();

  // 4. Cari Service dan Karakteristik Printer
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
      // Coba UUID service berikutnya
      continue;
    }
  }

  // Jika belum ditemukan di list predefined, telusuri semua service di perangkat
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

  // 5. Generate Byte-array ESC/POS
  const rawBytes = generateEscPosReceiptBytes(data);

  // 6. Kirim data cetak ke Printer secara chunked
  await sendBytesChunked(targetCharacteristic, rawBytes);

  // 7. Tunggu sesaat dan putuskan koneksi BLE dengan rapi
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (device.gatt.connected) {
    device.gatt.disconnect();
  }

  return {
    success: true,
    message: 'Struk berhasil dikirim ke printer thermal Bluetooth!',
  };
}
