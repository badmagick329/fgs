import {
  type DatabaseConfig,
  type EmailConfig,
  databaseConfigSchema,
  emailConfigSchema,
} from '@/infrastructure/config/schemas';
import { z } from 'zod';

export function readConfigFromSchema<T>(
  schema: z.ZodType<T>,
  data: Record<string, unknown>
): T {
  const parsed = schema.safeParse({
    data,
  });

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(z.treeifyError(parsed.error), null, 2));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export function getEmailConfig(notificationEmail: string): EmailConfig {
  return readConfigFromSchema(emailConfigSchema, {
    ...process.env,
    DESTINATION_EMAIL_ADDRESS: notificationEmail,
  });
}

export const databaseConfig = readConfigFromSchema(
  databaseConfigSchema,
  process.env
);
