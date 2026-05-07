// lib/tasks.js
const posters = [
  'James Mwangi', 'Aisha Odhiambo', 'Brian Kamau', 'Fatuma Hassan', 'Peter Njoroge',
  'Grace Wanjiku', 'Samuel Otieno', 'Mercy Wangari', 'Daniel Kipchoge', 'Esther Auma',
  'Kevin Mutua', 'Lillian Chebet', 'Moses Karanja', 'Nancy Wairimu', 'Paul Omondi',
  'Rachel Nduta', 'Stephen Maina', 'Tabitha Njeri', 'Victor Ochieng', 'Winnie Adhiambo',
];

const locations = [
  'Nairobi, Kenya', 'Mombasa, Kenya', 'Kisumu, Kenya', 'Nakuru, Kenya', 'Eldoret, Kenya',
  'Lagos, Nigeria', 'Accra, Ghana', 'Dar es Salaam, Tanzania', 'Kampala, Uganda', 'Kigali, Rwanda',
  'Addis Ababa, Ethiopia', 'Lusaka, Zambia', 'Harare, Zimbabwe', 'Cape Town, South Africa', 'Johannesburg, South Africa',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function recentDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function randomPayment() {
  const amounts = [1000, 1200, 1500, 1800, 2000, 2200, 2500, 2800, 3000, 3200, 3500];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

const taskTemplates = [
  {
    title: 'Social Media Content Writing',
    description: 'Write 5 engaging social media posts for a fashion brand targeting young adults aged 18–30. Posts should include hashtags, emojis, and a clear call-to-action. Platforms: Instagram and Twitter.',
    questions: ['What tone should the posts have?', 'Should posts focus on a specific product?', 'Any brand colors or keywords to include?'],
    category: 'Writing',
  },
  {
    title: 'Product Research Report',
    description: 'Research and compile a report on the top 10 smartwatches available in Kenya in 2024. Include price range, features, pros/cons, and where to buy locally.',
    questions: ['Should the report include online and offline stores?', 'Any specific budget range?', 'Format: Word or PDF?'],
    category: 'Research',
  },
  {
    title: 'Data Entry – Customer Records',
    description: 'Enter 200 customer records from scanned forms into an Excel spreadsheet. Fields include: Name, Phone, Email, County, and Purchase Amount.',
    questions: ['Will you provide the scanned forms?', 'Any specific Excel format?', 'Deadline?'],
    category: 'Data Entry',
  },
  {
    title: 'Logo Design Feedback',
    description: 'Review 3 logo concepts for a new fintech startup and provide detailed written feedback on color psychology, typography, and overall brand suitability.',
    questions: ['Will you share the logo files?', 'Any target market info?', 'How detailed should the feedback be?'],
    category: 'Design',
  },
  {
    title: 'YouTube Video Transcription',
    description: 'Transcribe a 45-minute business webinar YouTube video into a clean Word document. Include speaker labels and timestamps every 5 minutes.',
    questions: ['What is the YouTube link?', 'Any specific formatting?', 'Is there background noise?'],
    category: 'Transcription',
  },
  {
    title: 'Market Survey – Food Delivery Apps',
    description: 'Conduct an online survey by filling out 50 questionnaire responses about food delivery app preferences. Responses must be varied and realistic.',
    questions: ['Which app is being surveyed?', 'Will you provide the survey link?', 'Any specific demographic?'],
    category: 'Survey',
  },
  {
    title: 'Website Content Review',
    description: 'Review and proofread the content of a 15-page business website. Identify grammatical errors, broken links, unclear CTAs, and suggest improvements.',
    questions: ['What is the website URL?', 'Should I suggest new content?', 'Any SEO focus?'],
    category: 'Writing',
  },
  {
    title: 'Translation – Swahili to English',
    description: 'Translate a 2,000-word business proposal from Swahili to professional English. The document covers a new agri-business startup in Western Kenya.',
    questions: ['Will you share the document?', 'Any technical terms to note?', 'Preferred delivery format?'],
    category: 'Translation',
  },
  {
    title: 'Google Maps Business Listings',
    description: 'Add 30 local businesses to Google Maps with complete details: name, address, phone number, hours, category, and photos.',
    questions: ['Will you provide business info?', 'Do you have photos?', 'Any specific area?'],
    category: 'Data Entry',
  },
  {
    title: 'Email Newsletter Writing',
    description: 'Write a monthly email newsletter for a real estate company. The newsletter should include market updates, featured listings, and a motivational quote. Approximately 600 words.',
    questions: ['Any properties to feature?', 'Preferred tone: formal or friendly?', 'Any subscriber segmentation?'],
    category: 'Writing',
  },
  {
    title: 'Competitor Analysis Report',
    description: 'Research 5 competitors of a Kenyan online grocery store. Analyze their pricing, delivery speed, UI/UX, and marketing strategy. Deliver a 3-page report.',
    questions: ['Which store are you analyzing?', 'Geographic focus?', 'Any specific metrics to prioritize?'],
    category: 'Research',
  },
  {
    title: 'Online Form Testing',
    description: 'Test a registration and checkout form on a new e-commerce website. Submit 20 test entries with different scenarios (valid, invalid, edge cases) and report bugs.',
    questions: ['What is the website link?', 'Should I test mobile view too?', 'Preferred reporting format?'],
    category: 'Testing',
  },
  {
    title: 'PowerPoint Presentation Design',
    description: 'Create a 15-slide PowerPoint presentation for a school science project on climate change. Include infographics, statistics, and a conclusion slide.',
    questions: ['What grade level?', 'Any specific subtopics?', 'Preferred color theme?'],
    category: 'Design',
  },
  {
    title: 'App Review Posting',
    description: 'Post 20 genuine-looking reviews for a new fitness app on the Google Play Store. Reviews should mention specific features and be between 50–100 words each.',
    questions: ['Will you provide app details?', 'Any features to highlight?', 'Star rating preference?'],
    category: 'Marketing',
  },
  {
    title: 'LinkedIn Profile Optimization',
    description: 'Rewrite and optimize a LinkedIn profile for a mid-level marketing professional. Improve the headline, summary, skills section, and experience descriptions.',
    questions: ['Will you share the current profile?', 'Target industry?', 'Open to work or not?'],
    category: 'Writing',
  },
  {
    title: 'Podcast Shownotes Writing',
    description: 'Write detailed shownotes for 5 podcast episodes. Each episode is 30 minutes. Include key points, guest bio, timestamps, and links mentioned.',
    questions: ['Will you provide episode audio or transcript?', 'Any SEO keywords?', 'Preferred length per episode?'],
    category: 'Writing',
  },
  {
    title: 'Photo Background Removal',
    description: 'Remove backgrounds from 100 product photos for an online clothing store. Deliver clean, white-background PNG files ready for e-commerce upload.',
    questions: ['Will you share the photos?', 'Any shadow effect needed?', 'Delivery format?'],
    category: 'Design',
  },
  {
    title: 'Research – Scholarship Opportunities',
    description: 'Find and compile a list of 20 active scholarship opportunities available for Kenyan university students. Include deadline, eligibility, amount, and application link.',
    questions: ['Any field of study preference?', 'Local or international scholarships?', 'Format: Excel or PDF?'],
    category: 'Research',
  },
  {
    title: 'Customer Support Chat Responses',
    description: 'Write 30 professional customer support chat templates for a telecom company. Cover billing, account reset, network issues, and cancellation requests.',
    questions: ['Any specific tone guidelines?', 'Will you provide current templates?', 'Escalation procedure needed?'],
    category: 'Writing',
  },
  {
    title: 'Blog Article – Cryptocurrency in Africa',
    description: 'Write a 1,200-word SEO-optimized blog article about cryptocurrency adoption in Africa. Use subheadings, include statistics, and a call-to-action at the end.',
    questions: ['Any target keywords?', 'Specific countries to focus on?', 'Internal links to include?'],
    category: 'Writing',
  },
  {
    title: 'Excel Data Cleaning',
    description: 'Clean a 5,000-row Excel dataset. Remove duplicates, fix formatting errors, standardize phone numbers to Kenyan format, and fill in missing values.',
    questions: ['Will you share the file?', 'Any specific rules for missing values?', 'Preferred delivery format?'],
    category: 'Data Entry',
  },
  {
    title: 'Instagram Hashtag Research',
    description: 'Research and compile 200 relevant hashtags for a Kenyan beauty brand. Categorize by size: mega, large, medium, and niche. Deliver in an Excel file.',
    questions: ['What products does the brand sell?', 'Any competitor accounts to reference?', 'Language preference?'],
    category: 'Marketing',
  },
  {
    title: 'Voice Recording – Swahili Script',
    description: 'Record a clear, professional Swahili voice-over for a 3-minute explainer video script. The script covers mobile banking features.',
    questions: ['Will you provide the script?', 'Male or female voice preference?', 'Any accent preference?'],
    category: 'Audio',
  },
  {
    title: 'Online Course Quiz Creation',
    description: 'Create 50 multiple-choice quiz questions for an online course on basic bookkeeping. Include 4 options per question and provide an answer key.',
    questions: ['Difficulty level?', 'Any textbook to reference?', 'Format: Word or Google Forms?'],
    category: 'Education',
  },
  {
    title: 'Facebook Ad Copy Writing',
    description: 'Write 10 Facebook ad copies for a local gym offering a January special. Each copy should have a headline, body text (under 90 words), and CTA.',
    questions: ['Any special offer details?', 'Target audience?', 'Tone: motivational or humorous?'],
    category: 'Marketing',
  },
  {
    title: 'Contact List Building',
    description: 'Find and compile contact details for 50 HR managers in Nairobi. Include: full name, company, email, LinkedIn URL, and phone number if available.',
    questions: ['Any specific industries?', 'Company size preference?', 'Delivery format?'],
    category: 'Research',
  },
  {
    title: 'Recipe Writing – Kenyan Cuisine',
    description: 'Write detailed recipes for 15 traditional Kenyan dishes. Include ingredients with measurements, step-by-step instructions, prep time, and serving suggestions.',
    questions: ['Any dietary restrictions to note?', 'Metric or imperial measurements?', 'Any dishes to exclude?'],
    category: 'Writing',
  },
  {
    title: 'Virtual Assistant Tasks',
    description: 'Provide virtual assistant services for one week: manage email inbox, schedule appointments, respond to basic inquiries, and organize Google Drive files.',
    questions: ['What tools do you use?', 'Hours per day?', 'Any confidential data handling?'],
    category: 'Admin',
  },
  {
    title: 'SEO Keyword Research',
    description: 'Research and compile 100 SEO keywords for a Kenyan travel blog. Include search volume, competition level, and suggested content titles for each keyword.',
    questions: ['Any focus destinations?', 'Short-tail or long-tail keywords?', 'Preferred tools?'],
    category: 'Marketing',
  },
  {
    title: 'Resume Writing Service',
    description: 'Rewrite a resume for a fresh Kenyan graduate applying for entry-level finance positions. Improve formatting, language, and highlight transferable skills.',
    questions: ['Will you share the current resume?', 'What degree was completed?', 'Any specific companies?'],
    category: 'Writing',
  },
  {
    title: 'Typing Task – Handwritten Notes',
    description: 'Type 80 pages of clear handwritten lecture notes into a clean Word document. Notes are from a university economics course.',
    questions: ['Will you share scanned copies?', 'Any formatting requirements?', 'Deadline?'],
    category: 'Transcription',
  },
  {
    title: 'TikTok Script Writing',
    description: 'Write 10 engaging TikTok video scripts for a personal finance influencer. Each script should be 60 seconds when read aloud and include a hook and CTA.',
    questions: ['Any specific topics?', 'Tone: educational or entertaining?', 'Target audience age?'],
    category: 'Writing',
  },
  {
    title: 'Product Description Writing',
    description: 'Write 50 unique product descriptions for an online electronics shop. Each description should be 80–100 words, SEO-optimized, and conversion-focused.',
    questions: ['Will you provide product specs?', 'Any brand voice guidelines?', 'Target customer?'],
    category: 'Writing',
  },
  {
    title: 'Spreadsheet Formula Setup',
    description: 'Set up an Excel spreadsheet with formulas for a small business monthly budget tracker. Include income, expenses, savings, and profit/loss calculations.',
    questions: ['How many categories?', 'Any charts needed?', 'Monthly or annual view?'],
    category: 'Data Entry',
  },
  {
    title: 'Ebook Formatting',
    description: 'Format a 10,000-word ebook manuscript in Microsoft Word. Apply consistent headings, page numbers, table of contents, and a professional layout ready for PDF export.',
    questions: ['Will you provide the manuscript?', 'Any cover page needed?', 'Preferred fonts?'],
    category: 'Design',
  },
  {
    title: 'Business Plan Research',
    description: 'Research and compile market data for a business plan for a Nairobi-based car wash startup. Include market size, competitors, pricing, and location analysis.',
    questions: ['Any specific Nairobi neighborhoods?', 'Any existing data to work from?', 'Length of report?'],
    category: 'Research',
  },
  {
    title: 'Comment Moderation Task',
    description: 'Moderate 500 social media comments on a brand page. Categorize as positive, negative, spam, or question. Flag priority responses needed within 24 hours.',
    questions: ['Which platform?', 'Will you provide access?', 'Any community guidelines?'],
    category: 'Admin',
  },
  {
    title: 'Website Content Writing – About Us',
    description: 'Write the "About Us", "Mission", "Vision", and "Team" sections for a new Kenyan NGO focused on youth empowerment. Total word count: 600 words.',
    questions: ['Will you provide organization background?', 'Formal or conversational tone?', 'Any staff bios needed?'],
    category: 'Writing',
  },
  {
    title: 'Academic Research Summary',
    description: 'Summarize 5 academic papers on microfinance in East Africa. Provide a 200-word summary per paper covering key arguments, methodology, and findings.',
    questions: ['Will you provide the papers?', 'Any citation format?', 'Focus area?'],
    category: 'Research',
  },
  {
    title: 'Customer Feedback Analysis',
    description: 'Analyze 300 customer feedback responses for a delivery company. Identify top complaints, compliments, and suggestions. Deliver a 2-page summary report.',
    questions: ['Will you provide the responses?', 'Excel or Google Sheets format?', 'Timeline?'],
    category: 'Research',
  },
  {
    title: 'Social Media Profile Setup',
    description: 'Set up complete business profiles on Facebook, Instagram, and Twitter for a new salon in Westlands, Nairobi. Include bio, contact info, and initial 5 posts.',
    questions: ['Will you provide business info?', 'Logo and images available?', 'Any target audience details?'],
    category: 'Marketing',
  },
  {
    title: 'Inventory List Creation',
    description: 'Create an Excel inventory list for a retail shop with 150 products. Include columns for product name, SKU, category, quantity, unit price, and reorder level.',
    questions: ['Will you provide the product list?', 'Any existing format?', 'Auto-calculations needed?'],
    category: 'Data Entry',
  },
  {
    title: 'Book Summary Writing',
    description: 'Write a detailed chapter-by-chapter summary of "Rich Dad Poor Dad" by Robert Kiyosaki. Each chapter summary should be 150–200 words.',
    questions: ['Any specific format?', 'Include key quotes?', 'Delivery: Word or PDF?'],
    category: 'Writing',
  },
  {
    title: 'Video Subtitles Addition',
    description: 'Add accurate English subtitles to a 20-minute YouTube tutorial video. Deliver as an SRT file synchronized with the audio.',
    questions: ['What is the video link?', 'Any technical terms to note?', 'Any foreign words?'],
    category: 'Transcription',
  },
  {
    title: 'WhatsApp Business Setup',
    description: 'Set up a professional WhatsApp Business profile for a coaching business. Configure catalog, auto-replies, labels, and draft 10 quick reply templates.',
    questions: ['Will you provide business details?', 'Product/service catalog info?', 'Brand tone?'],
    category: 'Admin',
  },
  {
    title: 'Grant Application Research',
    description: 'Research 10 active grant opportunities for women-led small businesses in Kenya. Include grant name, amount, eligibility, deadline, and application steps.',
    questions: ['Business type?', 'Revenue range?', 'Local or international grants?'],
    category: 'Research',
  },
  {
    title: 'Canva Graphic Design',
    description: 'Design 20 social media graphics using Canva for a food business. Sizes: 1080x1080 for Instagram, 1200x628 for Facebook. Include branding elements.',
    questions: ['Will you provide brand colors and logo?', 'Any specific products to feature?', 'Preferred style?'],
    category: 'Design',
  },
  {
    title: 'Testimonial Collection',
    description: 'Reach out to 30 past customers via email or social media and collect written testimonials for a cleaning company. Format and deliver in a Word document.',
    questions: ['Will you provide contact list?', 'Incentive offered to customers?', 'Any specific questions?'],
    category: 'Marketing',
  },
  {
    title: 'Microsoft Word Template Creation',
    description: 'Create 5 professional Microsoft Word templates: Invoice, Quotation, Receipt, Meeting Agenda, and Business Letter. Include company logo placeholder.',
    questions: ['Any branding guidelines?', 'Company name to include?', 'Preferred color scheme?'],
    category: 'Design',
  },
  {
    title: 'Podcast Guest Research',
    description: 'Research and compile a list of 20 potential podcast guests for a Kenyan entrepreneurship podcast. Include bio, contact email, LinkedIn, and area of expertise.',
    questions: ['Any specific industries?', 'Guest follower count requirement?', 'Outreach email template needed?'],
    category: 'Research',
  },
  {
    title: 'Daily News Summary Writing',
    description: 'Write a daily 400-word business news summary for 5 consecutive days. Cover Kenyan business, finance, and tech news. Format as a newsletter-style brief.',
    questions: ['Any specific news sources?', 'Formal or casual tone?', 'Any topics to exclude?'],
    category: 'Writing',
  },
];

export const TASKS = taskTemplates.map((t, i) => ({
  id: i + 1,
  ...t,
  poster: randomItem(posters),
  location: randomItem(locations),
  datePosted: recentDate(Math.floor(Math.random() * 7)),
  payment: randomPayment(),
}));
