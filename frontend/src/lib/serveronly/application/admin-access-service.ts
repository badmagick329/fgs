import { NextResponse } from 'next/server';
import {
  AuthorizedRouteAuth,
  RequireAdminRouteAuthResult,
  RouteAuthResult,
} from '@/types/auth';
import {
  IAdminRepository,
  ICookie,
  IPasswordHasher,
} from '@/lib/serveronly/domain/interfaces';
import {
  RequestAuthenticator,
} from '@/lib/serveronly/domain/request-authenticator';
import { SessionIssuer } from '@/lib/serveronly/domain/session-issuer';

export class AdminAccessService {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly cookieService: ICookie,
    private readonly requestAuthenticator: RequestAuthenticator,
    private readonly sessionIssuer: SessionIssuer
  ) {}

  async countAdmins() {
    return this.adminRepository.countAdmins();
  }

  async getAdminRouteAuth(): Promise<RouteAuthResult> {
    return this.requestAuthenticator.getRouteAuth();
  }

  unauthorizedJson(opts?: { clearCookies?: boolean }) {
    const res = NextResponse.json(
      { ok: false as const, message: 'Unauthorized.' },
      { status: 401 }
    );

    if (opts?.clearCookies) {
      this.cookieService.clearAuthCookies(res);
    }

    return res;
  }

  async requireAdminRouteAuth(opts?: {
    clearCookies?: 'auto' | boolean;
  }): Promise<RequireAdminRouteAuthResult> {
    const auth = await this.getAdminRouteAuth();
    if (!auth.payload) {
      const clearCookies =
        opts?.clearCookies === 'auto' || opts?.clearCookies === undefined
          ? auth.needsClear
          : opts.clearCookies;

      return {
        ok: false,
        response: this.unauthorizedJson({ clearCookies }),
      };
    }

    return {
      ok: true,
      auth: auth as AuthorizedRouteAuth,
    };
  }

  applyRefreshedAuthCookies(
    res: NextResponse,
    refreshedTokens: RouteAuthResult['refreshedTokens']
  ) {
    if (!refreshedTokens) {
      return;
    }

    this.cookieService.setAuthCookies(
      res,
      refreshedTokens.accessToken,
      refreshedTokens.refreshToken
    );
  }

  async login(input: { email: string; password: string }) {
    const admin = await this.adminRepository.getAdminByEmail(input.email);
    if (!admin) {
      return { ok: false as const, status: 401, message: 'Invalid email or password.' };
    }

    const isValid = await this.passwordHasher.verifyPassword(
      input.password,
      admin.password_hash
    );

    if (!isValid) {
      return { ok: false as const, status: 401, message: 'Invalid email or password.' };
    }

    const tokens = await this.sessionIssuer.issueAdminSession(admin);
    return { ok: true as const, tokens };
  }

  async setupInitialAdmin(input: { email: string; password: string }) {
    const adminCount = await this.adminRepository.countAdmins();
    if (adminCount > 0) {
      return { ok: false as const, status: 400, message: 'Admin already exists.' };
    }

    const passwordHash = await this.passwordHasher.hashPassword(input.password);
    const admin = await this.adminRepository.createAdminUser(
      input.email,
      passwordHash,
      true
    );
    const tokens = await this.sessionIssuer.issueAdminSession(admin);

    return { ok: true as const, tokens };
  }

  async refreshSession(rawRefreshToken: string) {
    return this.sessionIssuer.refreshSession(rawRefreshToken);
  }

  async logout(rawRefreshToken: string | undefined) {
    if (rawRefreshToken) {
      await this.sessionIssuer.revokeRefreshTokenFromRawToken(rawRefreshToken);
    }
  }

  setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string) {
    this.cookieService.setAuthCookies(res, accessToken, refreshToken);
  }

  clearAuthCookies(res: NextResponse) {
    this.cookieService.clearAuthCookies(res);
  }
}


