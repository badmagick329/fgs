const alumniCards = [
  {
    name: 'Alumni Name',
    role: 'University Scholar',
    quote: 'FGS gave me confidence to lead and serve.',
  },
  {
    name: 'Alumni Name',
    role: 'Young Entrepreneur',
    quote: 'The balance of discipline and support shaped my journey.',
  },
  {
    name: 'Alumni Name',
    role: 'STEM Professional',
    quote: 'Our mentors pushed us to think bigger.',
  },
];

export default function AlumniSection() {
  return (
    <section id='alumni' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>Meet Our Alumni</h2>
        <div className='mt-6 grid gap-4 md:grid-cols-3'>
          {alumniCards.map((alumni, idx) => (
            <article key={idx} className='fgs-card'>
              <div className='fgs-placeholder aspect-square text-xs'>
                Portrait Placeholder
              </div>
              <h3 className='fgs-subheading mt-3'>{alumni.name}</h3>
              <p className='text-sm font-medium text-(--fgs-blue)'>
                {alumni.role}
              </p>
              <p className='fgs-copy mt-2'>&ldquo;{alumni.quote}&rdquo;</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
