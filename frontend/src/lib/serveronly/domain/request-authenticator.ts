import { AUTH_COOKIE_KEYS } from '@/lib/consts';
import {
  ICookie,
  RouteAuthState,
  IToken,
} from '@/lib/serveronly/domain/interfaces';
import { RefreshedTokens } from '@/types/auth';
import { SessionIssuer } from './session-issuer';

export class RequestAuthenticator {
  constructor(
    private readonly cookieService: ICookie,
    private readonly tokenService: IToken,
    private readonly sessionIssuer: SessionIssuer
  ) {}

  async getRouteAuth(): Promise<RouteAuthState> {
    const accessToken = await this.cookieService.get(AUTH_COOKIE_KEYS.access);
    let refreshedTokens: RefreshedTokens | null = null;
    let payload: RouteAuthState['payload'] = null;

    if (accessToken) {
      try {
        payload = await this.tokenService.verifyAccessToken(accessToken);
      } catch {
        // fall through to refresh flow
      }
    }

    if (!payload) {
      const refreshCookie = await this.cookieService.get(AUTH_COOKIE_KEYS.refresh);
      if (!refreshCookie) {
        return { payload: null, refreshedTokens: null, needsClear: true };
      }

      refreshedTokens = await this.sessionIssuer.refreshSession(refreshCookie);
      if (!refreshedTokens) {
        return { payload: null, refreshedTokens: null, needsClear: true };
      }

      try {
        payload = await this.tokenService.verifyAccessToken(
          refreshedTokens.accessToken
        );
      } catch {
        return { payload: null, refreshedTokens: null, needsClear: true };
      }
    }

    return { payload, refreshedTokens, needsClear: false };
  }
}


