import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { LoginDto, AuthJwtPayload, UserSessionData } from '../types/auth.types';

export class AuthService {
  /**
   * Autentikasi kasir & validasi operasional cabang
   */
  async login(payload: LoginDto): Promise<{ token: string; session: UserSessionData }> {
    const { username, password } = payload;

    if (!username || !password) {
      const error: any = new Error('Username dan password wajib diisi.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Cari kasir dan sertakan data cabang
    const user = await prisma.usersKasir.findFirst({
      where: {
        username: username.trim(),
      },
      include: {
        cabang: true,
      },
    });

    if (!user) {
      const error: any = new Error('Username atau password tidak valid.');
      error.statusCode = 401;
      throw error;
    }

    // 2. Verifikasi Password (Mendukung bcrypt standar Laravel $2y$/$2a$ maupun fallback plaintext)
    let isPasswordValid = false;
    if (user.password.startsWith('$2y$') || user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      const normalizedHash = user.password.replace(/^\$2y\$/, '$2a$');
      isPasswordValid = await bcrypt.compare(password, normalizedHash);
    } else {
      isPasswordValid = user.password === password;
    }

    if (!isPasswordValid) {
      const error: any = new Error('Username atau password tidak valid.');
      error.statusCode = 401;
      throw error;
    }

    // 3. Validasi Keberadaan Cabang
    if (!user.cabang) {
      const error: any = new Error('Akses ditolak: Akun kasir belum terhubung ke cabang manapun.');
      error.statusCode = 403;
      throw error;
    }

    // 4. Validasi Status Cabang: cabang.off === 0 (jika off === 1 / toko tutup / dinonaktifkan, tolak)
    if (user.cabang.off === 1) {
      const error: any = new Error(
        `Akses ditolak: Cabang '${user.cabang.nama}' sedang NONAKTIF (Toko Tutup). Silakan hubungi supervisor.`
      );
      error.statusCode = 403;
      throw error;
    }

    // 5. Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'kebab_yasmin_secret_key_2026';
    const jwtPayload: AuthJwtPayload = {
      id: user.id,
      name: user.name,
      username: user.username,
      cabang_id: user.cabang_id,
      cabang_nama: user.cabang.nama,
    };

    const token = jwt.sign(jwtPayload, jwtSecret, { expiresIn: '24h' });

    return {
      token,
      session: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          cabang_id: user.cabang_id,
        },
        cabang: {
          id: user.cabang.id,
          nama: user.cabang.nama,
          alamat: user.cabang.alamat,
          kota_id: user.cabang.kota_id,
          off: user.cabang.off,
        },
      },
    };
  }
}

export const authService = new AuthService();
export default authService;
