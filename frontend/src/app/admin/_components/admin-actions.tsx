import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AdminActionsProps = {
  navigationHref: string;
  navigationLabel: string;
  className?: string;
};

type AdminSessionResponse = {
  data?: {
    email?: string;
  };
};

export function AdminActions({
  navigationHref,
  navigationLabel,
  className,
}: AdminActionsProps) {
  const router = useRouter();
  const sessionQuery = useQuery({
    queryKey: ['admin-session'],
    queryFn: async () => {
      const res = await fetch('/api/admin/session');
      if (!res.ok) {
        throw new Error('Failed to load session.');
      }
      const json = (await res
        .json()
        .catch(() => null)) as AdminSessionResponse | null;
      const email = json?.data?.email;
      if (!email) {
        throw new Error('Invalid session response.');
      }
      return email;
    },
    retry: false,
  });

  const handleLogout = async () => {
    const res = await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error('Logout failed.');
      return;
    }
    router.replace('/admin/login');
  };

  return (
    <div className={className ?? 'mt-4'}>
      <div className='mb-3 text-sm text-muted-foreground'>
        Signed in as{' '}
        {sessionQuery.data ? (
          <span className='font-medium text-fgs-ink'>{sessionQuery.data}</span>
        ) : (
          <span>...</span>
        )}
      </div>
      <div className='flex flex-wrap gap-3'>
        <Link href={navigationHref} className='fgs-btn-secondary w-fit'>
          {navigationLabel}
        </Link>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          <button type='submit' className='fgs-btn-danger'>
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
