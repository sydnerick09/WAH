/**
 * seedTasks.js
 *
 * Seeds 12 tasks into the `tasks` collection using the existing Task model.
 * Categories are limited to the schema's enum: Writing, Research, Data Entry,
 * Design, Transcription, Survey, Translation, Other.
 * Budgets follow the README's KES 1,200–4,600 range.
 *
 * NOTE: `clientId` is required by the schema (ref: 'User'). Replace
 * DEFAULT_CLIENT_ID below with a real User _id from your database before
 * running this script — every task below reuses that one placeholder.
 *
 * Usage:
 *   node seedTasks.js
 * (requires MONGODB_URI in your environment, and mongoose installed)
 */
 
import mongoose from 'mongoose';
import Task from './task.js'; // adjust path to match your project structure
 
const MONGODB_URI = process.env.MONGODB_URI;
 
// TODO: replace with a real User _id before running
const DEFAULT_CLIENT_ID = '000000000000000000000001';
 
const tasks = [
  {
    title: 'Write Product Descriptions for Nairobi Online Boutique',
    description:
      'Draft 20 concise, SEO-friendly product descriptions (80–120 words each) for a Nairobi-based fashion boutique\'s online store. Tone should be warm and locally relevant; avoid generic filler copy.',
    category: 'Writing',
    questions: [
      'Do you have prior e-commerce copywriting experience?',
      'Can you share two writing samples?',
    ],
    budget: 2200,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Nairobi, Kenya',
    attachments: [],
    isUrgent: false,
  },
  {
    title: 'Market Research: Mobile Money Usage Among SMEs in Kisumu',
    description:
      'Conduct desk research and compile a 5–7 page report on how small businesses in Kisumu use mobile money (M-Pesa, Airtel Money) for daily operations, including adoption barriers and preferred features.',
    category: 'Research',
    questions: [
      'Do you have experience with East African fintech research?',
      'What sources will you cite?',
    ],
    budget: 4200,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Kisumu, Kenya',
    attachments: [],
    isUrgent: false,
  },
  {
    title: 'Data Entry: Digitize 500 Handwritten Farm Records',
    description:
      'Enter 500 handwritten smallholder farm records (crop type, acreage, harvest dates, yield in kg) from scanned images into a provided Google Sheet template. Accuracy is critical — records will be cross-checked.',
    category: 'Data Entry',
    questions: [
      'Do you have access to a stable internet connection for 3+ hours a day?',
      'Have you done bulk data entry work before?',
    ],
    budget: 1800,
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Remote',
    attachments: [],
    isUrgent: true,
  },
  {
    title: 'Design Instagram Carousel Templates for Agribusiness Brand',
    description:
      'Create 6 reusable Instagram carousel templates (Canva or Figma) for an agribusiness brand targeting East African farmers. Templates should include placeholder text, brand colors, and simple iconography.',
    category: 'Design',
    questions: [
      'Do you work in Figma or Canva?',
      'Can you share a link to your design portfolio?',
    ],
    budget: 3500,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Remote',
    attachments: [],
    isUrgent: false,
  },
  {
    title: 'Transcribe 90 Minutes of Swahili-English Focus Group Audio',
    description:
      'Transcribe three 30-minute audio recordings of a mixed Swahili-English focus group discussion on youth unemployment. Output should be a clean, timestamped Word document with speaker labels.',
    category: 'Transcription',
    questions: [
      'Are you fluent in both Swahili and English?',
      'What transcription turnaround time can you commit to?',
    ],
    budget: 2600,
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Remote',
    attachments: [],
    isUrgent: true,
  },
  {
    title: 'Design a 4-Page Newsletter Layout for a Sacco',
    description:
      'Lay out a quarterly member newsletter (4 pages, print-ready PDF) for a savings and credit cooperative, using provided text and photos. Deliverable includes an editable source file.',
    category: 'Design',
    questions: [
      'Which design software do you use (InDesign, Canva, Illustrator)?',
      'Can you deliver a print-ready PDF with bleed?',
    ],
    budget: 3000,
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Remote',
    attachments: [],
    isUrgent: false,
  },
  {
    title: 'Survey Design & Distribution: Customer Satisfaction for a Local Bakery',
    description:
      'Design a 12-question customer satisfaction survey (Google Forms) for a bakery chain with outlets in Mombasa, then distribute it to at least 150 respondents and summarize results in a short report.',
    category: 'Survey',
    questions: [
      'Do you have an existing network to reach 150+ respondents in Mombasa?',
      'Have you built surveys in Google Forms or Typeform before?',
    ],
    budget: 2900,
    deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Mombasa, Kenya',
    attachments: [],
    isUrgent: false,
  },
  {
    title: 'Translate Health Awareness Pamphlet: English to Swahili',
    description:
      'Translate a 1,500-word maternal health awareness pamphlet from English to conversational, easily understood Swahili suitable for rural community distribution.',
    category: 'Translation',
    questions: [
      'Are you a native or fluent Swahili speaker?',
      'Do you have experience translating health or public-service content?',
    ],
    budget: 1900,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Remote',
    attachments: [],
    isUrgent: false,
  },
  {
    title: 'Research: Compare Solar Home System Providers in East Africa',
    description:
      'Compile a comparison table and 3-page summary of 8 solar home system providers operating in Kenya, Uganda, and Tanzania, covering pricing, financing plans, and warranty terms.',
    category: 'Research',
    questions: [
      'Have you researched the off-grid energy sector before?',
      'Can you provide sources for all pricing data?',
    ],
    budget: 3800,
    deadline: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Remote',
    attachments: [],
    isUrgent: false,
  },
  {
    title: 'Write 10 Blog Articles on Personal Finance for Young Professionals',
    description:
      'Write 10 original blog articles (600–800 words each) on personal finance topics relevant to young Kenyan professionals — budgeting, saving via chamas, investing basics, and avoiding debt traps.',
    category: 'Writing',
    questions: [
      'Do you have a background in finance or economics?',
      'Can you share links to previously published articles?',
    ],
    budget: 4600,
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Remote',
    attachments: [],
    isUrgent: false,
  },
  {
    title: 'Data Entry: Update Inventory Spreadsheet for a Hardware Store',
    description:
      'Cross-check and update a 1,200-line inventory spreadsheet for a hardware store chain, correcting SKU mismatches and filling in missing supplier and reorder-level fields.',
    category: 'Data Entry',
    questions: [
      'Are you comfortable working in Excel with formulas and pivot tables?',
      'How many hours per day can you dedicate to this task?',
    ],
    budget: 1200,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Remote',
    attachments: [],
    isUrgent: true,
  },
  {
    title: 'Miscellaneous: Curate a List of 50 Grant Opportunities for SMEs',
    description:
      'Research and compile a spreadsheet of 50 active grant or funding opportunities available to small and medium enterprises in Kenya, including eligibility criteria, deadlines, and application links.',
    category: 'Other',
    questions: [
      'Do you have experience compiling grant or funding databases?',
      'Can you verify each opportunity is currently open for applications?',
    ],
    budget: 3300,
    deadline: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    status: 'open',
    clientId: DEFAULT_CLIENT_ID,
    location: 'Remote',
    attachments: [],
    isUrgent: false,
  },
];
 
async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }
 
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');
 
  try {
    const inserted = await Task.insertMany(tasks);
    console.log(`Inserted ${inserted.length} tasks.`);
  } catch (err) {
    console.error('Error inserting tasks:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}
 
seed();