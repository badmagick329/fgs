const primaryReasons = [
  {
    title: 'Strong Academic Foundation',
    description:
      'At Farooqi Grammar School, we focus on building clear concepts and excellent exam preparation so students achieve strong academic results and lifelong learning habits.',
  },
  {
    title: 'Character with Culture',
    description:
      'The school aims to provide quality English-medium education within our cultural, religious, and historical framework, ensuring students grow with strong values alongside modern knowledge.',
  },
  {
    title: 'Individual Attention',
    description:
      'We believe every child matters. With focused classroom support and caring teachers, students receive the attention they need to succeed.',
  },
  {
    title: 'Affordable Quality Education',
    description:
      'High standards do not have to mean high fees. Farooqi Grammar School is committed to making quality education accessible to families from all backgrounds.',
  },
];

const secondaryReasons = [
  {
    title: 'Holistic Development',
    description:
      'Beyond textbooks, students participate in co-curricular activities, competitions and events, confidence-building opportunities, and moral and personality development.',
  },
  {
    title: 'Safe & Nurturing Environment',
    description:
      'We provide a disciplined, respectful, and child-friendly atmosphere where students feel secure and motivated to learn.',
  },
  {
    title: 'Vision for the Future',
    description:
      'Our mission is to empower students with knowledge, confidence, and values so they become responsible and successful members of society.',
  },
];

export default function WhyFgsSection() {
  return (
    <section id='why-fgs' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>Why Join Farooqi Grammar School?</h2>
        <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {primaryReasons.map((item) => (
            <article key={item.title} className='fgs-card'>
              <h3 className='fgs-subheading'>{item.title}</h3>
              <p className='fgs-copy mt-2'>{item.description}</p>
            </article>
          ))}
        </div>
        <div className='mt-6 grid gap-4 md:grid-cols-3'>
          {secondaryReasons.map((item) => (
            <article key={item.title} className='fgs-card'>
              <h3 className='fgs-subheading'>{item.title}</h3>
              <p className='fgs-copy mt-2'>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
