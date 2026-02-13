const reasons = [
  'Academic rigor',
  'Character development',
  'Co-curricular balance',
  'Supportive faculty',
];

export default function WhyFgsSection() {
  return (
    <section id='why-fgs' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>Why FGS</h2>
        <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {reasons.map((item) => (
            <article key={item} className='fgs-card'>
              <h3 className='fgs-subheading'>{item}</h3>
              <p className='fgs-copy mt-2'>
                Structured, student-centered learning with measurable growth.
              </p>
            </article>
          ))}
        </div>
        <div className='mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3'>
          <p className='fgs-proof'>95%+ Board Performance</p>
          <p className='fgs-proof'>30+ Activities & Clubs</p>
          <p className='fgs-proof'>Dedicated Mentorship</p>
        </div>
      </div>
    </section>
  );
}
