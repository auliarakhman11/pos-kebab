import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthJwtPayload } from '../types/auth.types';

declare global {
  namespace Express {
    interface Request {
      kasir?: AuthJwtPayload;
    }
  }
}

/**
 * Middleware untuk memvalidasi Access Token JWT.
 * Mengembalikan code: 'TOKEN_EXPIRED' jika token kedaluwarsa agar client tahu harus me-refresh token.
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Token autentikasi tidak ditemukan.',
      code: 'NO_TOKEN',
    });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'kebab_yasmin_secret_key_2026';

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthJwtPayload;
    req.kasir = decoded;
    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Sesi token telah kedaluwarsa.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Token autentikasi tidak valid.',
      code: 'INVALID_TOKEN',
    });
  }
}

export const authMiddleware = verifyToken;
export default verifyToken;
