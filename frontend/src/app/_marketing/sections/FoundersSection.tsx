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
    <>
      <Accordion
        type='single'
        collapsible
        className='rounded-sm border border-border bg-card px-6 shadow-sm sm:px-7 xl:hidden'
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
                <div className='mx-auto max-w-[16rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
                  <Image
                    src='/asim_2.webp'
                    alt='Honorable Sir Asim Farooqi'
                    width={640}
                    height={640}
                    className='aspect-square h-auto w-full object-cover'
                  />
                  <div className='border-t border-brand-blue/20 bg-brand-blue/5 px-4 py-3'>
                    <p className='text-fgs-ink text-center text-sm font-medium'>
                      Sir Asim Farooqi
                    </p>
                  </div>
                </div>
              </div>
              <div className='rounded-3xl p-3'>
                <div className='mx-auto max-w-[16rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
                  <Image
                    src='/zahida.webp'
                    alt='Respected Madam Zahida Asim Farooqi'
                    width={640}
                    height={640}
                    className='aspect-square h-auto w-full object-cover'
                  />
                  <div className='border-t border-brand-blue/20 bg-brand-blue/5 px-4 py-3'>
                    <p className='text-fgs-ink text-center text-sm font-medium'>
                      Madam Zahida Asim Farooqi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className='fgs-panel hidden xl:block'>
        <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
          {foundersContent.title}
        </h2>
        <div className='mt-4 space-y-4'>
          {foundersContent.paragraphs.map((paragraph) => (
            <p key={paragraph} className='fgs-copy'>
              {paragraph}
            </p>
          ))}
        </div>
        <div className='mt-6 grid gap-4 sm:grid-cols-2'>
          <div className='rounded-3xl p-3'>
            <div className='mx-auto max-w-[16rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
              <Image
                src='/asim_2.webp'
                alt='Honorable Sir Asim Farooqi'
                width={640}
                height={640}
                className='aspect-square h-auto w-full object-cover'
              />
              <div className='border-t border-brand-blue/20 bg-brand-blue/5 px-4 py-3'>
                <p className='text-fgs-ink text-center text-sm font-medium'>
                  Sir Asim Farooqi
                </p>
              </div>
            </div>
          </div>
          <div className='rounded-3xl p-3'>
            <div className='mx-auto max-w-[16rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
              <Image
                src='/zahida.webp'
                alt='Respected Madam Zahida Asim Farooqi'
                width={640}
                height={640}
                className='aspect-square h-auto w-full object-cover'
              />
              <div className='border-t border-brand-blue/20 bg-brand-blue/5 px-4 py-3'>
                <p className='text-fgs-ink text-center text-sm font-medium'>
                  Madam Zahida Asim Farooqi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
