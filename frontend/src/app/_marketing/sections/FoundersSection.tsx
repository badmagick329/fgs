import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Image from 'next/image';
import { foundersContent } from '../content';

export default function FoundersSection() {
  return (
    <Accordion
      type='single'
      collapsible
      className='rounded-[1.6rem] border border-border bg-card px-6 shadow-sm sm:px-7'
    >
      <AccordionItem value='founders' className='border-b-0'>
        <AccordionTrigger className='text-fgs-ink py-6 text-xl font-semibold hover:no-underline sm:text-2xl'>
          {foundersContent.title}
        </AccordionTrigger>
        <AccordionContent className='pb-6 sm:pb-7'>
          <div className='space-y-4'>
            {foundersContent.paragraphs.map((paragraph) => (
              <p key={paragraph} className='fgs-copy'>
                {paragraph}
              </p>
            ))}
          </div>
          <div className='mt-6 grid gap-4 sm:grid-cols-2'>
            <div className='rounded-3xl p-3'>
              <div className='mx-auto max-w-[16rem] overflow-hidden rounded-2xl border border-border'>
                <Image
                  src='/asim_2.webp'
                  alt='Respected Madam Zahida Asim Farooqi'
                  width={640}
                  height={640}
                  className='aspect-square h-auto w-full object-cover'
                />
              </div>
            </div>
            <div className='rounded-3xl p-3'>
              <div className='mx-auto max-w-[16rem] overflow-hidden rounded-2xl border border-border'>
                <Image
                  src='/zahida.webp'
                  alt='Respected Madam Zahida Asim Farooqi'
                  width={640}
                  height={640}
                  className='aspect-square h-auto w-full object-cover'
                />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
