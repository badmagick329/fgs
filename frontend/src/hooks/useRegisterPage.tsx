'use client';
import {
  type CreateRegistration,
  createRegistrationSchema,
  registrationResultSchema,
} from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function useRegisterPage() {
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
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      const parsed = registrationResultSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error('Invalid response from server.');
      }
      return parsed.data;
    },
    onError: (error) => {
      console.error('Registration error:', error);
      setStatus('An unexpected error occurred. Please try again later.');
    },
  });

  async function onSubmit(values: CreateRegistration) {
    setStatus(null);
    try {
      const json = await registerMutation.mutateAsync(values);
      if (json.ok) {
        setStatus('Registered!');
        reset();
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
    } catch {
      const message = 'An unexpected error occurred. Please try again later.';
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
