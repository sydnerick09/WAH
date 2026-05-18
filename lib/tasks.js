// lib/tasks.js
const posters = [
  'Eric Mwangi',
  'Faith Wanjiru',
  'Kevin Kiptoo',
  'Mercy Achieng',
  'Brian Mutiso',
  'Sharon Njeri',
  'Dennis Omondi',
  'Purity Wambui',
  'Victor Kiprono',
  'Lilian Chepkemoi',
  'Samuel Kariuki',
  'Brenda Atieno',
  'John Kamau',
  'Caroline Wairimu',
  'Martin Ochieng',
  'Diana Jepkorir',
  'Paul Kibet',
  'Lucy Nyambura',
  'Evans Maina',
  'Esther Anyango',
  'George Kimani',
  'Cynthia Moraa',
  'David Kiplangat',
  'Ann Wanjala',
  'Peter Mworia',
  'Maureen Akinyi',
  'Chris Mutua',
  'Janet Chelimo',
  'Dennis Barasa',
  'Joyce Naliaka',
  'Kevin Odhiambo',
  'Susan Wambui',
  'Mark Kipchumba',
  'Ruth Njoki',
  'Brian Kariuki',
  'Mercy Jepkoech',
  'Victor Muriuki',
  'Faith Atieno',
  'Steve Karanja',
  'Dorcas Wangeci',
];

const locations = [
  'Nairobi, Kenya',
  'Westlands, Nairobi',
  'Kilimani, Nairobi',
  'Ruiru, Kenya',
  'Thika, Kenya',
  'Kiambu, Kenya',
  'Mombasa, Kenya',
  'Nyali, Mombasa',
  'Kisumu, Kenya',
  'Nakuru, Kenya',
  'Eldoret, Kenya',
  'Machakos, Kenya',
  'Kitale, Kenya',
  'Meru, Kenya',
  'Nyeri, Kenya',
  'Kakamega, Kenya',
  'Naivasha, Kenya',
  'Kericho, Kenya',
  'Narok, Kenya',
  'Malindi, Kenya',
  'Isiolo, Kenya',
  'Embu, Kenya',
  'Bungoma, Kenya',
  'Kisii, Kenya',
  'Homabay, Kenya',
  'Migori, Kenya',
  'Uasin Gishu, Kenya',
  'Siaya, Kenya',
  'Busia, Kenya',
  'Garissa, Kenya',
  'Arusha, Tanzania',
  'Kampala, Uganda',
  'Kigali, Rwanda',
  'Lagos, Nigeria',
  'Accra, Ghana',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function recentDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);

  return d.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function randomPayment() {
  return Math.floor(Math.random() * 2001) + 1000;
}

const advancedTasks = [
  {
    title: 'Advanced Cryptocurrency Market Analysis Report',
    description:
      'Research and prepare a detailed 25-page cryptocurrency investment report covering Bitcoin trends, Ethereum ecosystem growth, market volatility analysis, risk management, and future projections for African investors.',
    questions: [
      'Can you use financial charts?',
      'Do you understand blockchain trends?',
      'Can you deliver professional reports?',
    ],
    category: 'Research',
  },

  {
    title: '10,000 Word SEO Business Blog Series',
    description:
      'Write a complete SEO-optimized business blog series consisting of 10 long-form articles targeting entrepreneurs in Africa. Include keyword optimization, internal linking suggestions, and CTA sections.',
    questions: [
      'Can you write SEO content?',
      'Have you used SurferSEO or Ahrefs?',
      'Can you meet tight deadlines?',
    ],
    category: 'Writing',
  },

  {
    title: 'Large Scale Excel Financial Dashboard',
    description:
      'Build an advanced Excel financial dashboard with automated formulas, pivot tables, dynamic charts, expense tracking, revenue forecasting, and KPI monitoring for a logistics company.',
    questions: [
      'Can you use advanced Excel formulas?',
      'Do you know Power Query?',
      'Can you automate calculations?',
    ],
    category: 'Data Entry',
  },

  {
    title: 'Professional Brand Identity Design',
    description:
      'Design a complete corporate brand identity including logos, typography, social media kits, business cards, flyers, and presentation templates for a fintech startup.',
    questions: [
      'Can you use Adobe Illustrator?',
      'Do you deliver source files?',
      'Can you follow branding guidelines?',
    ],
    category: 'Design',
  },

  {
    title: '12-Hour Audio Transcription Project',
    description:
      'Transcribe 12 hours of legal and corporate meeting recordings into clean Word documents with timestamps, speaker labels, and professional formatting.',
    questions: [
      'Can you maintain high accuracy?',
      'Have you handled long audio files?',
      'Can you meet delivery timelines?',
    ],
    category: 'Transcription',
  },

  {
    title: 'Advanced Facebook & TikTok Ad Campaign',
    description:
      'Create and manage a 30-day advertising campaign across Facebook, Instagram, and TikTok. Optimize engagement, conversions, and audience targeting for a fashion brand.',
    questions: [
      'Can you manage paid ads?',
      'Do you understand pixel tracking?',
      'Can you provide campaign analytics?',
    ],
    category: 'Marketing',
  },

  {
    title: 'Swahili to English Legal Translation',
    description:
      'Translate a 300-page legal agreement document from Swahili into professional English while preserving legal terminology and formatting.',
    questions: [
      'Have you translated legal documents?',
      'Can you maintain legal accuracy?',
      'Preferred translation tools?',
    ],
    category: 'Translation',
  },

  {
    title: 'University E-learning Course Development',
    description:
      'Create a complete online course package including quizzes, assignments, PowerPoint slides, notes, and assessments for an entrepreneurship training program.',
    questions: [
      'Can you create educational materials?',
      'Do you understand LMS systems?',
      'Can you organize course structures?',
    ],
    category: 'Education',
  },

  {
    title: 'Enterprise Software Testing Project',
    description:
      'Perform advanced QA testing on an e-commerce platform. Identify bugs, create detailed reports, test payment systems, forms, mobile responsiveness, and user experience.',
    questions: [
      'Have you done QA testing before?',
      'Can you create bug reports?',
      'Do you test mobile devices too?',
    ],
    category: 'Testing',
  },

  {
    title: 'Virtual Executive Assistant Services',
    description:
      'Manage executive calendars, organize documents, schedule meetings, respond to client emails, and coordinate remote operations for a startup founder for 14 days.',
    questions: [
      'Can you work independently?',
      'Do you have communication skills?',
      'Can you manage confidential data?',
    ],
    category: 'Admin',
  },
];

// Generate up to 80 advanced tasks
const taskTemplates = [];

for (let i = 0; i < 80; i++) {
  const task = advancedTasks[i % advancedTasks.length];

  taskTemplates.push({
    ...task,
    title: `${task.title} #${i + 1}`,
  });
}

export const TASKS = taskTemplates.map((t, i) => ({
  id: i + 1,
  ...t,
  poster: randomItem(posters),
  location: randomItem(locations),
  datePosted: recentDate(Math.floor(Math.random() * 7)),
  payment: randomPayment(),
}));