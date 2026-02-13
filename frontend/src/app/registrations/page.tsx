'use client';
import useRegistrationList from '@/hooks/useRegistrationList';
import { redirect } from 'next/navigation';

export default function RegistrationList() {
  const { isLoading, isError, error, data } = useRegistrationList();

  if (isLoading) {
    return (
      <div>
        <h2 className='text-3xl font-bold p-2 bg-amber-800'>Registrations</h2>
        <table className='w-full'>
          <thead className='bg-amber-700'>
            <tr>
              <th className='p-2 text-left'>ID</th>
              <th className='p-2 text-left'>First Name</th>
              <th className='p-2 text-left'>Last Name</th>
              <th className='p-2 text-left'>Email</th>
              <th className='p-2 text-left'>Message</th>
              <th className='p-2 text-left'>Registered At</th>
              <th className='p-2 text-left'>Updated At</th>
              <th className='p-2 text-left'>Email Status</th>
              <th className='p-2 text-left'>Retry Count</th>
            </tr>
          </thead>
        </table>
      </div>
    );
  }

  if (isError) {
    return (
      <p className='p-2 text-error'>
        {error?.message ?? 'Failed to load registrations.'}
      </p>
    );
  }

  const registrations = data ?? [];

  return (
    <div>
      <h2 className='text-3xl font-bold p-2 bg-amber-800'>Registrations</h2>
      <table className='w-full'>
        <thead className='bg-amber-700'>
          <tr>
            <th className='p-2 text-left'>ID</th>
            <th className='p-2 text-left'>First Name</th>
            <th className='p-2 text-left'>Last Name</th>
            <th className='p-2 text-left'>Email</th>
            <th className='p-2 text-left'>Message</th>
            <th className='p-2 text-left'>Registered At</th>
            <th className='p-2 text-left'>Updated At</th>
            <th className='p-2 text-left'>Email Status</th>
            <th className='p-2 text-left'>Retry Count</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((r) => (
            <tr key={r.id} className='even:bg-amber-700 odd:bg-amber-600'>
              <td className='p-2'>{r.id}</td>
              <td className='p-2'>{r.first_name}</td>
              <td className='p-2'>{r.last_name}</td>
              <td className='p-2'>{r.email}</td>
              <td className='p-2'>{r.registration_message}</td>
              <td className='p-2'>
                {r.registered_at && r.registered_at.toLocaleString()}
              </td>
              <td className='p-2'>
                {(r.updated_at && r.updated_at.toLocaleString()) ?? 'N/A'}
              </td>
              <td className='p-2'>{r.email_status}</td>
              <td className='p-2'>{r.retry_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          (async () => {
            const res = await fetch('/api/admin/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
              console.error('Logout failed.');
            } else {
              redirect('/admin/login');
            }
          })();
        }}
      >
        <button
          type='submit'
          className='fixed bottom-4 right-4 rounded-md bg-red-700 px-4 py-2 hover:bg-red-600'
        >
          Logout
        </button>
      </form>
    </div>
  );
}
