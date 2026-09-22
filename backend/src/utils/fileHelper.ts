import fs from 'fs';
import path from 'path';

/**
 * Menyimpan data image base64 ke folder lokal (img_outlet atau img_kry)
 * Persis seperti logika PHP Laravel: file_put_contents($file, $image_base64)
 */
export function saveBase64Image(base64Str: string | undefined | null, subFolder: 'img_outlet' | 'img_kry', filename: string): string | null {
  if (!base64Str || typeof base64Str !== 'string') return null;

  try {
    const publicDir = path.resolve(__dirname, '../../public', subFolder);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Ekstrak bagian base64 setelah header data:image/...;base64,
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const base64Data = matches ? matches[2] : base64Str;
    const buffer = Buffer.from(base64Data, 'base64');

    const filePath = path.join(publicDir, filename);
    fs.writeFileSync(filePath, buffer);

    return filename;
  } catch (error) {
    console.error(`Gagal menyimpan foto ke ${subFolder}/${filename}:`, error);
    return null;
  }
}

/**
 * Helper zona waktu presisi berdasarkan data kasir:
 * - Asia/Jakarta: Waktu Indonesia Barat (WIB, UTC+7)
 * - Asia/Makassar: Waktu Indonesia Tengah (WITA, UTC+8)
 * Berlaku untuk penentuan tanggal (tgl) dan timestamp (created_at, updated_at).
 */
export function getZonaWaktu(timeZone?: string | null) {
  const tz = (timeZone && (timeZone.toLowerCase().includes('jakarta') || timeZone.toLowerCase().includes('wib')))
    ? 'Asia/Jakarta'
    : 'Asia/Makassar';

  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const year = map.year;
  const month = map.month;
  const day = map.day;
  let hour = map.hour === '24' ? '00' : map.hour;
  const minute = map.minute;
  const second = map.second;

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}:${second}`;

  const zonaWaktu = new Date(`${dateStr}T${timeStr}.000Z`);
  const zonaTanggal = new Date(`${dateStr}T00:00:00.000Z`);

  return {
    timeZone: tz,
    zonaWaktu,
    zonaTanggal,
    dateStr,
    timeStr,
    now,
  };
}

/**
 * Format tanggal & waktu struk sesuai zona waktu kasir (Contoh: "22/09/2026 01:47")
 */
export function formatReceiptDate(d: Date = new Date(), timeZone?: string | null): string {
  const tz = (timeZone && (timeZone.toLowerCase().includes('jakarta') || timeZone.toLowerCase().includes('wib')))
    ? 'Asia/Jakarta'
    : 'Asia/Makassar';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  let hour = map.hour === '24' ? '00' : map.hour;

  return `${map.day}/${map.month}/${map.year} ${hour}:${map.minute}`;
}

