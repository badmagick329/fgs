import { AccessTokenPayload } from '@/types/auth';
import { jwtVerify } from 'jose';

export class AccessToken {
  constructor(private readonly jwtSecret: string) {}

  async verify(token: string): Promise<AccessTokenPayload> {
    const secret = new TextEncoder().encode(this.jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    return payload as AccessTokenPayload;
  }
}
