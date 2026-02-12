import Image from 'next/image';

export type SectionId =
  | 'about'
  | 'why-fgs'
  | 'join'
  | 'campuses'
  | 'alumni'
  | 'contact';

type NavItem = {
  id: SectionId;
  label: string;
};

type NavBarProps = {
  items: NavItem[];
};

export default function NavBar({ items }: NavBarProps) {
  return (
    <header className='sticky top-0 z-50 border-b border-[color:var(--fgs-border)] bg-white/90 backdrop-blur-sm'>
      <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8'>
        <a href='#top' className='flex items-center gap-3'>
          <Image
            src='/fgs-logo.png'
            alt='Farooqi Grammar School logo'
            width={44}
            height={44}
            className='h-11 w-11 rounded-md bg-white object-cover'
            priority
          />
          <span className='text-sm font-semibold leading-tight text-[color:var(--fgs-ink)] sm:text-base'>
            Farooqi Grammar School
          </span>
        </a>

        <nav className='hidden md:block' aria-label='Primary'>
          <ul className='flex items-center gap-6 text-sm font-medium'>
            {items.map((item) => (
              <li key={item.id}>
                <a className='fgs-link' href={`#${item.id}`}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <details className='group md:hidden'>
          <summary className='cursor-pointer list-none rounded-md border border-[color:var(--fgs-border)] px-3 py-2 text-sm font-medium text-[color:var(--fgs-ink)]'>
            Menu
          </summary>
          <nav
            className='absolute right-4 top-[68px] w-52 rounded-xl border border-[color:var(--fgs-border)] bg-[color:var(--fgs-white)] p-2 shadow-xl'
            aria-label='Mobile'
          >
            <ul className='flex flex-col'>
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    className='block rounded-lg px-3 py-2 text-sm text-[color:var(--fgs-ink)] hover:bg-[color:var(--fgs-surface)]'
                    href={`#${item.id}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
