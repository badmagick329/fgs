'use client';

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
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { API, QUERY_KEYS, ROUTES } from '@/lib/consts';

type AdminSessionResponse = {
  data?: {
    email?: string;
  };
};

/**
 * Every signed-in admin page shows the same links in the same order, so an
 * admin can always reach any page from any other and sees where they are.
 */
const ADMIN_PAGES = [
  { href: ROUTES.admin.root, label: 'Settings' },
  { href: ROUTES.registrations, label: 'Registrations' },
  { href: ROUTES.admin.alumniStories, label: 'Alumni stories' },
] as const;

// /admin is a prefix of every other admin page, so it matches only exactly.
function isCurrent(pathname: string, href: string) {
  return href === ROUTES.admin.root
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
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
    <nav
      aria-label='Admin'
      className='mb-8 flex flex-col-reverse gap-1 border-b border-border sm:flex-row sm:items-end sm:justify-between sm:gap-3'
    >
      <ul className='-mb-px flex flex-wrap gap-x-6'>
        {ADMIN_PAGES.map((page) => {
          const current = isCurrent(pathname, page.href);
          return (
            <li key={page.href}>
              <Link
                href={page.href}
                aria-current={current ? 'page' : undefined}
                className={`inline-block border-b-2 py-3 text-sm font-semibold transition-colors ${
                  current
                    ? 'border-fgs-blue text-fgs-ink'
                    : 'border-transparent text-muted-foreground hover:text-fgs-ink'
                }`}
              >
                {page.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className='flex items-center gap-4 text-sm sm:pb-3'>
        <span className='min-w-0 truncate text-muted-foreground'>
          {sessionQuery.data ?? '...'}
        </span>
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
              className='shrink-0 cursor-pointer font-semibold text-error hover:underline disabled:cursor-not-allowed'
              disabled={isLoggingOut}
            >
              Log out
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
              <AlertDialogCancel disabled={isLoggingOut}>
                Cancel
              </AlertDialogCancel>
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
    </nav>
  );
}
