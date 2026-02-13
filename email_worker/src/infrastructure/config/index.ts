import {
  type DatabaseConfig,
  type EmailConfig,
  databaseConfigSchema,
  emailConfigSchema,
} from '@/infrastructure/config/schemas';
import { z } from 'zod';

interface IConfig {
  read(): EmailConfig;
}

class Config implements IConfig {
  constructor(private readonly notificationEmail: string) {}
  read() {
    return readConfigFromSchema(emailConfigSchema, {
      ...process.env,
      DESTINATION_EMAIL_ADDRESS: this.notificationEmail,
    });
  }
}
class MockConfig implements IConfig {
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

export function createConfig(notificationEmail: string): IConfig {
  return new Config(notificationEmail);
}

export function createMockConfig(testValues: EmailConfig): IConfig {
  return new MockConfig(testValues);
}

function readConfigFromSchema<T>(
  schema: z.ZodType<T>,
  data: Record<string, unknown>
): T {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(z.treeifyError(parsed.error), null, 2));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
