import { achievementsContent, contactContent } from '@/app/_marketing/content';
import type { SiteNavItem } from './types';

export const marketingNavItems: SiteNavItem[] = [
  { href: '/preview', label: 'Home' },
  { href: '/preview/about', label: 'About' },
  { href: '/preview/campuses', label: 'Campuses' },
  { href: '/preview/why-fgs', label: 'Why FGS' },
  { href: '/preview/register', label: 'Register' },
  { href: '/preview/contact', label: 'Contact' },
];

export const homeContent = {
  eyebrow: 'Farooqi Grammar School',
  title:
    'A school in Lahore focused on academic excellence, character, and confident student growth.',
  description:
    'Farooqi Grammar School supports students with strong academics, a values-based environment, and clear guidance from early years through matric.',
  primaryCta: {
    href: '/preview/register',
    label: 'Start Registration',
  },
  secondaryCta: {
    href: '/preview/campuses',
    label: 'Explore Campuses',
  },
  overviewTitle: 'A Dedicated Learning Environment for Students',
  overviewParagraphs: [
    'Farooqi Grammar School is a trusted school in Lahore with a long-standing commitment to academic excellence, student development, and strong educational values. For decades, families have chosen FGS for its structured learning environment, supportive teaching approach, and consistent academic standards.',
    'We believe education is about more than examination results. Our classrooms are designed to help students build confidence, discipline, curiosity, and responsibility alongside strong academic ability. Through considerate teaching, meaningful classroom engagement, and consistent guidance, students are encouraged to participate actively in learning and grow with confidence both inside and outside the classroom.',
    'As an English-medium school in Lahore with decades of educational experience, FGS supports students from early years through to Matric, preparing them for life beyond the classroom.',
  ],
  secondaryOverviewTitle: 'Supporting Students Across Lahore',
  seconddaryOverviewParagraphs: [
    'Across Lahore, Farooqi Grammar School campuses provide students with focused academic support and a learning environment designed to nurture both personal and educational growth. Each campus reflects the same commitment to discipline, strong teaching, and student development that families have trusted for decades.',
    'From early learning through to senior classes, students benefit from attentive guidance, meaningful classroom engagement, and a school culture that encourages confidence, responsibility, and consistent progress.',
    'While every campus serves its own community, all share the same educational values and academic standards that define the FGS experience.',
  ],
};

export const aboutContent = {
  title: 'About Farooqi Grammar School',
  intro:
    'Farooqi Grammar School has served families in Lahore for decades with a clear commitment to academic excellence, character development, and meaningful education.',
  overviewTitle: 'A Legacy Built on Trust, Discipline, and Educational Purpose',
  overviewParagraphs: [
    'Farooqi Grammar School grew from a strong founding vision into a trusted educational institution shaped by dedicated teachers, supportive families, and generations of students who have gone on to contribute across many fields.',
    'For decades, the school has remained focused on the essentials that matter most to parents: teaching that builds understanding, guidance that strengthens confidence, and an environment where students are encouraged to approach learning with seriousness and purpose.',
    'That consistency continues to define the FGS experience today. Families are not only choosing a school; they are becoming part of a long-standing culture of learning shaped through years of trust, discipline, and academic commitment.',
  ],
  foundersTitle: 'Meet Our Founders',
  foundersParagraphs: [
    'Farooqi Schools were founded in 1978 by Honorable Sir Asim Farooqi and Respected Madam Zahida Asim Farooqi in Karim Park, Ravi Road, with a vision grounded in service, purpose, and educational excellence. At a time when both held promising careers in the government education sector, they chose to step away from personal advancement to dedicate themselves to providing quality education to the wider community.',
    'What began in a single room gradually grew into a strong educational institution built on commitment, discipline, and trust. Today, Farooqi Schools have expanded into multiple branches, with thousands of alumni contributing meaningfully across various fields.',
    'The founders established not just a school, but a tradition of integrity, hard work, and character-building: values that continue to guide Farooqi Schools and inspire future generations. Farooqi Grammar School has achieved 47 positions in Lahore Board Matric Exams over the last 26 years.',
  ],
  futureTitle: 'Preparing Students for the Future',
  futureParagraphs: [
    'As education continues to evolve, Farooqi Grammar School remains committed to providing students with the knowledge, confidence, and character needed beyond the classroom.',
    'By combining academic focus with thoughtful teaching practices, meaningful student engagement, and a balanced approach to modern learning, FGS continues to prepare students not only for examinations, but for life.',
  ],
};

export const campusesContent = {
  overview: {
    title: 'Explore Our Campuses',
    paragraph:
      'Each FGS campus aims to provide students with clear academic guidance, supportive classroom learning, and an environment where discipline, participation, and steady progress are encouraged. While each campus supports its own local community, all share the educational values and standards that define the FGS experience. We’re also committed to providing accessible, high-quality education for families across Lahore.',
  },
  hero: {
    title: 'Our Campuses',
    paragraph:
      'Farooqi Grammar School serves families across multiple campuses in Lahore, with each campus built around the same commitment to academic excellence, student development, and supportive learning.',
  },
  campusCards: {
    'FGS Ravi Road Boys Campus': {
      paragraphs: [
        'Located near Karim Park and Ravi Road in Lahore, the Ravi Road Boys Campus provides students with a focused academic environment centred around discipline, consistency, and meaningful learning support. Teachers work closely with students to motivate academic progress while also helping them develop responsibility, focus, and self-confidence throughout their school journey.',
        'With supportive classroom guidance and a strong academic culture, the campus aims to help students prepare for future academic challenges with clarity and confidence.',
      ],
      principal: 'Principal: [Principal Name]',
    },
    'FGS Ravi Road Girls Campus': {
      paragraphs: [
        'The Ravi Road Girls Campus in Lahore provides students with a supportive academic environment where confidence-building, classroom participation, and educational progress are encouraged. Through attentive teaching and meaningful classroom engagement, students are encouraged to participate actively in learning while developing independence, responsibility, and strong educational foundations.',
        'The campus continues the wider FGS commitment to balanced education, combining academic standards with character development and supportive guidance.',
      ],
      principal: 'Principal: [Principal Name]',
    },
    'FGS Ravi Road Kids Campus': {
      paragraphs: [
        'The Ravi Road Kids Campus is designed to give younger learners a positive and structured introduction to education. Through guided teaching, routine, care, and classroom interaction, students begin developing the confidence, curiosity, and foundational skills that support long-term learning.',
        'The environment is designed to help children feel supported, engaged, and comfortable as they begin their academic journey.',
      ],
      principal: 'Principal: [Principal Name]',
    },
    'FGS Edward Road (PG to Matric)': {
      paragraphs: [
        'Serving students from PG to Matric, the Edward Road Campus supports students through multiple stages of their academic development with a strong emphasis on concept clarity, consistency, and steady progress.',
        'Students benefit from thoughtful teaching, supportive classroom learning, and guidance designed to help them build both academic confidence and responsibility throughout their educational journey.',
      ],
      principal: 'Principal: [Principal Name]',
    },
  } satisfies Record<string, { paragraphs: string[]; principal: string }>,
  campusPlaceholders: {
    'FGS Ravi Road Boys Campus': 'Boys Campus',
    'FGS Ravi Road Girls Campus': 'Girls Campus',
    'FGS Ravi Road Kids Campus': 'Kids Campus',
    'FGS Edward Road (PG to Matric)': 'Edward Road Campus',
  } satisfies Record<string, string>,
};

export const contactPageContent = {
  title: 'Contact Farooqi Grammar School',
  description:
    'Families can contact Farooqi Grammar School directly by phone or email for admissions information, campus enquiries, appointment guidance, or general support. Select a campus below to view contact details and location information.',
  timingsTitle: 'Admissions Office Opening Times',
  timingsParagraphs: [
    'Monday to Thursday & Saturday: 8:00 AM - 2:00 PM',
    'Friday: 8:00 AM - 12:00 PM',
  ],
};

export const whyFgsContent = {
  title: 'Why Families Choose Farooqi Grammar School',
  description:
    'Choosing a school is about more than facilities. Families want strong academic standards, supportive teachers, and an environment where students can grow with confidence, discipline, and purpose. For decades, Farooqi Grammar School has supported students across Lahore with education that values both academic achievement and character development.',
  cardsTitle: 'Why Join Farooqi Grammar School?',
  reasons: [
    {
      title: 'Strong Academic Foundations',
      description:
        'Farooqi Grammar School places strong emphasis on concept clarity, structured learning, and consistent academic progress. Through attentive teaching and focused classroom support, students are guided to develop the understanding, discipline, and study habits needed for long-term academic success, reflected in the school’s consistent Lahore Board performance.',
    },
    {
      title: 'Confidence, Character, and Values',
      description:
        'Education at FGS is designed to support personal growth alongside academic development. Students are encouraged to develop confidence, responsibility, respect, and self-discipline within an environment shaped by strong cultural and educational values. The aim is not only to prepare students for examinations, but also to help them grow into thoughtful and responsible individuals.',
    },
    {
      title: 'Individual Guidance and Support',
      description:
        'Every student learns differently. FGS places importance on mindful classroom teaching and meaningful teacher-student engagement so students receive the guidance, encouragement, and support they need throughout their academic journey, building confidence over time.',
    },
    {
      title: 'Accessible Quality Education',
      description:
        'Farooqi Grammar School believes quality education should remain accessible to families across Lahore. The school continues to maintain strong educational standards while providing an affordable learning environment for students from different backgrounds and communities.',
    },
    {
      title: 'Learning Beyond the Classroom',
      description:
        'Student development extends beyond academic work alone. Across FGS campuses, students take part in co-curricular activities, competitions, events, and experiences that emphasise teamwork, creativity, communication, and confidence-building. These opportunities help students develop important life skills alongside their classroom learning.',
    },
    {
      title: 'A Safe Learning Environment',
      description:
        'FGS aims to provide students with a disciplined, respectful, and warm learning environment where they feel secure, motivated, and supported to grow. The school culture emphasises consistency, mutual respect, and positive classroom engagement to help students focus confidently on learning and development.',
    },
    {
      title: 'Preparing Students for the Future',
      description:
        'As education continues to evolve, FGS remains committed to helping students develop the knowledge, confidence, and adaptability needed for the future. By combining academic focus with thoughtful teaching and meaningful student engagement, we prepare students not only for examinations, but for life beyond the classroom.',
    },
  ],
  affordabilityTitle: 'Affordable Education Across Our Campuses',
  affordabilityParagraphs: [
    'Farooqi Grammar School believes that quality education should remain accessible to families across Lahore. Across our campuses, monthly tuition fees remain considerate to support affordability while maintaining the academic standards, classroom support, and learning environment families expect from FGS.',
  ],
  faqTitle: 'Frequently Asked Questions',
  faqs: [
    {
      question: 'Which areas of Lahore does Farooqi Grammar School serve?',
      answer:
        'FGS serves families across multiple campuses in Lahore, including Ravi Road, Karim Park, and surrounding communities.',
    },
    {
      question: 'Does FGS provide English-medium education?',
      answer:
        'Yes. Farooqi Grammar School provides English-medium education with a balanced focus on academics, discipline, and student development.',
    },
    {
      question: 'Which class levels are offered at FGS?',
      answer:
        'FGS campuses support students from early years through to Matric, depending on the campus and academic stage.',
    },
    {
      question: 'How can parents enquire about admissions?',
      answer:
        'Families can register online or contact individual campuses directly for admissions guidance and appointment information.',
    },
    {
      question: 'Can parents enquire about fee structures?',
      answer:
        'Yes. Parents can contact the admissions team directly for campus-specific fee structure and admissions information.',
    },
  ],
  closingTitle: 'A Long-Term Commitment to Student Growth',
  closingParagraphs: [
    'For families seeking a school in Lahore that values both academic achievement and character development, Farooqi Grammar School continues to offer a balanced and supportive educational experience shaped by decades of trust, guidance, and consistency.',
  ],
};

export const registerContent = {
  title: 'Register With Farooqi Grammar School',
  description:
    'Families can register their interest online and begin the admissions process with Farooqi Grammar School through the form below. The admissions team will then guide parents through the next steps, helping keep the process clear, supportive, and straightforward from the beginning.',
  processTitle: 'How Registration Works',
  steps: [
    {
      title: 'Step 1: Share Student and Parent Details',
      description:
        'Complete the registration form with the required student, parent, class, and contact information so the admissions team can understand your requirements clearly.',
    },
    {
      title: 'Step 2: Select a Campus and Appointment Time',
      description:
        'Choose the Farooqi Grammar School campus you are interested in and select a suitable date and time for your appointment.',
    },
    {
      title: 'Step 3: Admissions Team Follow-Up',
      description:
        'Once the form has been submitted, the admissions team will contact families to guide them through the next stages of the registration process and answer any additional questions.',
    },
  ],
  timingsTitle: 'Admissions Timings',
  timings: [
    {
      label: 'Monday to Thursday & Saturday:',
      value: '8:00 AM - 2:00 PM',
    },
    {
      label: 'Friday:',
      value: '8:00 AM - 12:00 PM',
    },
  ],
  supportTitle: 'Admissions Support',
  supportParagraph:
    'If families need assistance before submitting the form, the FGS admissions team can be contacted directly through the campus contact information provided below.',
  supportLink: {
    href: '/preview/contact',
    label: 'Contact Us',
  },
  faqTitle: 'Frequently Asked Questions',
  faqs: [
    {
      question: 'Are admissions open across all campuses?',
      answer:
        'Admissions are open across multiple FGS campuses in Lahore for families seeking English-medium education and supportive academic guidance. Families can contact the admissions team directly for current information.',
    },
    {
      question: 'Can parents choose their preferred campus?',
      answer:
        'Yes. Families can select their preferred campus during the registration process.',
    },
    {
      question: 'Will the admissions team contact families after registration?',
      answer:
        'Yes. The admissions team will follow up directly after the registration form has been submitted.',
    },
  ],
};

export const schoolStats = achievementsContent.stats;
export const contactDetails = contactContent;
