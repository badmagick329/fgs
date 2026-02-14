import 'server-only';

const DEFAULT_TEST_DATABASE_URL =
  'postgresql://testuser:testpassword@localhost:5433/testdb';

export class EnvConfig {
  getDatabaseUrl() {
    if (process.env.NODE_ENV === 'test') {
      return process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
    }
    return process.env.DATABASE_URL;
  }

  getAdminJwtSecret() {
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      throw new Error('ADMIN_JWT_SECRET is not set.');
    }
    return secret;
  }

  getPasswordSaltRounds(defaultRounds = 20) {
    return Number(process.env.PASSWORD_SALT_ROUNDS ?? defaultRounds);
  }

  getDiscordWebhookUrl() {
    return process.env.DISCORD_WEBHOOK_URL;
  }

  isProduction() {
    return process.env.NODE_ENV === 'production';
  }
}
