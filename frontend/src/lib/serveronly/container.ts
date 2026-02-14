import { Pool } from 'pg';
import 'server-only';
import { AdminAccessService } from '@/lib/serveronly/application/admin-access-service';
import { AdminManagementService } from '@/lib/serveronly/application/admin-management-service';
import { RegistrationService } from '@/lib/serveronly/application/registration-service';
import { RequestAuthenticator } from '@/lib/serveronly/domain/request-authenticator';
import { SessionIssuer } from '@/lib/serveronly/domain/session-issuer';
import { SuperAdminPolicy } from '@/lib/serveronly/domain/super-admin-policy';
import { PasswordHasher } from '@/lib/serveronly/infrastructure/password-hasher';
import { Notifier } from '@/lib/serveronly/infrastructure/notifier';
import { EnvConfig } from '@/lib/serveronly/infrastructure/env-config';
import { Token } from '@/lib/serveronly/infrastructure/token';
import { Cookie } from '@/lib/serveronly/infrastructure/cookie';
import { AdminRepository } from '@/lib/serveronly/infrastructure/admin-repository';
import { RegistrationRepository } from '@/lib/serveronly/infrastructure/registration-repository';
import { Clock } from '@/lib/serveronly/infrastructure/clock';

export type ServerContainer = {
  adminAccessService: AdminAccessService;
  adminManagementService: AdminManagementService;
  registrationService: RegistrationService;
};

const createServerContainer = (): ServerContainer => {
  const envConfig = new EnvConfig();
  const pool = new Pool({
    connectionString: envConfig.getDatabaseUrl(),
  });

  const clock = new Clock();
  const adminRepository = new AdminRepository(pool);
  const registrationRepository = new RegistrationRepository(pool);
  const passwordHasher = new PasswordHasher(
    envConfig.getPasswordSaltRounds()
  );
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
    registrationService: new RegistrationService(registrationRepository, notifier),
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

