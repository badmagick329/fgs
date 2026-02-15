import { z } from 'zod';

export const emailConfigSchema = z.object({
  resendApiKey: z.string().min(1, 'RESEND_API_KEY is required'),
  senderEmailAddress: z.email('SENDER_EMAIL_ADDRESS must be a valid email'),
});

export const databaseConfigSchema = z.object({
  databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
