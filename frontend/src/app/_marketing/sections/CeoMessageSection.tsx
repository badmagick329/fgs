import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ceoMessageContent } from '../content';

export default function CeoMessageSection() {
  return (
    <section id='ceo-message' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <Accordion
          type='single'
          collapsible
          className='rounded-[1.4rem] border border-border bg-card px-6 shadow-sm sm:px-7 xl:hidden'
        >
          <AccordionItem value='ceo-message' className='border-b-0'>
            <AccordionTrigger className='text-fgs-ink py-6 text-xl font-semibold hover:no-underline sm:text-2xl'>
              {ceoMessageContent.title}
            </AccordionTrigger>
            <AccordionContent className='pb-6 sm:pb-7'>
              <div className='space-y-4'>
                {ceoMessageContent.paragraphs.map((paragraph) => (
                  <p key={paragraph} className='fgs-copy'>
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className='mt-6 rounded-3xl p-3'>
                <div className='fgs-placeholder mx-auto aspect-square max-w-[16rem] rounded-2xl border border-border'>
                  CEO image placeholder
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='hidden rounded-[1.4rem] border border-border bg-card px-6 py-6 shadow-sm sm:px-7 sm:py-7 xl:block'>
          <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            {ceoMessageContent.title}
          </h2>
          <div className='mt-4 space-y-4'>
            {ceoMessageContent.paragraphs.map((paragraph) => (
              <p key={paragraph} className='fgs-copy'>
                {paragraph}
              </p>
            ))}
          </div>
          <div className='mt-6 rounded-3xl p-3'>
            <div className='fgs-placeholder mx-auto aspect-square max-w-[16rem] rounded-2xl border border-border'>
              CEO image placeholder
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
