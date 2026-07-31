import Link from 'next/link';
import { cn } from '@/lib/utils';

export function OverviewSection({
  title,
  paragraphs,
  links,
  className,
}: {
  title: string;
  paragraphs: string[];
  links?: { href: string; description: string }[];
  className?: string;
}) {
  return (
    <div className={cn('mt-8', className)}>
      <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>{title}</h2>
      <div className='mt-4 space-y-4'>
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className='fgs-copy'>
            {paragraph}
          </p>
        ))}
      </div>
      {links && (
        <div className='mt-6 flex flex-col gap-3 md:flex-row md:flex-wrap'>
          {links.map((l) => (
            <Link
              key={l.href}
              className='fgs-btn-secondary w-full justify-center md:w-auto'
              href={l.href}
            >
              {l.description}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
