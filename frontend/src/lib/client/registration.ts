import {
  emailWorkerStatusResultSchema,
  registrationListResultSchema,
} from '@/types';
import { API } from '@/lib/consts';
import { requestJson } from './request-json';

export async function getRegistrations() {
  const result = await requestJson(API.register, {
    schema: registrationListResultSchema,
    errorMessage: (status) =>
      status === 401
        ? 'Authentication required.'
        : 'Failed to load registrations.',
  });
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.data;
}

export async function getRegistrationEmailStatus() {
  const result = await requestJson(API.registerStatus, {
    schema: emailWorkerStatusResultSchema,
    errorMessage: (status) =>
      status === 401
        ? 'Authentication required.'
        : 'Failed to load email worker status.',
  });
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.data;
}
