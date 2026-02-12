export default function ContactSection() {
  return (
    <section id='contact' className='fgs-section reveal pb-20'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>Contact</h2>
        <div className='mt-6 grid gap-4 md:grid-cols-3'>
          <article className='fgs-card'>
            <h3 className='fgs-subheading'>Phone</h3>
            <p className='fgs-copy mt-2'>+92 000 0000000</p>
          </article>
          <article className='fgs-card'>
            <h3 className='fgs-subheading'>Email</h3>
            <p className='fgs-copy mt-2'>info@farooqigrammar.school</p>
          </article>
          <article className='fgs-card'>
            <h3 className='fgs-subheading'>Address</h3>
            <p className='fgs-copy mt-2'>FGS Campus, Lahore, Pakistan</p>
          </article>
        </div>
        <div className='mt-4 rounded-2xl border border-dashed border-(--fgs-border) bg-white p-4 text-sm text-(--fgs-muted)'>
          Contact form placeholder (non-functional in v1).
        </div>
      </div>
    </section>
  );
}
