import type { ReactNode } from 'react';

/**
 * One row of the settings page: what the group is for on the left, its
 * controls on the right. Rows are told apart by rules and the label column,
 * not by boxing each one in a card.
 */
export function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className='grid gap-6 border-t border-border py-8 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-12'>
      <div>
        <h2 className='fgs-subheading'>{title}</h2>
        <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>
          {description}
        </p>
      </div>
      <div className='min-w-0 space-y-8'>{children}</div>
    </section>
  );
}
