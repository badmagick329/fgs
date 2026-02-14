import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import 'server-only';
import { REFRESH_TOKEN_BYTES, REFRESH_TOKEN_TTL_DAYS } from '@/lib/consts';

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateRefreshToken() {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

export function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiresAt() {
  const expires = new Date();
  expires.setDate(expires.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expires;
}
