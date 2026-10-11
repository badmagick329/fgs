import { NextResponse } from 'next/server';
import { getServerContainer } from '@/lib/server/container';

/**
 * tus endpoint for edited videos. Every method needs an admin session, since
 * the tus server behind it checks nothing about who is uploading. GET is not
 * exported: staged uploads are never served back.
 */
async function handle(req: Request) {
  const { adminAccessService, editedVideoUploads } = getServerContainer();
  const authResult = await adminAccessService.requireAdminRouteAuth();
  if (!authResult.ok) return authResult.response;
  const { refreshedTokens } = authResult.auth;

  const res = await editedVideoUploads.server.handleWeb(req);
  if (!refreshedTokens) return res;
  const withCookies = new NextResponse(res.body, res);
  adminAccessService.applyRefreshedAuthCookies(withCookies, refreshedTokens);
  return withCookies;
}

export {
  handle as DELETE,
  handle as HEAD,
  handle as OPTIONS,
  handle as PATCH,
  handle as POST,
};
