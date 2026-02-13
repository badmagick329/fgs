'use client';
import useRegisterPage from '@/hooks/useRegisterPage';

export default function RegisterPage() {
  const { handleSubmit, register, status, errors, isButtonDisabled } =
    useRegisterPage();

  return (
    <main className='flex flex-col min-h-screen'>
      <div className='flex flex-col items-center gap-8'>
        <h1 className='text-4xl font-semibold'>Register</h1>
        <form onSubmit={handleSubmit}>
          <div className='flex flex-col items-center'>
            <div className='flex flex-col mb-4'>
              <label htmlFor='firstName' className='mb-2'>
                First Name
              </label>
              <input
                type='text'
                id='firstName'
                autoComplete='off'
                {...register('firstName')}
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? 'firstName-error' : undefined
                }
                className='rounded-md border border-gray-300 p-2 w-md'
              />
              {errors.firstName?.message && (
                <p
                  id='firstName-error'
                  role='alert'
                  className='mt-1 text-sm text-error'
                >
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className='flex flex-col mb-4'>
              <label htmlFor='lastName' className='mb-2'>
                Last Name
              </label>
              <input
                type='text'
                id='lastName'
                autoComplete='off'
                {...register('lastName')}
                aria-invalid={!!errors.lastName}
                aria-describedby={
                  errors.lastName ? 'lastName-error' : undefined
                }
                className='rounded-md border border-gray-300 p-2 w-md'
              />
              {errors.lastName?.message && (
                <p
                  id='lastName-error'
                  role='alert'
                  className='mt-1 text-sm text-error'
                >
                  {errors.lastName.message}
                </p>
              )}
            </div>
            <div className='flex flex-col mb-4'>
              <label htmlFor='email' className='mb-2'>
                Email
              </label>
              <input
                type='email'
                id='email'
                autoComplete='off'
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className='rounded-md border border-gray-300 p-2 w-md'
              />
              {errors.email?.message && (
                <p
                  id='email-error'
                  role='alert'
                  className='mt-1 text-sm text-error'
                >
                  {errors.email.message}
                </p>
              )}
            </div>
            <button
              className='mt-4 rounded-md bg-black px-4 py-2 hover:bg-gray-800 hover:cursor-pointer w-32 disabled:cursor-wait'
              type='submit'
              disabled={isButtonDisabled}
            >
              Register
            </button>
            {errors.root?.server?.message && (
              <p role='alert' className='mt-3 text-sm text-error'>
                {errors.root.server.message}
              </p>
            )}
            {status && <p className='mt-3'>{status}</p>}
          </div>
        </form>
      </div>
    </main>
  );
}
