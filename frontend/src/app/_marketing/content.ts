import type { MarketingNavItem, MarketingParagraphBlock } from './types';

export const previewOneNavItems: MarketingNavItem[] = [
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
  showcaseLabel: 'Student Life Gallery Preview',
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

export const galleryContent = {
  title: 'Student Life Gallery',
  images: [
    { src: '/img01.webp', alt: 'Student life gallery image 1' },
    { src: '/img04.webp', alt: 'Student life gallery image 2' },
    { src: '/img05.webp', alt: 'Student life gallery image 2' },
    { src: '/img06.webp', alt: 'Student life gallery image 3' },
    { src: '/img07.webp', alt: 'Student life gallery image 4' },
    { src: '/img08.webp', alt: 'Student life gallery image 5' },
    { src: '/img09.webp', alt: 'Student life gallery image 6' },
    { src: '/img12.webp', alt: 'Student life gallery image 8' },
  ],
};
