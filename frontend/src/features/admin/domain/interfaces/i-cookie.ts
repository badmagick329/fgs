import { NextResponse } from 'next/server';

export interface ICookie {
  get(name: string): Promise<string | undefined>;
  setAuthCookies(
    res: NextResponse,
    accessToken: string,
    refreshToken: string
  ): void;
  clearAuthCookies(res: NextResponse): void;
}
