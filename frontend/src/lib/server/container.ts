import { AdminAccessService } from '@/features/admin/application/admin-access-service';
import { AdminManagementService } from '@/features/admin/application/admin-management-service';
import { RequestAuthenticator } from '@/features/admin/domain/request-authenticator';
import { SessionIssuer } from '@/features/admin/domain/session-issuer';
import { SuperAdminPolicy } from '@/features/admin/domain/super-admin-policy';
import { AdminRepository } from '@/features/admin/infrastructure/admin-repository';
import { Cookie } from '@/features/admin/infrastructure/cookie';
import { LoginThrottle } from '@/features/admin/infrastructure/login-throttle';
import { PasswordHasher } from '@/features/admin/infrastructure/password-hasher';
import { SetupTokenVerifier } from '@/features/admin/infrastructure/setup-token-verifier';
import { Token } from '@/features/admin/infrastructure/token';
import { AlumniStoryService } from '@/features/alumni-stories/application/alumni-story-service';
import { AlumniStoryRepository } from '@/features/alumni-stories/infrastructure/alumni-story-repository';
import { LocalMediaStore } from '@/features/alumni-stories/infrastructure/local-media-store';
import { StatfsDiskSpace } from '@/features/alumni-stories/infrastructure/statfs-disk-space';
import { createAlumniStoryUploadEndpoints } from '@/features/alumni-stories/infrastructure/tus-upload-server';
import { PostgresHealthCheck } from '@/features/health/infrastructure/postgres-health-check';
import { RegistrationAntiSpamService } from '@/features/registration/application/registration-anti-spam-service';
import { RegistrationService } from '@/features/registration/application/registration-service';
import { RegistrationRepository } from '@/features/registration/infrastructure/registration-repository';
import path from 'node:path';
import { Pool } from 'pg';
import 'server-only';
import { Clock } from '@/lib/server/clock';
import { EnvConfig } from '@/lib/server/env-config';
import { ICaptchaVerifier } from '@/lib/server/i-captcha-verifier';
import { INotifier } from '@/lib/server/i-notifier';
import { Notifier } from '@/lib/server/notifier';
import { RateLimiter } from '@/lib/server/rate-limiter';
import { TurnstileVerifier } from '@/lib/server/turnstile-verifier';

/**
 * Drafts per IP: room for a family or an event sharing one connection, and
 * for the many phones a mobile carrier puts behind one address. Turnstile on
 * the draft API is what stops scripts; this only blunts a burst.
 */
const ALUMNI_STORY_DRAFT_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 10 * 60 * 1000,
  blockMs: 10 * 60 * 1000,
};

type AlumniStoryUploadEndpoints = ReturnType<
  typeof createAlumniStoryUploadEndpoints
>;

export type ServerContainer = {
  healthCheck: PostgresHealthCheck;
  adminAccessService: AdminAccessService;
  alumniStoryService: AlumniStoryService;
  alumniStoryUploads: AlumniStoryUploadEndpoints['alumniStoryUploads'];
  editedVideoUploads: AlumniStoryUploadEndpoints['editedVideoUploads'];
  alumniStoryDraftRateLimiter: RateLimiter;
  alumniStoryCaptchaVerifier: ICaptchaVerifier;
  adminManagementService: AdminManagementService;
  notifier: INotifier;
  registrationService: RegistrationService;
  registrationAntiSpamService: RegistrationAntiSpamService;
};

const createServerContainer = (): ServerContainer => {
  const envConfig = new EnvConfig();
  const pool = new Pool({
    connectionString: envConfig.getDatabaseUrl(),
  });

  const clock = new Clock();
  const adminRepository = new AdminRepository(pool);
  const registrationRepository = new RegistrationRepository(pool);
  const passwordHasher = new PasswordHasher(envConfig.getPasswordSaltRounds());
  const tokenService = new Token(envConfig.getAdminJwtSecret());
  const cookieService = new Cookie(envConfig.isProduction());
  const notifier = new Notifier(envConfig.getDiscordWebhookUrl(), clock);

  const sessionIssuer = new SessionIssuer(adminRepository, tokenService);
  const requestAuthenticator = new RequestAuthenticator(
    cookieService,
    tokenService,
    sessionIssuer
  );
  const superAdminPolicy = new SuperAdminPolicy(adminRepository);

  // Built on first use so a missing MEDIA_ROOT or Turnstile key only breaks
  // Alumni Connect, not admin or registration.
  let alumniStoryService: AlumniStoryService | undefined;
  let alumniStoryUploadEndpoints: AlumniStoryUploadEndpoints | undefined;
  // Built together: both endpoints draw on one disk budget.
  const uploadEndpoints = (stories: AlumniStoryService) => {
    if (alumniStoryUploadEndpoints) return alumniStoryUploadEndpoints;
    // Inside the media volume, so half-done uploads survive a redeploy.
    const mediaRoot = envConfig.getMediaRoot();
    const alumniMedia = path.join(mediaRoot, '.incoming');
    alumniStoryUploadEndpoints = createAlumniStoryUploadEndpoints({
      stories,
      directories: {
        alumniMedia,
        editedVideos: path.join(mediaRoot, '.incoming-edited'),
      },
      // The tus store creates the folder, so it exists by the first check.
      diskSpace: new StatfsDiskSpace(alumniMedia),
      notifier,
      clock,
    });
    return alumniStoryUploadEndpoints;
  };
  let alumniStoryCaptchaVerifier: ICaptchaVerifier | undefined;

  return {
    healthCheck: new PostgresHealthCheck(envConfig.getDatabaseUrl()),
    get alumniStoryService() {
      alumniStoryService ??= new AlumniStoryService(
        new AlumniStoryRepository(pool),
        new LocalMediaStore(envConfig.getMediaRoot()),
        clock
      );
      return alumniStoryService;
    },
    get alumniStoryUploads() {
      return uploadEndpoints(this.alumniStoryService).alumniStoryUploads;
    },
    get editedVideoUploads() {
      return uploadEndpoints(this.alumniStoryService).editedVideoUploads;
    },
    get alumniStoryCaptchaVerifier() {
      alumniStoryCaptchaVerifier ??= new TurnstileVerifier(
        envConfig.getTurnstileSecretKey()
      );
      return alumniStoryCaptchaVerifier;
    },
    alumniStoryDraftRateLimiter: new RateLimiter(
      clock,
      ALUMNI_STORY_DRAFT_RATE_LIMIT
    ),
    adminAccessService: new AdminAccessService(
      adminRepository,
      passwordHasher,
      cookieService,
      requestAuthenticator,
      sessionIssuer,
      new LoginThrottle(clock),
      new SetupTokenVerifier(envConfig.getAdminSetupToken())
    ),
    adminManagementService: new AdminManagementService(
      adminRepository,
      passwordHasher,
      superAdminPolicy
    ),
    notifier,
    registrationService: new RegistrationService(
      registrationRepository,
      notifier
    ),
    registrationAntiSpamService: new RegistrationAntiSpamService(clock),
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __fgsServerContainer: ServerContainer | undefined;
}

let productionContainer: ServerContainer | undefined;

export const getServerContainer = (): ServerContainer => {
  if (process.env.NODE_ENV === 'production') {
    if (!productionContainer) {
      productionContainer = createServerContainer();
    }
    return productionContainer;
  }

  if (!globalThis.__fgsServerContainer) {
    globalThis.__fgsServerContainer = createServerContainer();
  }

  return globalThis.__fgsServerContainer;
};
