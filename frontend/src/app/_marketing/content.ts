import type { MarketingNavItem, MarketingParagraphBlock } from './types';

export const marketingNavItems: MarketingNavItem[] = [
  { id: 'ceo-message', label: 'CEO Message' },
  { id: 'about', label: 'About' },
  { id: 'why-fgs', label: 'Why FGS' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'contact', label: 'Contact' },
];

export const heroContent = {
  eyebrow: 'Academic excellence with character',
  title: 'Building future leaders at Farooqi Grammar School.',
  description:
    'A values-driven learning environment where students grow in knowledge, confidence, and purpose.',
  primaryCta: { href: '#contact', label: 'Apply for Admission' },
  secondaryCta: { href: '#gallery', label: 'Explore Student Life' },
};

export const ceoMessageContent: MarketingParagraphBlock = {
  title: 'CEO Message',
  paragraphs: [
    "We take pride in being at the forefront of Pakistan's education landscape; our students have, over decades, achieved top results in Lahore Board Matric Exams with unmatched consistency and excellence. However, we believe education is not limited to academic achievement; it is also about shaping character, nurturing curiosity, and developing confident, responsible individuals.",
    'Our journey began with humble beginnings, and over the years, we have grown through the trust of parents, the dedication of teachers, and the determination of our students. We strive to create a learning environment where students actively participate, think critically, and develop confidence through meaningful academic and extra-curricular experiences. We believe that through effective engagement, right guidance and encouragement, every student can unlock the enormous potential within him/her.',
    'Education in the 21st century is evolving rapidly, with technology opening new possibilities for learning and access to information. However, growing concerns related to impact of technology in class, such as reduced attention spans, excessive screen dependence, and weaker interpersonal interaction, have led educationists to rethink the role of technology in classrooms. At Farooqi Grammar School, we aim to embrace innovation thoughtfully, ensuring that technology is used purposefully to enhance learning rather than simply introduce it because everyone else is doing it.',
    'As education continues to evolve, we remain committed to learning, adapting, and providing opportunities that prepare our students not only for examinations, but for life.',
  ],
};

export const foundersContent: MarketingParagraphBlock = {
  title: 'Meet the Founders',
  paragraphs: [
    'Farooqi Schools were founded in 1978 by Honorable Sir Asim Farooqi and Respected Madam Zahida Asim Farooqi in Karim Park, Ravi Road, with a vision grounded in service, purpose, and educational excellence. At a time when both held promising careers in the government education sector, they chose to step away from personal advancement to dedicate themselves to providing quality education to the wider community.',
    'What began in a single room gradually grew into a strong educational institution built on commitment, discipline, and trust. Today, Farooqi Schools have expanded into multiple branches, with thousands of alumni contributing meaningfully across various fields.',
    'The founders established not just a school, but a tradition of integrity, hard work, and character-building: values that continue to guide Farooqi Schools and inspire future generations. Today, our alumni number in the tens of thousands, while our institution remains unrivalled in achieving 47 positions in Lahore Board Matric Exams in the last 26 years.',
  ],
};

export const achievementsContent = {
  title: 'Achievements',
  chips: [
    '47 positions in 26 years',
    'Celebrating 48 years of success',
    '50,000+ alumni',
  ],
  stats: [
    {
      value: '47',
      label: 'positions',
      supporting: 'in 26 years',
    },
    {
      value: '48',
      label: 'years',
      supporting: 'of success',
    },
    {
      value: '50,000+',
      label: 'alumni',
    },
  ],
};

export const whyFgsContent = {
  title: 'Why Join Farooqi Grammar School?',
  reasons: [
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
  ],
};

export const galleryContent = {
  title: 'Student Life Gallery',
  images: [
    { src: '/img01.webp', alt: 'Student life gallery image 1' },
    { src: '/img04.webp', alt: 'Student life gallery image 2' },
    { src: '/img05.webp', alt: 'Student life gallery image 3' },
    { src: '/img06.webp', alt: 'Student life gallery image 4' },
    { src: '/img07.webp', alt: 'Student life gallery image 5' },
    { src: '/img08.webp', alt: 'Student life gallery image 6' },
    { src: '/img09.webp', alt: 'Student life gallery image 7' },
    { src: '/img12.webp', alt: 'Student life gallery image 8' },
  ],
};

export const joinContent = {
  title: 'Join FGS',
  cards: [
    {
      title: 'Admissions',
      description:
        'Register your interest and we will contact you with the next steps.',
      cta: {
        href: '#contact',
        label: 'Start Admission',
        className: 'fgs-btn-primary',
      },
    },
    {
      title: 'Career Opportunities',
      description:
        'Join a mission-focused team committed to student success and continuous growth.',
      cta: {
        href: '#contact',
        label: 'View Opportunities',
        className: 'fgs-btn-secondary',
      },
    },
  ],
};

export const contactContent = {
  title: 'Contact',
  shared: {
    title: 'Get in Touch',
    email: 'info@farooqigrammar.school',
  },
  campusesTitle: 'Campuses',
  campuses: [
    {
      name: 'Boys Campus',
      phones: ['042-37731101', '042-37703255', '042-37726943'],
      address:
        '11 Shafi Street, Kacha Ravi Rd, Data Gunj Buksh Town, Lahore, 54000, Pakistan',
    },
    {
      name: 'Girls Campus',
      phones: ['042-37731101', '042-37703255', '042-37726943'],
      address:
        '12 Shafi Street, Kacha Ravi Rd, Data Gunj Buksh Town, Lahore, 54000, Pakistan',
    },
    {
      name: 'Kids Campus',
      phones: ['042-37726073', '042-37130138'],
      address: 'Placeholder',
    },
    {
      name: 'Edward Road Campus',
      phones: ['042-37237556'],
      address:
        '2-Edward Roard, Syed Mauj Darya Road, Jain Mandir, near Wasti Clinic, Lahore, Pakistan',
    },
  ],
  form: {
    title: 'Registration Form',
    description:
      'Share student details so our admissions team can follow up with next steps.',
  },
};
