'use client';
import {
  type CreateRegistration,
  createRegistrationSchema,
  registrationResultSchema,
} from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { API } from '@/lib/consts';

function getRequestErrorMessage(status: number, fallback?: string) {
  if (status === 429) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }

  if (status === 409) {
    return 'This registration was already submitted recently. Please wait before trying again.';
  }

  if (status === 400) {
    return fallback ?? 'Please review your details and try submitting again.';
  }

  return fallback ?? 'An unexpected error occurred. Please try again later.';
}

export default function useRegisterPage() {
  const formStartedAtRef = useRef(Date.now());
  const [status, setStatus] = useState<string | null>(null);

  const {
    register,
    handleSubmit: _handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRegistration>({
    resolver: zodResolver(createRegistrationSchema),
    defaultValues: { firstName: '', lastName: '', email: '' },
  });

  const registerMutation = useMutation({
    mutationFn: async (values: CreateRegistration) => {
      const res = await fetch(API.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json = await res.json().catch(() => undefined);
      const parsed = registrationResultSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error(getRequestErrorMessage(res.status));
      }

      if (!res.ok && !parsed.data.ok) {
        throw new Error(
          getRequestErrorMessage(res.status, parsed.data.message)
        );
      }

      return parsed.data;
    },
    onError: (error) => {
      console.error('Registration error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again later.';
      setStatus(message);
    },
  });

  async function onSubmit(values: CreateRegistration) {
    setStatus(null);
    try {
      const json = await registerMutation.mutateAsync({
        ...values,
        formStartedAt: formStartedAtRef.current,
      });
      if (json.ok) {
        setStatus('Registered!');
        reset();
        formStartedAtRef.current = Date.now();
        return;
      }

      setStatus(json.message ?? 'An unexpected error occurred.');
      if (Array.isArray(json.errors)) {
        json.errors.forEach((err: { field?: string; message: string }) => {
          if (!err.field) return;
          setError(err.field as keyof CreateRegistration, {
            type: 'server',
            message: err.message,
          });
        });
      } else {
        setError('root.server', {
          type: 'server',
          message: json.message ?? 'An unexpected error occurred.',
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again later.';
      setStatus(message);
      setError('root.server', { type: 'server', message });
    }
  }
  return {
    handleSubmit: _handleSubmit(onSubmit),
    register,
    errors,
    status,
    isButtonDisabled: registerMutation.isPending || isSubmitting,
  };
}
