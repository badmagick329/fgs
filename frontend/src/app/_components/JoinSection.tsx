export default function JoinSection() {
  return (
    <section id='join' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>Join FGS</h2>
        <div className='mt-6 grid gap-4 lg:grid-cols-2'>
          <article className='fgs-card'>
            <h3 className='fgs-subheading'>Admissions</h3>
            <p className='fgs-copy mt-2'>
              Register your interest and we will contact you with the next
              steps.
            </p>
            <a className='fgs-btn-primary mt-4 inline-flex' href='#contact'>
              Start Admission
            </a>
          </article>
          <article className='fgs-card'>
            <h3 className='fgs-subheading'>Career Opportunities</h3>
            <p className='fgs-copy mt-2'>
              Join a mission-focused team committed to student success and
              continuous growth.
            </p>
            <a className='fgs-btn-secondary mt-4 inline-flex' href='#contact'>
              View Opportunities
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
