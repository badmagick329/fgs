import path from 'node:path';
import 'server-only';

const DEFAULT_TEST_DATABASE_URL =
  'postgresql://testuser:testpassword@localhost:5433/testdb';

// Cloudflare's published test keys: the widget always passes, and siteverify
// accepts any token. Fine outside production only.
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

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

  /**
   * Root directory for uploaded media. Production must name it explicitly:
   * a silent default inside the container would lose uploads on redeploy.
   */
  getMediaRoot() {
    const root = process.env.MEDIA_ROOT;
    if (root) return root;
    if (this.isProduction()) {
      throw new Error('MEDIA_ROOT is not set.');
    }
    return path.resolve(process.cwd(), '.media');
  }

  getTurnstileSiteKey() {
    return this.requiredInProduction(
      'TURNSTILE_SITE_KEY',
      TURNSTILE_TEST_SITE_KEY
    );
  }

  getTurnstileSecretKey() {
    return this.requiredInProduction(
      'TURNSTILE_SECRET_KEY',
      TURNSTILE_TEST_SECRET_KEY
    );
  }

  /** Test keys would let every bot through, so production must set its own. */
  private requiredInProduction(name: string, fallback: string) {
    const value = process.env[name];
    if (value) return value;
    if (this.isProduction()) {
      throw new Error(`${name} is not set.`);
    }
    return fallback;
  }

  isProduction() {
    return process.env.NODE_ENV === 'production';
  }
}
