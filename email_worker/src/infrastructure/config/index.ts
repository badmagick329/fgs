import type { IConfig as IEmailConfigReader } from '@/domain';
import {
  type DatabaseConfig,
  type EmailConfig,
  databaseConfigSchema,
  emailConfigSchema,
} from '@/domain/schemas';
import { z } from 'zod';

export class EmailConfigReader implements IEmailConfigReader {
  constructor(private readonly notificationEmail: string) {}
  read() {
    return readConfigFromSchema(emailConfigSchema, {
      resend_api_key: process.env.RESEND_API_KEY,
      sender_email_address: process.env.SENDER_EMAIL_ADDRESS,
      destination_email_address: this.notificationEmail,
    });
  }
}
export class MockEmailConfigReader implements IEmailConfigReader {
  constructor(private readonly testValues: EmailConfig) {}
  read() {
    return readConfigFromSchema(emailConfigSchema, {
      ...this.testValues,
    });
  }
}

export function getDatabaseConfig(
  source: Record<string, unknown> = process.env
): DatabaseConfig {
  return readConfigFromSchema(databaseConfigSchema, source);
}

export function getLoggerLevel() {
  const level = process.env.LOG_EVEL?.trim().toLocaleLowerCase();
  switch (level) {
    case 'error':
    case 'warn':
    case 'info':
    case 'debug':
      return level;
    default:
      console.warn(`Invalid LOG_LEVEL value: ${level}. Defaulting to "info".`);
      return 'info';
  }
}

/**
 * Crashes if config is invalid
 */
function readConfigFromSchema<T>(
  schema: z.ZodType<T>,
  data: Record<string, unknown>
): T {
  return schema.parse(data);
}
