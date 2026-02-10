import { z } from 'zod';

const envSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  SENDER_EMAIL_ADDRESS: z.email('SENDER_EMAIL_ADDRESS must be a valid email'),
  DESTINATION_EMAIL_ADDRESS: z.email(
    'DESTINATION_EMAIL_ADDRESS must be a valid email'
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(z.treeifyError(parsed.error), null, 2));
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
