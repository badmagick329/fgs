import AdmissionInterestForm from '@/app/_components/AdmissionInterestForm';
import { contactContent } from '../content';

export default function ContactSection() {
  return (
    <section id='contact' className='fgs-section reveal pb-20'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>{contactContent.title}</h2>
        <div className='mt-6 grid gap-4 md:grid-cols-3'>
          {contactContent.details.map((detail) => (
            <article key={detail.title} className='fgs-card'>
              <h3 className='fgs-subheading'>{detail.title}</h3>
              <p className='fgs-copy mt-2'>{detail.value}</p>
            </article>
          ))}
        </div>
        <div className='mt-6'>
          <h3 className='fgs-subheading'>{contactContent.form.title}</h3>
          <p className='fgs-copy mt-2'>{contactContent.form.description}</p>
          <div className='mt-4'>
            <AdmissionInterestForm />
          </div>
        </div>
      </div>
    </section>
  );
}
