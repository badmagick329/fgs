import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ErrorRecord } from '@/lib/result';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const errorMessageFromErrors = (errors: ErrorRecord[]) => {
  return errors[0]?.message ?? 'An unknown error occurred.';
};
