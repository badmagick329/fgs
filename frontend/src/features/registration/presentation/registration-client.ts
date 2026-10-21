import {
  emailWorkerStatusResultSchema,
  registrationPageResultSchema,
} from '@/features/registration/domain/registration';
import { requestJson } from '@/lib/client/request-json';
import { API } from '@/lib/consts';

export async function getRegistrations(page: number) {
  const result = await requestJson(`${API.register}?page=${page}`, {
    schema: registrationPageResultSchema,
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
