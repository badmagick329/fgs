import { AccessTokenPayload, RefreshedTokens } from '@/types/auth';

export type RouteAuthState = {
  payload: AccessTokenPayload | null;
  refreshedTokens: RefreshedTokens | null;
  needsClear: boolean;
};
