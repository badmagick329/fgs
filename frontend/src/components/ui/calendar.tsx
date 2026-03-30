'use client';

import { buttonVariants } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-4', className)}
      classNames={{
        months: 'flex flex-col gap-4',
        month: 'space-y-4',
        month_caption:
          '-mt-11 flex h-9 items-center justify-center px-12 pointer-events-none',
        caption_label: 'text-base font-semibold text-fgs-ink',
        nav: 'mb-2 flex items-center justify-between',
        button_previous: cn(
          buttonVariants({ variant: 'outline', size: 'icon-sm' }),
          'size-9 rounded-xl border-transparent bg-white p-0 text-fgs-ink opacity-100 shadow-none hover:border-transparent hover:bg-fgs-surface'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline', size: 'icon-sm' }),
          'size-9 rounded-xl border-transparent bg-white p-0 text-fgs-ink opacity-100 shadow-none hover:border-transparent hover:bg-fgs-surface'
        ),
        caption_after_enter: 'animate-in fade-in-0 duration-100',
        caption_before_enter: 'animate-in fade-in-0 duration-100',
        month_grid: 'mx-auto w-full border-collapse',
        weekdays: 'mb-1 flex',
        weekday:
          'text-muted-foreground flex h-10 w-11 items-center justify-center text-sm font-semibold tracking-tight',
        week: 'mt-1 flex w-full',
        day_button:
          'text-foreground h-11 w-11 rounded-xl p-0 text-base font-medium transition-colors hover:bg-fgs-surface aria-selected:bg-primary aria-selected:text-primary-foreground',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-11 w-11 rounded-xl p-0 font-medium text-fgs-ink hover:bg-fgs-surface aria-selected:opacity-100'
        ),
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today:
          'bg-fgs-surface text-fgs-ink ring-1 ring-border ring-inset',
        day_outside: 'text-muted-foreground opacity-30',
        day_disabled:
          'text-muted-foreground opacity-35 line-through cursor-not-allowed hover:bg-transparent',
        disabled: 'text-muted-foreground opacity-35',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) =>
          orientation === 'left' ? (
            <ChevronLeft
              className={cn('size-4', iconClassName)}
              {...iconProps}
            />
          ) : (
            <ChevronRight
              className={cn('size-4', iconClassName)}
              {...iconProps}
            />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
