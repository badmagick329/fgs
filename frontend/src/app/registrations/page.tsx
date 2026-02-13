'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useRegistrationList from '@/hooks/useRegistrationList';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const tableHeaders = [
  'ID',
  'Email Status',
  'First Name',
  'Last Name',
  'Email',
  'Registered At',
  'Retry Count',
];

export default function RegistrationList() {
  const router = useRouter();
  const { isLoading, isError, error, data } = useRegistrationList();
  const backdrop = (
    <>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_18%,rgb(0_160_224/0.16),transparent_28%),radial-gradient(circle_at_12%_82%,rgb(240_176_32/0.14),transparent_30%)]'
      />
    </>
  );
  const logoWatermark = (
    <div
      aria-hidden
      className='mt-auto flex justify-center pt-12 md:justify-end'
    >
      <Image
        src='/fgs-logo.png'
        alt=''
        width={720}
        height={720}
        className='h-auto w-48 opacity-[0.12] blur-[0.65px] sm:w-64 md:w-80 lg:w-104'
      />
    </div>
  );

  if (isLoading) {
    return (
      <main className='bg-background text-foreground relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8'>
        {backdrop}
        <div className='relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col'>
          <h2 className='fgs-heading'>Registrations</h2>
          <p className='fgs-copy mt-2'>Loading registration records...</p>
          <div className='mt-6 rounded-2xl border border-border bg-card p-2 sm:p-4'>
            <Table>
              <TableHeader>
                <TableRow className='bg-fgs-surface hover:bg-fgs-surface'>
                  {tableHeaders.map((header) => (
                    <TableHead key={header} className='font-semibold'>
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            </Table>
          </div>
          {logoWatermark}
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className='bg-background text-foreground relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8'>
        {backdrop}
        <div className='relative z-10 mx-auto w-full max-w-7xl rounded-2xl border border-border bg-card p-6'>
          <h2 className='fgs-heading'>Registrations</h2>
          <p className='mt-3 text-error'>
            {error?.message ?? 'Failed to load registrations.'}
          </p>
        </div>
        <div className='relative z-10 mx-auto flex min-h-[calc(100vh-18rem)] max-w-7xl flex-col'>
          {logoWatermark}
        </div>
      </main>
    );
  }

  const registrations = data ?? [];

  return (
    <main className='bg-background text-foreground relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8'>
      {backdrop}
      <div className='relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col'>
        <h2 className='fgs-heading'>Registrations</h2>
        <p className='fgs-copy mt-2'>
          Admission interest submissions received from the landing page.
        </p>

        <div className='mt-6 rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-4'>
          <Table>
            <TableHeader>
              <TableRow className='bg-fgs-surface hover:bg-fgs-surface'>
                {tableHeaders.map((header) => (
                  <TableHead key={header} className='font-semibold'>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((r) => (
                <TableRow
                  key={r.id}
                  className='odd:bg-card even:bg-fgs-surface/55'
                >
                  <TableCell>{r.id}</TableCell>
                  <TableCell className='capitalize'>{r.email_status}</TableCell>
                  <TableCell>{r.first_name}</TableCell>
                  <TableCell>{r.last_name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>
                    {r.registered_at?.toLocaleString() ?? 'N/A'}
                  </TableCell>
                  <TableCell>{r.retry_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {logoWatermark}
      </div>

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
              router.replace('/admin/login');
            }
          })();
        }}
      >
        <button
          type='submit'
          className='fixed bottom-4 right-4 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-fgs-surface'
        >
          Logout
        </button>
      </form>
    </main>
  );
}
