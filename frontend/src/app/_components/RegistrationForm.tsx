'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type CreateRegistration,
  createRegistrationSchema,
  registrationResultSchema,
} from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { API } from '@/lib/consts';
import { contactContent } from '@/app/_marketing/content';
import {
  REGISTRATION_CAMPUSES,
  combinePakistanDateAndTime,
  getRegistrationTimeOptions,
  isRegistrationDateAvailable,
} from '@/lib/registration';
import { cn } from '@/lib/utils';

function getRequestErrorMessage(status: number, fallback?: string) {
  if (status === 429) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }

  if (status === 409) {
    return 'This registration was already submitted.';
  }

  if (status === 400) {
    return fallback ?? 'Please review your details and try submitting again.';
  }

  return fallback ?? 'Unable to submit right now. Please try again shortly.';
}

export default function RegistrationForm() {
  const formStartedAtRef = useRef(Date.now());
  const [status, setStatus] = useState<{
    tone: 'success';
    message: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRegistration>({
    resolver: zodResolver(createRegistrationSchema),
    defaultValues: {
      studentName: '',
      parentName: '',
      className: '',
      mobileNumber: '',
      preferredAppointmentAt: '',
      honeypot: '',
    },
  });

  const selectedTime = watch('preferredAppointmentAt')
    ? watch('preferredAppointmentAt').slice(11, 16)
    : '';
  const timeOptions = selectedDate
    ? getRegistrationTimeOptions(selectedDate)
    : [];

  const submitInterest = useMutation({
    mutationFn: async (values: CreateRegistration) => {
      const res = await fetch(API.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const payload = await res.json().catch(() => undefined);
      const parsed = registrationResultSchema.safeParse(payload);
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
  });

  function syncPreferredAppointment(date?: Date, time?: string) {
    if (!date || !time) {
      setValue('preferredAppointmentAt', '', { shouldValidate: true });
      return;
    }

    setValue('preferredAppointmentAt', combinePakistanDateAndTime(date, time), {
      shouldValidate: true,
    });
  }

  async function onSubmit(values: CreateRegistration) {
    setStatus(null);
    setError('root.server', { type: 'server', message: '' });
    try {
      const result = await submitInterest.mutateAsync({
        ...values,
        formStartedAt: formStartedAtRef.current,
      });
      if (result.ok) {
        reset();
        setSelectedDate(undefined);
        formStartedAtRef.current = Date.now();
        setStatus({
          tone: 'success',
          message:
            'Interest registered. Our admissions team will contact you soon.',
        });
        return;
      }

      if (Array.isArray(result.errors)) {
        result.errors.forEach((error) => {
          if (!error.field) return;
          setError(error.field as keyof CreateRegistration, {
            type: 'server',
            message: error.message,
          });
        });
      } else {
        setError('root.server', {
          type: 'server',
          message: result.message,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to submit right now. Please try again shortly.';
      setError('root.server', { type: 'server', message });
    }
  }

  const isDisabled = submitInterest.isPending || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='rounded-2xl border border-border bg-card p-5 sm:p-6'
      noValidate
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='sm:col-span-1'>
          <label
            htmlFor='studentName'
            className='text-fgs-ink text-sm font-medium'
          >
            Student Name
          </label>
          <input
            id='studentName'
            type='text'
            {...register('studentName')}
            aria-invalid={!!errors.studentName}
            aria-describedby={
              errors.studentName ? 'studentName-error' : undefined
            }
            className='mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='Student name'
          />
          {errors.studentName?.message && (
            <p
              id='studentName-error'
              role='alert'
              className='mt-1.5 text-xs text-error'
            >
              {errors.studentName.message}
            </p>
          )}
        </div>

        <div className='sm:col-span-1'>
          <label
            htmlFor='parentName'
            className='text-fgs-ink text-sm font-medium'
          >
            Parent Name
          </label>
          <input
            id='parentName'
            type='text'
            {...register('parentName')}
            aria-invalid={!!errors.parentName}
            aria-describedby={
              errors.parentName ? 'parentName-error' : undefined
            }
            className='mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='Parent name'
          />
          {errors.parentName?.message && (
            <p
              id='parentName-error'
              role='alert'
              className='mt-1.5 text-xs text-error'
            >
              {errors.parentName.message}
            </p>
          )}
        </div>
      </div>

      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
        <div className='sm:col-span-1'>
          <label
            htmlFor='className'
            className='text-fgs-ink text-sm font-medium'
          >
            Class
          </label>
          <input
            id='className'
            type='text'
            {...register('className')}
            aria-invalid={!!errors.className}
            aria-describedby={errors.className ? 'className-error' : undefined}
            className='mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='Class'
          />
          {errors.className?.message && (
            <p
              id='className-error'
              role='alert'
              className='mt-1.5 text-xs text-error'
            >
              {errors.className.message}
            </p>
          )}
        </div>

        <div className='sm:col-span-1'>
          <label
            htmlFor='mobileNumber'
            className='text-fgs-ink text-sm font-medium'
          >
            Mobile Number
          </label>
          <input
            id='mobileNumber'
            type='tel'
            inputMode='numeric'
            {...register('mobileNumber')}
            onInput={(event) => {
              event.currentTarget.value = event.currentTarget.value.replace(
                /\D+/g,
                ''
              );
            }}
            aria-invalid={!!errors.mobileNumber}
            aria-describedby={
              errors.mobileNumber ? 'mobileNumber-error' : undefined
            }
            className='mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='03XXXXXXXXX'
          />
          {errors.mobileNumber?.message && (
            <p
              id='mobileNumber-error'
              role='alert'
              className='mt-1.5 text-xs text-error'
            >
              {errors.mobileNumber.message}
            </p>
          )}
        </div>
      </div>

      <div className='mt-4'>
        <label className='text-fgs-ink text-sm font-medium'>Campus</label>
        <Controller
          name='campus'
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                aria-invalid={!!errors.campus}
                className='mt-1.5 w-full rounded-lg'
              >
                <SelectValue placeholder='Select campus' />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_CAMPUSES.map((campus) => (
                  <SelectItem key={campus} value={campus}>
                    {campus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.campus?.message && (
          <p role='alert' className='mt-1.5 text-xs text-error'>
            {errors.campus.message}
          </p>
        )}
      </div>

      <div className='mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr),220px]'>
        <div>
          <label className='text-fgs-ink text-sm font-medium'>
            Preferred Appointment Date
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type='button'
                variant='outline'
                className={cn(
                  'mt-1.5 w-full justify-between rounded-lg',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                <CalendarIcon className='size-4 opacity-60' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setCalendarOpen(false);

                  if (!date) {
                    syncPreferredAppointment(undefined, undefined);
                    return;
                  }

                  const nextTimeOptions = getRegistrationTimeOptions(date);
                  if (
                    !nextTimeOptions.some(
                      (option) => option.value === selectedTime
                    )
                  ) {
                    syncPreferredAppointment(date, undefined);
                    return;
                  }

                  syncPreferredAppointment(date, selectedTime);
                }}
                disabled={(date) => !isRegistrationDateAvailable(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className='text-fgs-ink text-sm font-medium'>
            Preferred Time
          </label>
          <Select
            value={selectedTime}
            onValueChange={(value) =>
              syncPreferredAppointment(selectedDate, value)
            }
            disabled={!selectedDate}
          >
            <SelectTrigger
              aria-invalid={!!errors.preferredAppointmentAt}
              className='mt-1.5 w-full rounded-lg'
            >
              <SelectValue
                placeholder={selectedDate ? 'Select time' : 'Pick date first'}
              />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className='mt-2 text-xs text-muted-foreground'>
        {contactContent.form.scheduleNote}
      </p>

      <input type='hidden' {...register('preferredAppointmentAt')} />

      {errors.preferredAppointmentAt?.message && (
        <p role='alert' className='mt-1.5 text-xs text-error'>
          {errors.preferredAppointmentAt.message}
        </p>
      )}

      <div aria-hidden='true' className='hidden'>
        <label htmlFor='website'>Website</label>
        <input
          id='website'
          type='text'
          tabIndex={-1}
          autoComplete='off'
          {...register('honeypot')}
        />
      </div>

      <button
        type='submit'
        disabled={isDisabled}
        className='fgs-btn-primary mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto'
      >
        {isDisabled ? 'Submitting...' : 'Start Registration'}
      </button>

      {errors.root?.server?.message && (
        <p role='alert' className='mt-3 text-xs text-error'>
          {errors.root.server.message}
        </p>
      )}

      {status && (
        <p role='status' className='mt-3 text-xs text-emerald-700'>
          {status.message}
        </p>
      )}
    </form>
  );
}
