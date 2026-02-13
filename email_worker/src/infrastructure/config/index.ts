import { type EmailConfig } from '@/infrastructure/config/schemas';
import { z } from 'zod';

export function readConfigFromSchema(
  schema: z.ZodType<EmailConfig>,
  notificationEmail: string
): EmailConfig {
  const parsed = schema.safeParse({
    ...process.env,
    DESTINATION_EMAIL_ADDRESS: notificationEmail,
  });

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(z.treeifyError(parsed.error), null, 2));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
