import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { LoginDto, AuthJwtPayload, UserSessionData } from '../types/auth.types';

export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'kebab_yasmin_secret_key_2026';
  private readonly jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'kebab_yasmin_refresh_secret_2026';

  /**
   * Autentikasi kasir, simpan refresh token ke database, & kembalikan access + refresh token
   */
  async login(payload: LoginDto): Promise<{ accessToken: string; refreshToken: string; session: UserSessionData }> {
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

    // 2. Verifikasi Password (bcrypt standar Laravel $2y$/$2a$ maupun fallback plaintext)
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

    // 4. Validasi Status Cabang (off === 0)
    if (user.cabang.off === 1) {
      const error: any = new Error(
        `Akses ditolak: Cabang '${user.cabang.nama}' sedang NONAKTIF (Toko Tutup). Silakan hubungi supervisor.`
      );
      error.statusCode = 403;
      throw error;
    }

    // 5. Generate Access Token (1 jam) & Refresh Token (7 hari)
    const jwtPayload: AuthJwtPayload = {
      id: user.id,
      name: user.name,
      username: user.username,
      cabang_id: user.cabang_id,
      cabang_nama: user.cabang.nama,
    };

    const accessToken = jwt.sign(jwtPayload, this.jwtSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign(
      { id: user.id, username: user.username },
      this.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    // 6. Simpan Refresh Token ke database users_kasir
    await prisma.usersKasir.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken },
    });

    return {
      accessToken,
      refreshToken,
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

  /**
   * Validasi refresh token dari database & generate access token baru
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      const error: any = new Error('Refresh token wajib disertakan.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Verifikasi tanda tangan JWT Refresh Token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, this.jwtRefreshSecret);
    } catch (err: any) {
      const error: any = new Error('Refresh token telah kedaluwarsa atau tidak valid. Silakan login kembali.');
      error.statusCode = 401;
      error.code = 'REFRESH_TOKEN_EXPIRED';
      throw error;
    }

    // 2. Cek user di database dan pastikan refresh_token cocok
    const user = await prisma.usersKasir.findUnique({
      where: { id: Number(decoded.id) },
      include: { cabang: true },
    });

    if (!user || user.refresh_token !== refreshToken) {
      const error: any = new Error('Refresh token tidak cocok atau telah dicabut. Silakan login kembali.');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    // 3. Pastikan cabang tetap aktif
    if (user.cabang && user.cabang.off === 1) {
      const error: any = new Error(`Cabang '${user.cabang.nama}' saat ini dinonaktifkan.`);
      error.statusCode = 403;
      throw error;
    }

    // 4. Generate Access Token baru (1 jam)
    const jwtPayload: AuthJwtPayload = {
      id: user.id,
      name: user.name,
      username: user.username,
      cabang_id: user.cabang_id,
      cabang_nama: user.cabang?.nama,
    };

    const newAccessToken = jwt.sign(jwtPayload, this.jwtSecret, { expiresIn: '1h' });

    return { accessToken: newAccessToken };
  }

  /**
   * Ambil daftar kasir dari cabang yang aktif (cabang.off === 0)
   */
  async getActiveKasirList() {
    return prisma.usersKasir.findMany({
      where: {
        cabang: {
          off: 0,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        cabang_id: true,
        cabang: {
          select: {
            id: true,
            nama: true,
            kota_id: true,
            off: true,
          },
        },
      },
      orderBy: [
        { cabang: { nama: 'asc' } },
        { name: 'asc' },
      ],
    });
  }
}

export const authService = new AuthService();
export default authService;
