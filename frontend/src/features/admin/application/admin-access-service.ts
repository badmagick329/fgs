import {
  AuthorizedRouteAuth,
  IssuedTokens,
  RequireAdminRouteAuthResult,
  RouteAuthResult,
} from '@/features/admin/domain/auth';
import {
  IAdminRepository,
  ICookie,
  ILoginThrottle,
  IPasswordHasher,
  ISetupTokenVerifier,
} from '@/features/admin/domain/interfaces';
import { RequestAuthenticator } from '@/features/admin/domain/request-authenticator';
import { SessionIssuer } from '@/features/admin/domain/session-issuer';
import { NextResponse } from 'next/server';

export type LoginResult =
  | { ok: true; tokens: IssuedTokens }
  | { ok: false; status: 401; message: string }
  | { ok: false; status: 429; message: string; retryAfterSeconds: number };

const ADMIN_ALREADY_EXISTS = {
  ok: false as const,
  status: 400,
  message: 'Admin already exists.',
};

export class AdminAccessService {
  private dummyPasswordHash: Promise<string> | undefined;

  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly cookieService: ICookie,
    private readonly requestAuthenticator: RequestAuthenticator,
    private readonly sessionIssuer: SessionIssuer,
    private readonly loginThrottle: ILoginThrottle,
    private readonly setupTokenVerifier: ISetupTokenVerifier
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

  async login(input: {
    email: string;
    password: string;
    clientIp: string;
  }): Promise<LoginResult> {
    const keys = {
      email: input.email.trim().toLowerCase(),
      ip: input.clientIp,
    };

    // Checked before bcrypt so a locked-out guesser learns nothing, not even
    // from a correct password.
    const retryAfterSeconds = this.loginThrottle.retryAfterSeconds(keys);
    if (retryAfterSeconds > 0) {
      return {
        ok: false,
        status: 429,
        message: 'Too many failed sign-in attempts. Try again later.',
        retryAfterSeconds,
      };
    }

    const admin = await this.adminRepository.getAdminByEmail(keys.email);
    // Unknown emails still pay for a bcrypt compare, so response time does
    // not reveal which emails are admins.
    const isValid = await this.passwordHasher.verifyPassword(
      input.password,
      admin?.password_hash ?? (await this.getDummyPasswordHash())
    );

    if (!admin || !isValid) {
      this.loginThrottle.recordFailure(keys);
      return {
        ok: false,
        status: 401,
        message: 'Invalid email or password.',
      };
    }

    this.loginThrottle.recordSuccess(keys);
    const tokens = await this.sessionIssuer.issueAdminSession(admin);
    return { ok: true, tokens };
  }

  /** Setup is off unless ADMIN_SETUP_TOKEN is configured. */
  isSetupEnabled() {
    return this.setupTokenVerifier.isEnabled();
  }

  async setupInitialAdmin(input: {
    email: string;
    password: string;
    setupToken: string;
  }) {
    if (!this.setupTokenVerifier.matches(input.setupToken)) {
      return {
        ok: false as const,
        status: 403,
        message: 'Invalid setup token.',
      };
    }

    // Saves a bcrypt hash in the common case; createFirstAdminUser is the
    // real guard against concurrent setups.
    const adminCount = await this.adminRepository.countAdmins();
    if (adminCount > 0) {
      return ADMIN_ALREADY_EXISTS;
    }

    const passwordHash = await this.passwordHasher.hashPassword(input.password);
    const admin = await this.adminRepository.createFirstAdminUser(
      input.email,
      passwordHash
    );
    if (!admin) {
      return ADMIN_ALREADY_EXISTS;
    }
    const tokens = await this.sessionIssuer.issueAdminSession(admin);

    return { ok: true as const, tokens };
  }

  /**
   * Hashed with the configured cost, so a compare against it takes as long
   * as one against a real admin's hash. Built once, on first need.
   */
  private getDummyPasswordHash() {
    this.dummyPasswordHash ??= this.passwordHasher.hashPassword(
      'no-admin-has-this-password'
    );
    return this.dummyPasswordHash;
  }

  async refreshSession(rawRefreshToken: string) {
    return this.sessionIssuer.refreshSession(rawRefreshToken);
  }

  async logout(rawRefreshToken: string | undefined) {
    if (rawRefreshToken) {
      await this.sessionIssuer.revokeRefreshTokenFromRawToken(rawRefreshToken);
    }
  }

  setAuthCookies(
    res: NextResponse,
    accessToken: string,
    refreshToken?: string
  ) {
    this.cookieService.setAuthCookies(res, accessToken, refreshToken);
  }

  clearAuthCookies(res: NextResponse) {
    this.cookieService.clearAuthCookies(res);
  }
}
