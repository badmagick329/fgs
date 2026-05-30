type FaqItem = {
  question: string;
  answer: string;
};

export function FaqSection({
  title,
  faqs,
  compact = false,
}: {
  title: string;
  faqs: FaqItem[];
  compact?: boolean;
}) {
  return (
    <div className='fgs-panel mt-8'>
      <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
        {title}
      </h2>
      <div className={compact ? 'mt-5 space-y-5' : 'mt-6 space-y-8'}>
        {faqs.map((faq) => (
          <div
            key={faq.question}
            className={
              compact
                ? 'border-b border-border pb-5 last:border-b-0 last:pb-0'
                : 'space-y-3'
            }
          >
            <h3
              className={
                compact
                  ? 'text-fgs-ink text-base font-semibold sm:text-lg'
                  : 'text-fgs-ink/80 text-lg font-medium sm:text-xl'
              }
            >
              {faq.question}
            </h3>
            <p className={compact ? 'fgs-copy mt-2' : 'fgs-copy'}>
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
