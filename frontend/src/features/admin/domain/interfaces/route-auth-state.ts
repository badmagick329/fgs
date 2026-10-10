import {
  AccessTokenPayload,
  RefreshedTokens,
} from '@/features/admin/domain/auth';

export type RouteAuthState = {
  payload: AccessTokenPayload | null;
  refreshedTokens: RefreshedTokens | null;
  needsClear: boolean;
};
