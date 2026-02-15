import type { LogLevel, LogLevelNumber, Logger } from '@/domain/interfaces';

export const mockLoggerFactory = (level: LogLevel = 'info') => {
  let logLevel: LogLevelNumber = 2;

  const setLogLevel = (level: LogLevel) => {
    switch (level) {
      case 'error':
        logLevel = 0;
        break;
      case 'warn':
        logLevel = 1;
        break;
      case 'info':
        logLevel = 2;
        break;
      case 'debug':
        logLevel = 3;
        break;
      default: {
        level satisfies never;
        throw new Error(`Invalid log level: ${level}`);
      }
    }
  };

  const createLogger = (_source: string): Logger => {
    return {
      error: (..._args: any[]) => {},
      warn: (..._args: any[]) => {
        if (logLevel < 1) {
          return;
        }
      },
      info: (..._args: any[]) => {
        if (logLevel < 2) {
          return;
        }
      },
      debug: (..._args: any[]) => {
        if (logLevel < 3) {
          return;
        }
      },
    };
  };

  setLogLevel(level);
  return createLogger;
};
