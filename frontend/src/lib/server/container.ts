import { AdminAccessService } from '@/features/admin/application/admin-access-service';
import { AdminManagementService } from '@/features/admin/application/admin-management-service';
import { RequestAuthenticator } from '@/features/admin/domain/request-authenticator';
import { SessionIssuer } from '@/features/admin/domain/session-issuer';
import { SuperAdminPolicy } from '@/features/admin/domain/super-admin-policy';
import { AdminRepository } from '@/features/admin/infrastructure/admin-repository';
import { Cookie } from '@/features/admin/infrastructure/cookie';
import { PasswordHasher } from '@/features/admin/infrastructure/password-hasher';
import { Token } from '@/features/admin/infrastructure/token';
import { RegistrationAntiSpamService } from '@/features/registration/application/registration-anti-spam-service';
import { RegistrationService } from '@/features/registration/application/registration-service';
import { RegistrationRepository } from '@/features/registration/infrastructure/registration-repository';
import { Pool } from 'pg';
import 'server-only';
import { Clock } from '@/lib/server/clock';
import { EnvConfig } from '@/lib/server/env-config';
import { Notifier } from '@/lib/server/notifier';

export type ServerContainer = {
  adminAccessService: AdminAccessService;
  adminManagementService: AdminManagementService;
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

  return {
    adminAccessService: new AdminAccessService(
      adminRepository,
      passwordHasher,
      cookieService,
      requestAuthenticator,
      sessionIssuer
    ),
    adminManagementService: new AdminManagementService(
      adminRepository,
      passwordHasher,
      superAdminPolicy
    ),
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
