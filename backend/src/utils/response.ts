import { Response } from 'express';

// Polyfill BigInt serialization in JSON.stringify
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}

/**
 * Standardized API success response
 */
export function successResponse(res: Response, message: string, data?: any, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
  });
}

/**
 * Standardized API error response
 */
export function errorResponse(res: Response, message: string, statusCode = 400, errors?: any) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  });
}
