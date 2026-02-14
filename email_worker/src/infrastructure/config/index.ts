import type { IConfig } from '@/domain';
import {
  type DatabaseConfig,
  type EmailConfig,
  databaseConfigSchema,
  emailConfigSchema,
} from '@/domain/schemas';
import { z } from 'zod';

export class Config implements IConfig {
  constructor(private readonly notificationEmail: string) {}
  read() {
    return readConfigFromSchema(emailConfigSchema, {
      ...process.env,
      destination_email_address: this.notificationEmail,
    });
  }
}
export class MockConfig implements IConfig {
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
