import { z } from 'zod';

export const emailConfigSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  SENDER_EMAIL_ADDRESS: z.email('SENDER_EMAIL_ADDRESS must be a valid email'),
  DESTINATION_EMAIL_ADDRESS: z.string(),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;
