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
                      <p key={phone} className='fgs-copy'>
                        {phone}
                      </p>
                    ))}
                  </div>
                </div>
                <div className='mt-4'>
                  <p className='text-fgs-ink text-sm font-medium'>Address</p>
                  <p className='fgs-copy mt-1.5'>{campus.address}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className='mt-6'>
          <h3 className='fgs-subheading'>{contactContent.form.title}</h3>
          <p className='fgs-copy mt-2'>{contactContent.form.description}</p>
          <a
            className='fgs-btn-primary mt-4 inline-flex'
            href={contactContent.form.cta.href}
            target='_blank'
            rel='noreferrer'
          >
            {contactContent.form.cta.label}
          </a>
        </div>
      </div>
    </section>
  );
}
