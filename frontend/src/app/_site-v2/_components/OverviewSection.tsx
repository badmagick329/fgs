import Link from 'next/link';

export function OverviewSection({
  title,
  paragraphs,
  links,
}: {
  title: string;
  paragraphs: string[];
  links?: { href: string; description: string }[];
}) {
  return (
    <div className='fgs-panel mt-8'>
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
