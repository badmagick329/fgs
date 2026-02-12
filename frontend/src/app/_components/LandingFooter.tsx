import { type SectionId } from '@/app/_components/NavBar';

type LandingFooterProps = {
  items: { id: SectionId; label: string }[];
};

export default function LandingFooter({ items }: LandingFooterProps) {
  return (
    <footer className='border-t border-(--fgs-border) bg-(--fgs-white)'>
      <div className='mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8'>
        <nav aria-label='Footer'>
          <ul className='flex flex-wrap gap-4 text-sm'>
            {items.map((item) => (
              <li key={item.id}>
                <a className='fgs-link' href={`#${item.id}`}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className='text-xs text-(--fgs-muted)'>
          &copy; {new Date().getFullYear()} Farooqi Grammar School. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
