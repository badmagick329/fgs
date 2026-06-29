import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Image from 'next/image';
import { ceoMessageContent } from '../content';

export default function CeoMessageSection() {
  return (
    <section id='ceo-message' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <Accordion
          type='single'
          collapsible
          className='rounded-sm border border-border bg-card px-6 shadow-sm sm:px-7 xl:hidden'
        >
          <AccordionItem value='ceo-message' className='border-b-0'>
            <AccordionTrigger className='text-fgs-ink py-6 text-xl font-semibold hover:no-underline sm:text-2xl'>
              {ceoMessageContent.title}
            </AccordionTrigger>
            <AccordionContent className='pb-6 sm:pb-7'>
              <div>
                <div className='mb-6 rounded-3xl p-3 sm:float-left sm:mb-4 sm:mr-6 sm:w-[18rem] sm:pl-0 sm:pr-0 sm:pt-0'>
                  <div className='mx-auto max-w-[16rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
                    <Image
                      src='/sameer.webp'
                      alt='Sameer Asim Farooqi'
                      width={640}
                      height={640}
                      className='aspect-square h-auto w-full object-cover'
                    />
                    <div className='border-t border-brand-blue/20 bg-brand-blue/5 px-4 py-3'>
                      <p className='text-fgs-ink text-center text-sm font-medium'>
                        Sameer Asim Farooqi
                      </p>
                    </div>
                  </div>
                </div>
                {ceoMessageContent.paragraphs.map((paragraph, index) => (
                  <p
                    key={paragraph}
                    className={`fgs-copy ${index === 0 ? '' : 'mt-4'}`}
                  >
                    {paragraph}
                  </p>
                ))}
                <div className='clear-both' />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='hidden rounded-sm border border-border bg-card px-6 py-6 shadow-sm sm:px-7 sm:py-7 xl:block'>
          <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            {ceoMessageContent.title}
          </h2>
          <div className='mt-4'>
            <div className='float-left mb-4 mr-6 w-[18rem] rounded-3xl p-3 pl-0 pr-0 pt-0'>
              <div className='mx-auto max-w-[16rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
                <Image
                  src='/sameer.webp'
                  alt='Sameer Asim Farooqi'
                  width={640}
                  height={640}
                  className='aspect-square h-auto w-full object-cover'
                />
                <div className='border-t border-brand-blue/20 bg-brand-blue/5 px-4 py-3'>
                  <p className='text-fgs-ink text-center text-sm font-medium'>
                    Sameer Asim Farooqi
                  </p>
                </div>
              </div>
            </div>
            {ceoMessageContent.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                className={`fgs-copy ${index === 0 ? '' : 'mt-4'}`}
              >
                {paragraph}
              </p>
            ))}
            <div className='clear-both' />
          </div>
        </div>
      </div>
    </section>
  );
}
