import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthJwtPayload } from '../types/auth.types';
import { errorResponse } from '../utils/response';

// Perluas interface Request Express agar mengenali properti kasir
declare global {
  namespace Express {
    interface Request {
      kasir?: AuthJwtPayload;
    }
  }
}

/**
 * Middleware untuk memverifikasi token JWT pada protected routes
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Akses ditolak: Token autentikasi tidak ditemukan.', 401);
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'kebab_yasmin_secret_key_2026';

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthJwtPayload;
    req.kasir = decoded;
    return next();
  } catch (error) {
    return errorResponse(res, 'Sesi telah berakhir atau token tidak valid. Silakan login kembali.', 401);
  }
}
