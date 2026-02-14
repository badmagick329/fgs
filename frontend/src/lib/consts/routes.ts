export const ROUTES = {
  registrations: '/registrations',
  admin: {
    root: '/admin',
    login: '/admin/login',
    setup: '/admin/setup',
    users: '/admin/users',
  },
} as const;

export const MIDDLEWARE_PATHS = {
  matcher: [ROUTES.registrations, '/admin/:path*'],
  publicPrefixes: [ROUTES.admin.login, ROUTES.admin.setup],
  protectedPrefixes: [`${ROUTES.admin.root}/`],
} as const;
