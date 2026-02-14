import { AccessTokenPayload } from '@/types/auth';
import { SignJWT, jwtVerify } from 'jose';
import 'server-only';
import { ACCESS_TOKEN_TTL_SECONDS } from '@/lib/consts';

export const getJwtSecret = () => {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET is not set.');
  }
  return new TextEncoder().encode(secret);
};

export async function signAccessToken(payload: AccessTokenPayload) {
  const secret = getJwtSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAccessToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as AccessTokenPayload;
}
