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
          className='rounded-[1.4rem] border border-border bg-card px-6 shadow-sm sm:px-7'
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
