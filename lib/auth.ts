import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  walletAddress: string;
  iat?: number;
}

export function verifyToken(authHeader: string | undefined): JwtPayload | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
