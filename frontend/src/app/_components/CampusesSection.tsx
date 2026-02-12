const campuses = [
  'North Wing',
  'Junior Section',
  'Science Block',
  'Sports Zone',
];

export default function CampusesSection() {
  return (
    <section id='campuses' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>Campuses</h2>
        <div className='mt-6 grid gap-4 lg:grid-cols-3 lg:items-stretch'>
          <article className='fgs-card flex h-full flex-col lg:col-span-2'>
            <div className='fgs-placeholder min-h-105 flex-1'>
              Main Campus Placeholder
            </div>
            <p className='fgs-copy mt-3'>
              Main Campus: designed for focused learning and student life.
            </p>
          </article>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-1'>
            {campuses.map((campus) => (
              <article key={campus} className='fgs-card'>
                <div className='fgs-placeholder aspect-4/3 text-xs'>
                  {campus}
                </div>
                <p className='fgs-copy mt-2'>{campus} campus placeholder.</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
