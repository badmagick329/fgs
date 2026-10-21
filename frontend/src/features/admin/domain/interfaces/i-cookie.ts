import { NextResponse } from 'next/server';

export interface ICookie {
  get(name: string): Promise<string | undefined>;
  setAuthCookies(
    res: NextResponse,
    accessToken: string,
    /** Omitted: the refresh cookie is left as it is. */
    refreshToken?: string
  ): void;
  clearAuthCookies(res: NextResponse): void;
}
