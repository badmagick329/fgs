export const API = {
  register: '/api/register',
  registerStatus: '/api/register/status',
  alumniStories: '/api/alumni-stories',
  alumniStoryUploads: '/api/alumni-stories/uploads',
  alumniStorySubmit: '/api/alumni-stories/submit',
  admin: {
    login: '/api/admin/login',
    logout: '/api/admin/logout',
    refresh: '/api/admin/refresh',
    session: '/api/admin/session',
    setup: '/api/admin/setup',
    config: '/api/admin/config',
    users: '/api/admin/users',
    password: '/api/admin/password',
    userById: (id: number | string) => `/api/admin/users/${id}`,
  },
} as const;
