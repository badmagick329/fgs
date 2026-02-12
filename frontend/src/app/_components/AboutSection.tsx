export default function AboutSection() {
  return (
    <section id='about' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>About Us</h2>
        <div className='mt-6 grid gap-4 md:grid-cols-3'>
          <article className='fgs-card'>
            <h3 className='fgs-subheading'>History</h3>
            <p className='fgs-copy'>
              Founded with a mission to combine strong academics and moral
              values, FGS has grown into a trusted school community.
            </p>
          </article>
          <article className='fgs-card'>
            <h3 className='fgs-subheading'>Meet the Founders</h3>
            <div className='mt-3 grid grid-cols-2 gap-3'>
              <div className='fgs-placeholder aspect-square text-xs'>
                Founder 1
              </div>
              <div className='fgs-placeholder aspect-square text-xs'>
                Founder 2
              </div>
            </div>
          </article>
          <article className='fgs-card'>
            <h3 className='fgs-subheading'>Achievements</h3>
            <div className='mt-3 flex flex-wrap gap-2 text-sm'>
              <span className='fgs-chip'>15+ Years</span>
              <span className='fgs-chip'>1,000+ Students</span>
              <span className='fgs-chip'>Top Results</span>
              <span className='fgs-chip'>Award Winning</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
