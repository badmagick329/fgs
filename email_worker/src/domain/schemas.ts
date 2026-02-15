import { z } from 'zod';

export const emailConfigSchema = z.object({
  resend_api_key: z.string().min(1, 'RESEND_API_KEY is required'),
  sender_email_address: z.email('SENDER_EMAIL_ADDRESS must be a valid email'),
});

export const databaseConfigSchema = z.object({
  database_url: z.string().min(1, 'DATABASE_URL is required'),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
