import 'server-only';

export class EnvConfig {
  getDatabaseUrl() {
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
