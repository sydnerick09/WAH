// lib/tasks.js

const posters = [
  'Eric Mwangi', 'Faith Wanjiru', 'Kevin Kiptoo', 'Mercy Achieng',
  'Brian Mutiso', 'Sharon Njeri', 'Dennis Omondi', 'Purity Wambui',
  'Victor Kiprono', 'Lilian Chepkemoi', 'Samuel Kariuki', 'Brenda Atieno',
  'John Kamau', 'Caroline Wairimu', 'Martin Ochieng', 'Diana Jepkorir',
  'Paul Kibet', 'Lucy Nyambura', 'Evans Maina', 'Esther Anyango',
  'George Kimani', 'Cynthia Moraa', 'David Kiplangat', 'Ann Wanjala',
  'Peter Mworia', 'Maureen Akinyi', 'Chris Mutua', 'Janet Chelimo',
  'Dennis Barasa', 'Joyce Naliaka', 'Kevin Odhiambo', 'Susan Wambui',
  'Mark Kipchumba', 'Ruth Njoki', 'Brian Kariuki', 'Mercy Jepkoech',
  'Victor Muriuki', 'Faith Atieno', 'Steve Karanja', 'Dorcas Wangeci',
];

const locations = [
  'Nairobi, Kenya', 'Westlands, Nairobi', 'Kilimani, Nairobi',
  'Ruiru, Kenya', 'Thika, Kenya', 'Kiambu, Kenya', 'Mombasa, Kenya',
  'Nyali, Mombasa', 'Kisumu, Kenya', 'Nakuru, Kenya', 'Eldoret, Kenya',
  'Machakos, Kenya', 'Kitale, Kenya', 'Meru, Kenya', 'Nyeri, Kenya',
  'Kakamega, Kenya', 'Naivasha, Kenya', 'Kericho, Kenya', 'Narok, Kenya',
  'Malindi, Kenya', 'Isiolo, Kenya', 'Embu, Kenya', 'Bungoma, Kenya',
  'Kisii, Kenya', 'Homabay, Kenya', 'Migori, Kenya', 'Uasin Gishu, Kenya',
  'Siaya, Kenya', 'Busia, Kenya', 'Garissa, Kenya', 'Arusha, Tanzania',
  'Kampala, Uganda', 'Kigali, Rwanda', 'Lagos, Nigeria', 'Accra, Ghana',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function recentDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── TIER 1 — KSh 1,200–1,800 (Very Easy — 5 to 15 min) ─────────────────────
const tier1 = [
  {
    title: 'Write 5 Appointment-Reminder SMS for a Dental Clinic',
    description:
      'Write 5 short, friendly SMS reminders (under 160 characters each) that a Nairobi dental clinic can send to patients the day before their appointment. Each message should include a placeholder for the patient name and appointment time, sound caring (not robotic), and gently remind them to arrive 10 minutes early.',
    questions: [
      'Can you write short, warm SMS copy?',
      'Can you keep each message under 160 characters?',
      'Can you deliver within 20 minutes?',
    ],
    category: 'Writing',
    payment: 1200,
  },
  {
    title: 'List 10 Trending YouTube Shorts Ideas for a Comedy Page',
    description:
      'Suggest 10 fresh, trend-aware YouTube Shorts ideas for a Kenyan comedy skit page. For each idea provide a punchy title and a one-line premise. Ideas should be relatable to a young Kenyan audience, easy to film on a phone, and built to be shared.',
    questions: [
      'Are you familiar with short-form video trends?',
      'Can you write ideas that suit a Kenyan youth audience?',
      'Can you deliver within 25 minutes?',
    ],
    category: 'Marketing',
    payment: 1300,
  },
  {
    title: 'Proofread a 200-Word School Newsletter',
    description:
      'Proofread a 200-word primary-school newsletter for spelling, grammar, punctuation, and clarity. Return a clean corrected version and a short bullet list of the main changes you made. Do not rewrite the content — only fix errors and improve readability.',
    questions: [
      'Do you have a strong eye for spelling and grammar?',
      'Can you correct without changing the meaning?',
      'Can you deliver within 20 minutes?',
    ],
    category: 'Admin',
    payment: 1350,
  },
  {
    title: 'Translate 5 Café Menu Items to French',
    description:
      'Translate 5 café menu items (with their short descriptions) from English into natural, appetising French for a Nairobi coffee shop serving international tourists. Keep the translations concise and menu-friendly, and use correct culinary terms where they exist.',
    questions: [
      'Are you fluent in written French?',
      'Can you translate food terms accurately and naturally?',
      'Can you deliver within 25 minutes?',
    ],
    category: 'Translation',
    payment: 1450,
  },
  {
    title: 'Suggest 8 Catchy Names for a Mobile Car-Wash Startup',
    description:
      'Brainstorm 8 memorable, brandable names for a new mobile car-wash service in Nairobi that comes to the customer\'s home or office. Each name should be short, easy to say, and available-sounding. Add a one-line reason for each name explaining its appeal.',
    questions: [
      'Can you brainstorm creative, brandable names?',
      'Do you understand what makes a name marketable?',
      'Can you deliver within 20 minutes?',
    ],
    category: 'Marketing',
    payment: 1550,
  },
  {
    title: 'Write a 40-Word Instagram Bio for a Fitness Coach',
    description:
      'Write a punchy 40-word Instagram bio for a Nairobi personal fitness coach. It should communicate their niche (home workouts, weight loss), build trust, add a touch of personality, and end with a clear call to action and a placeholder for a booking link.',
    questions: [
      'Can you write concise, high-impact bio copy?',
      'Can you fit personality and a CTA into 40 words?',
      'Can you deliver within 15 minutes?',
    ],
    category: 'Writing',
    payment: 1650,
  },
  {
    title: 'Create a 6-Item Pre-Safari Packing Checklist',
    description:
      'Create a clear, friendly 6-item packing checklist that a Kenyan safari tour company can send to clients before a 3-day trip to the Maasai Mara. Each item should have a short reason (1 sentence) so travellers understand why it matters.',
    questions: [
      'Can you write clear, practical checklists?',
      'Are you familiar with what safari travellers need?',
      'Can you deliver within 20 minutes?',
    ],
    category: 'Admin',
    payment: 1750,
  },
  {
    title: 'Write 2 Flash-Sale Push Notifications for a Shopping App',
    description:
      'Write 2 attention-grabbing push-notification messages (under 90 characters each) for a Kenyan shopping app announcing a 3-hour flash sale. Each should create urgency, hint at the discount, and drive an immediate tap. Provide a short title and body for each.',
    questions: [
      'Can you write punchy, urgency-driven microcopy?',
      'Can you keep within tight character limits?',
      'Can you deliver within 15 minutes?',
    ],
    category: 'Marketing',
    payment: 1800,
  },
];

// ── TIER 2 — KSh 1,900–2,800 (Easy — 15 to 40 min) ─────────────────────────
const tier2 = [
  {
    title: 'Write 3 YouTube Titles + Descriptions for a Cooking Channel',
    description:
      'Write 3 click-worthy YouTube video titles, each with a 2–3 sentence description, for a Kenyan home-cooking channel. Recipes are: (1) 15-minute chapati, (2) budget beef stew, (3) healthy sukuma wiki. Titles should be searchable and curiosity-driven; descriptions should include a soft call to subscribe.',
    questions: [
      'Are you familiar with YouTube titling and SEO?',
      'Can you write for a Kenyan food audience?',
      'Can you deliver within 30 minutes?',
    ],
    category: 'Writing',
    payment: 1900,
  },
  {
    title: 'Turn a 400-Word Press Release into 3 Tweets',
    description:
      'Read the provided 400-word company press release and distil it into 3 standalone tweets (under 280 characters each). Tweet 1 should announce the news, tweet 2 should highlight the key benefit, and tweet 3 should drive action with a link placeholder. Keep the brand tone professional but lively.',
    questions: [
      'Can you distil long content into sharp social posts?',
      'Can you write within Twitter/X character limits?',
      'Can you deliver within 25 minutes?',
    ],
    category: 'Research',
    payment: 2000,
  },
  {
    title: 'Draft a 6-Question Gym Onboarding Survey',
    description:
      'Design a 6-question onboarding survey a Nairobi gym can send to new members. Cover fitness goals, experience level, preferred workout times, injuries/limitations, motivation, and how they heard about the gym. Use a mix of multiple-choice and one open-ended question, and keep the wording clear and unbiased.',
    questions: [
      'Can you write clear, unbiased survey questions?',
      'Do you understand basic customer-profiling goals?',
      'Can you deliver within 25 minutes?',
    ],
    category: 'Survey',
    payment: 2100,
  },
  {
    title: 'Write a 120-Word Google Business Description for a Law Firm',
    description:
      'Write a professional 120-word Google Business Profile description for a small Nairobi law firm specialising in property, family, and business law. It should build trust and authority, mention the areas of practice, note the firm\'s client-first approach, and end with an invitation to book a consultation.',
    questions: [
      'Can you write authoritative, trust-building business copy?',
      'Are you familiar with professional-services tone?',
      'Can you deliver within 30 minutes?',
    ],
    category: 'Writing',
    payment: 2200,
  },
  {
    title: 'Generate 10 SEO Keyword Ideas for a Plumbing Company',
    description:
      'Research and provide 10 relevant SEO keyword phrases for a Nairobi plumbing company\'s website. Mix high-intent local keywords (e.g., "emergency plumber Nairobi") with service-specific ones (e.g., "water heater installation"). For each keyword, note whether the intent is emergency, informational, or service-booking.',
    questions: [
      'Do you understand keyword intent and local SEO?',
      'Can you identify practical, high-intent keywords?',
      'Can you deliver within 30 minutes?',
    ],
    category: 'Research',
    payment: 2300,
  },
  {
    title: 'Transcribe a 4-Minute Voice Note into Clean Text',
    description:
      'Transcribe a clear 4-minute English voice note (a shop owner describing their weekly stock order) into clean, well-punctuated text. Remove filler words ("um", "eh"), fix false starts, and format it into readable paragraphs while keeping every piece of information accurate.',
    questions: [
      'Can you transcribe audio accurately and cleanly?',
      'Can you lightly edit for readability without losing meaning?',
      'Can you deliver within 35 minutes?',
    ],
    category: 'Transcription',
    payment: 2400,
  },
  {
    title: 'Write a 100-Word Cold Outreach Email to a Sponsor',
    description:
      'Write a persuasive 100-word cold outreach email from a Kenyan youth football tournament to a potential local sponsor (a telecom brand). The email should open with a strong hook, briefly explain the tournament\'s reach and audience, present the sponsorship opportunity, and end with a clear, low-pressure call to action.',
    questions: [
      'Can you write concise, persuasive B2B outreach?',
      'Can you balance confidence with professionalism?',
      'Can you deliver within 30 minutes?',
    ],
    category: 'Marketing',
    payment: 2500,
  },
  {
    title: 'Design a 3-Tier Pricing Table for a Cleaning Service',
    description:
      'Create a clear 3-tier pricing table (Basic, Standard, Premium) for a Nairobi home-cleaning company. For each tier, define a price placeholder, what is included (rooms, frequency, extras like windows/ironing), and who it is best for. Format it so it can be dropped straight onto a website or flyer.',
    questions: [
      'Can you structure clear, comparable pricing tiers?',
      'Do you understand good/better/best packaging?',
      'Can you deliver within 35 minutes?',
    ],
    category: 'Admin',
    payment: 2700,
  },
];

// ── TIER 3 — KSh 2,900–3,800 (Medium — 40 min to 1.5 hrs) ──────────────────
const tier3 = [
  {
    title: 'Write 5 Blog Introductions for a Travel Agency',
    description:
      'Write 5 engaging blog introductions (100 words each) for a Kenyan travel agency. Topics: (1) budget beach holidays in Diani, (2) a first-timer\'s Maasai Mara safari, (3) weekend getaways near Nairobi, (4) solo travel safety tips, (5) packing for the coast. Each intro should hook the reader and tease the value of the full article.',
    questions: [
      'Can you write vivid, hook-driven travel copy?',
      'Are you familiar with Kenyan travel destinations?',
      'Can you deliver all five within 1 hour?',
    ],
    category: 'Writing',
    payment: 2900,
  },
  {
    title: 'Research 5 Reliable Solar-Panel Suppliers in East Africa',
    description:
      'Research and compile 5 reputable solar-panel/solar-kit suppliers operating in East Africa. For each supplier provide: name, country/base, product focus (home kits, commercial, water pumping), price range if available, and one distinguishing strength. Present the findings as a clean comparison list. Only include currently operational suppliers.',
    questions: [
      'Can you research and verify supplier information?',
      'Can you present findings in a structured, comparable format?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Research',
    payment: 3100,
  },
  {
    title: 'Create a 10-Day Instagram Reels Script Plan for a Beauty Brand',
    description:
      'Build a 10-day Instagram Reels plan for a Kenyan natural-skincare brand. For each day provide: the Reel concept, a 3-line script/voiceover, an on-screen text hook for the first 2 seconds, and a suggested trending-audio type. Balance product demos, tips/education, and behind-the-scenes content.',
    questions: [
      'Are you familiar with Reels formats and hooks?',
      'Can you write short, scroll-stopping scripts?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Marketing',
    payment: 3300,
  },
  {
    title: 'Write a 300-Word Case Study for a Logistics Company',
    description:
      'Write a 300-word customer success case study for a Nairobi logistics company that helped a retail client cut delivery times by 40%. Use the classic structure: the client\'s challenge, the solution provided, and the measurable results. Keep it credible and professional, with a short pull-quote from the (fictional) client.',
    questions: [
      'Can you write structured, results-focused case studies?',
      'Can you make business outcomes sound credible and clear?',
      'Can you deliver within 1 hour?',
    ],
    category: 'Writing',
    payment: 3500,
  },
  {
    title: 'Build a 12-Question Customer Satisfaction Survey for a Bank',
    description:
      'Design a 12-question customer satisfaction (CSAT) survey for a Kenyan bank\'s mobile app. Cover ease of use, transaction speed, reliability, support quality, security confidence, and likelihood to recommend (NPS). Use a mix of 1–5 rating scales and 2 open-ended questions. Keep questions neutral and non-leading.',
    questions: [
      'Can you design balanced, professional survey instruments?',
      'Are you familiar with CSAT and NPS measurement?',
      'Can you deliver within 1 hour?',
    ],
    category: 'Survey',
    payment: 3600,
  },
  {
    title: 'Transcribe and Summarize a 10-Minute Podcast Episode',
    description:
      'Transcribe a 10-minute English business podcast segment into clean text, then write a 120-word summary capturing the 3 key takeaways. The transcript should be well-punctuated and readable; the summary should stand alone as a newsletter snippet. Accuracy of facts and figures is essential.',
    questions: [
      'Can you transcribe and summarize long audio accurately?',
      'Can you extract the key points clearly?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Transcription',
    payment: 3800,
  },
];

// ── TIER 4 — KSh 3,900–4,600 (Medium-Hard — 1.5 to 2.5 hrs) ─────────────────
const tier4 = [
  {
    title: 'Write a 600-Word Whitepaper Introduction on Renewable Energy in Africa',
    description:
      'Write a compelling 600-word introduction section for a whitepaper titled "Powering Africa\'s Future: The Renewable Energy Opportunity." Cover the energy-access gap, the falling cost of solar, the role of mini-grids and mobile payments, and why now is the tipping point. Tone: authoritative, data-aware, and forward-looking, suitable for investors and policymakers.',
    questions: [
      'Can you write authoritative, well-structured long-form content?',
      'Are you familiar with the African energy landscape?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Writing',
    payment: 3900,
  },
  {
    title: 'Create a 10-Email Nurture Sequence Outline for an Online Course',
    description:
      'Outline a 10-email nurture sequence for a Kenyan online course teaching digital skills. For each email provide: the goal, subject line, preview text, the core message (2–3 sentences), and the CTA. The sequence should move a subscriber from a free lead magnet to purchasing the paid course, using education, social proof, and urgency along the way.',
    questions: [
      'Can you design conversion-focused email sequences?',
      'Are you familiar with lead-nurturing and funnel strategy?',
      'Can you deliver within 2.5 hours?',
    ],
    category: 'Marketing',
    payment: 4100,
  },
  {
    title: 'Research and Compare 4 Project-Management Tools for SMEs',
    description:
      'Research and write a 500-word comparison of 4 popular project-management tools (e.g., Trello, Asana, ClickUp, Notion) for small businesses. Compare them on: ease of use, free-plan limits, collaboration features, mobile experience, and pricing. Conclude with a clear recommendation for a 5-person Kenyan startup on a tight budget.',
    questions: [
      'Can you research and objectively compare software tools?',
      'Can you write clear recommendations for non-technical readers?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Research',
    payment: 4300,
  },
  {
    title: 'Write a 500-Word Grant Application Narrative for an NGO',
    description:
      'Write a persuasive 500-word grant application narrative for a Kenyan NGO seeking funding for a girls\' STEM mentorship programme. Cover the problem and evidence of need, the proposed solution and activities, the expected impact and how it will be measured, and a short statement on the organisation\'s capacity to deliver. Tone: sincere, evidence-based, and compelling.',
    questions: [
      'Can you write persuasive, evidence-based grant narratives?',
      'Are you familiar with the structure of funding proposals?',
      'Can you deliver within 2.5 hours?',
    ],
    category: 'Writing',
    payment: 4500,
  },
];

// ── INTERNATIONAL — Broader markets (KSh 4,200–6,300) ──────────────────────
// These carry their own poster names and city locations.
const internationalTasks = [
  {
    title: 'Write a 500-Word Guide: Opening a Business Bank Account in Nigeria',
    description:
      'Write a clear 500-word step-by-step guide for a first-time entrepreneur on opening a business bank account in Nigeria. Cover the documents required (CAC registration, TIN, utility bill, IDs), choosing between commercial and microfinance banks, typical timelines, and 3 common mistakes to avoid. Write for a non-expert audience in plain, encouraging language.',
    questions: [
      'Are you familiar with business banking basics in Nigeria?',
      'Can you write clear, step-by-step how-to guides?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Research',
    payment: 4200,
    poster:   'Chinedu Okafor',
    location: 'Lagos, Nigeria',
  },
  {
    title: 'Draft a 400-Word LinkedIn Article on Fintech Growth in Ghana',
    description:
      'Write a 400-word LinkedIn thought-leadership article on the rapid growth of fintech and mobile money in Ghana. Open with a striking statistic or statement, cover 2–3 drivers of adoption, acknowledge one challenge (regulation, trust, or infrastructure), and close with a forward-looking note that invites discussion. Voice: professional and optimistic.',
    questions: [
      'Are you familiar with the West African fintech landscape?',
      'Can you write in a confident, executive LinkedIn voice?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Writing',
    payment: 4600,
    poster:   'Ama Mensah',
    location: 'Accra, Ghana',
  },
  {
    title: 'Write a 600-Word Explainer on UK Self-Assessment Tax for Freelancers',
    description:
      'Write a clear 600-word explainer helping UK-based freelancers understand Self-Assessment tax. Cover who must register, key deadlines (31 January), what counts as allowable expenses, how National Insurance fits in, and 4 practical tips to avoid penalties. Keep it accurate, plain-English, and reassuring for someone filing for the first time.',
    questions: [
      'Are you familiar with UK Self-Assessment tax basics?',
      'Can you explain financial/tax topics in plain English?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Education',
    payment: 5200,
    poster:   'Oliver Bennett',
    location: 'London, United Kingdom',
  },
  {
    title: 'Write a 500-Word Cultural Guide to Nigerian Nollywood Cinema',
    description:
      'Write a 500-word cultural guide introducing Nollywood — Nigeria\'s film industry — to an international audience. Cover its origins in the 1990s, its scale and global reach, signature genres and storytelling styles, standout modern films and streaming\'s impact, and its role in shaping African identity abroad. Tone: informative and engaging for a culture magazine.',
    questions: [
      'Are you knowledgeable about Nollywood and Nigerian cinema?',
      'Can you write engaging, well-structured cultural articles?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Writing',
    payment: 5600,
    poster:   'Tunde Adeyemi',
    location: 'Abuja, Nigeria',
  },
  {
    title: 'Write a 500-Word Feature on Jamaican Dancehall\'s Global Influence',
    description:
      'Write a 500-word feature on how Jamaican dancehall music has shaped global pop culture. Cover its roots in 1980s Kingston, key artists and riddims, its influence on hip-hop, Afrobeats, and mainstream pop, and dance culture\'s worldwide spread. Conclude with a reflection on dancehall as a vehicle of Jamaican identity. Tone: vivid and culturally accurate.',
    questions: [
      'Are you knowledgeable about Jamaican dancehall and its global reach?',
      'Can you write rich, culturally accurate music writing?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Writing',
    payment: 6000,
    poster:   'Andre Campbell',
    location: 'Kingston, Jamaica',
  },
  {
    title: 'Research 6 Remote-Work Job Boards Popular in the Caribbean',
    description:
      'Research and compile 6 reputable remote-work job boards or platforms that Caribbean-based freelancers use to find international clients. For each, provide: name, focus (design, writing, dev, virtual assistance, general), how payments are received in the region, any fees, and one tip for standing out. Only include currently active platforms; present as a clean list.',
    questions: [
      'Can you research and verify online work platforms?',
      'Are you familiar with the remote-work landscape for the Caribbean?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Research',
    payment: 6300,
    poster:   'Shanice Brown',
    location: 'Montego Bay, Jamaica',
  },
];

// ── Build final TASKS array ──────────────────────────────────────────────────
let idCounter = 1;

const allTemplates = [...tier1, ...tier2, ...tier3, ...tier4, ...internationalTasks];

export const TASKS = allTemplates.map(t => ({
  id: idCounter++,
  ...t,
  poster:     t.poster   ?? randomItem(posters),
  location:   t.location ?? randomItem(locations),
  datePosted: recentDate(Math.floor(Math.random() * 7)),
}));
