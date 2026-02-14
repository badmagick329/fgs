export const AUTH_COOKIE_KEYS = {
  access: 'admin_access',
  refresh: 'admin_refresh',
} as const;

export const AUTH_TTL = {
  accessSeconds: 60 * 15,
  refreshDays: 60,
} as const;

export const AUTH_TOKEN = {
  refreshBytes: 32,
} as const;
