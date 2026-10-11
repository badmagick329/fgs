import { getServerContainer } from '@/lib/server/container';

/**
 * tus endpoint for alumni story media. GET is not exported on purpose: staged
 * uploads are never served back.
 */
const handle = (req: Request) =>
  getServerContainer().alumniStoryUploads.server.handleWeb(req);

export {
  handle as DELETE,
  handle as HEAD,
  handle as OPTIONS,
  handle as PATCH,
  handle as POST,
};
