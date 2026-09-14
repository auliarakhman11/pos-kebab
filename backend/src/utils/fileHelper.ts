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
 * Helper zona waktu sesuai controller Laravel lama
 */
export function getZonaWaktu(timeZone?: string | null) {
  const now = new Date();
  if (timeZone === 'Asia/Jakarta') {
    now.setHours(now.getHours() - 1);
  }

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;

  const zonaTanggal = new Date(`${dateStr}T00:00:00.000Z`);

  return {
    zonaWaktu: now,
    zonaTanggal,
    dateStr,
    timeStr,
  };
}
