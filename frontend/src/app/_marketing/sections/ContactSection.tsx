import RegistrationForm from '@/app/_components/RegistrationForm';
import { contactContent } from '../content';

export default function ContactSection() {
  return (
    <section id='contact' className='fgs-section reveal pb-20'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>{contactContent.title}</h2>
        <article className='fgs-card mt-6'>
          <h3 className='fgs-subheading'>Email</h3>
          <a
            className='fgs-copy mt-2 block break-all text-brand-blue'
            href={`mailto:${contactContent.shared.email}`}
          >
            {contactContent.shared.email}
          </a>
        </article>

        <div className='mt-8'>
          <h3 className='fgs-subheading'>{contactContent.campusesTitle}</h3>
          <div className='mt-4 grid gap-4 md:grid-cols-2'>
            {contactContent.campuses.map((campus) => (
              <article key={campus.name} className='fgs-card'>
                <h4 className='fgs-subheading'>{campus.name}</h4>
                <div className='mt-3'>
                  <p className='text-fgs-ink text-sm font-medium'>Phone</p>
                  <div className='mt-1.5 space-y-1'>
                    {campus.phones.map((phone) => (
                      <a
                        key={phone.href}
                        className='fgs-copy block text-brand-blue hover:underline'
                        href={phone.href}
                      >
                        {phone.display}
                      </a>
                    ))}
                  </div>
                </div>
                <div className='mt-4'>
                  <p className='text-fgs-ink text-sm font-medium'>Address</p>
                  <p className='fgs-copy mt-1.5'>{campus.address}</p>
                  <a
                    className='mt-3 inline-flex items-center justify-center rounded-lg border border-brand-blue px-3 py-2 text-sm font-medium text-brand-blue transition-colors hover:bg-brand-blue hover:text-white'
                    href={campus.mapUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    View on Map
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className='mt-6'>
          <h3 className='fgs-subheading'>{contactContent.form.title}</h3>
          <p className='fgs-copy mt-2'>{contactContent.form.description}</p>
          <div className='mt-4'>
            <RegistrationForm />
          </div>
        </div>
      </div>
    </section>
  );
}
