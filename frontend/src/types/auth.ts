import { NextResponse } from 'next/server';

export type AdminUser = {
  id: number;
  email: string;
  password_hash: string;
};
export type AdminAuthUser = {
  id: number;
  email: string;
  is_super_admin: boolean;
};
export type AdminUserListRow = {
  id: number;
  email: string;
  created_at: Date;
  is_super_admin: boolean;
};
export type AdminConfigRow = {
  id: number;
  notification_email: string;
  updated_by_admin_user_id: number;
  updated_at: Date;
  updated_by_email: string;
};
export type RefreshTokenRow = {
  id: number;
  admin_user_id: number;
  token_hash: string;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_token_id: number | null;
};
export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
};
export type RouteAuthResult = {
  payload: AccessTokenPayload | null;
  refreshedTokens: RefreshedTokens | null;
  needsClear: boolean;
};
export type AuthorizedRouteAuth = RouteAuthResult & {
  payload: AccessTokenPayload;
};
export type RouteAuthFailure = {
  ok: false;
  response: NextResponse;
};
export type RouteAuthSuccess = {
  ok: true;
  auth: AuthorizedRouteAuth;
};
export type RequireAdminRouteAuthResult = RouteAuthFailure | RouteAuthSuccess;
export type AccessTokenPayload = {
  sub: string;
  email: string;
};
export class AdminActionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminActionError';
    this.status = status;
  }
}
