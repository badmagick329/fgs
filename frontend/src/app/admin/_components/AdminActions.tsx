import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { API, QUERY_KEYS, ROUTES } from '@/lib/consts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const sessionQuery = useQuery({
    queryKey: QUERY_KEYS.adminSession,
    queryFn: async () => {
      const res = await fetch(API.admin.session);
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
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      const res = await fetch(API.admin.logout, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        console.error('Logout failed.');
        setIsLogoutDialogOpen(false);
        return;
      }
      router.replace(ROUTES.admin.login);
    } finally {
      setIsLoggingOut(false);
    }
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
        <AlertDialog
          open={isLogoutDialogOpen}
          onOpenChange={(open) => {
            if (!isLoggingOut) {
              setIsLogoutDialogOpen(open);
            }
          }}
        >
          <AlertDialogTrigger asChild>
            <button
              type='button'
              className='fgs-btn-danger'
              disabled={isLoggingOut}
            >
              Logout
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent size='sm'>
            <AlertDialogHeader>
              <AlertDialogTitle>Log out?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to sign in again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                disabled={isLoggingOut}
                onClick={(event) => {
                  event.preventDefault();
                  void handleLogout();
                }}
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
