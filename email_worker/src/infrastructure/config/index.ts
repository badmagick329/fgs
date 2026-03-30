import type { IConfig as IEmailConfigReader } from '@/domain/interfaces';
import type { Logger } from '@/domain/interfaces';
import {
  type DatabaseConfig,
  type EmailConfig,
  databaseConfigSchema,
  emailConfigSchema,
} from '@/domain/schemas';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

export function getWorkerInterval(log: Logger): number | null {
  const workerInterval = parseInt(process.env.WORKER_INTERVAL || '0');
  if (isNaN(workerInterval) || workerInterval <= 1000) {
    log.error(`Invalid WORKER_INTERVAL value: ${workerInterval}`);
    return null;
  }
  if (workerInterval < 1000 * 60 * 10) {
    log.warn(
      `WORKER_INTERVAL is set to a low value (${workerInterval} ms). This may lead to rate limiting by the email provider.`
    );
  }
  return workerInterval;
}

export function emailConfigReader(): IEmailConfigReader {
  return readConfigFromSchema(emailConfigSchema, {
    resendApiKey: process.env.RESEND_API_KEY,
    senderEmailAddress: process.env.SENDER_EMAIL_ADDRESS,
  });
}

export function mockEmailConfigReader(
  testValues: EmailConfig
): IEmailConfigReader {
  return readConfigFromSchema(emailConfigSchema, {
    ...testValues,
  });
}

export function getDatabaseConfig(
  source: Record<string, unknown> = process.env
): DatabaseConfig {
  return readConfigFromSchema(databaseConfigSchema, {
    databaseUrl:
      source.databaseUrl ??
      source.DATABASE_URL ??
      readEnvValueFromFallbackFiles('DATABASE_URL'),
  });
}

export function getLoggerLevel() {
  const level = process.env.LOG_LEVEL?.trim().toLocaleLowerCase();
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

function readEnvValueFromFallbackFiles(key: string) {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../frontend/.env.local'),
    path.resolve(process.cwd(), '../frontend/.env'),
  ];

  for (const candidatePath of candidatePaths) {
    if (!existsSync(candidatePath)) {
      continue;
    }

    const content = readFileSync(candidatePath, 'utf8');
    const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (match?.[1]) {
      return match[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }

  return undefined;
}
