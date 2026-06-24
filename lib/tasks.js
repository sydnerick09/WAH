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
    title: 'Write 5 WhatsApp Business Status Captions',
    description:
      'Create 5 short, engaging WhatsApp status captions (max 30 words each) for a Nairobi-based women\'s boutique. Each caption should promote the shop\'s latest arrivals, feel friendly and conversational, and include a call to action like "DM us to order" or "Visit us today."',
    questions: [
      'Can you write short, catchy social media captions?',
      'Are you familiar with a casual, friendly tone for fashion businesses?',
      'Can you deliver within 30 minutes?',
    ],
    category: 'Writing',
    payment: 1200,
  },
  {
    title: 'Generate 10 Instagram Hashtags for a Food Business',
    description:
      'Research and provide 10 relevant, high-reach Instagram hashtags for a Nairobi-based home-cooked meals delivery business. Mix broad hashtags (e.g., #KenyanFood) with niche ones (e.g., #NairobiLunchDelivery). Briefly explain why each hashtag is a good fit.',
    questions: [
      'Can you identify hashtags that are popular and relevant for food businesses in Kenya?',
      'Can you balance broad and niche hashtags?',
      'Can you deliver within 20 minutes?',
    ],
    category: 'Marketing',
    payment: 1200,
  },
  {
    title: 'Translate 5 Customer Greeting Messages to Swahili',
    description:
      'Translate the following 5 short customer greeting messages from English into natural, conversational Swahili. The messages are used on a retail shop\'s WhatsApp line. Translations should sound warm and welcoming, not robotic — match the friendly tone of the originals.',
    questions: [
      'Are you fluent in both English and Swahili?',
      'Can you produce conversational (not literal) translations?',
      'Can you complete all five within 30 minutes?',
    ],
    category: 'Translation',
    payment: 1300,
  },
  {
    title: 'Write a 50-Word Product Review for a Phone Case',
    description:
      'Write one short, honest-sounding product review (50 words max) for a clear silicone phone case sold on an online store. The review should mention: good fit, drop protection, clear look, and value for money. It should sound like a real customer, not an ad.',
    questions: [
      'Can you write in an authentic, consumer review style?',
      'Can you keep it under 50 words without losing key points?',
      'Can you submit within 15 minutes?',
    ],
    category: 'Writing',
    payment: 1300,
  },
  {
    title: 'Create 5 Product Name Ideas for a Herbal Soap Brand',
    description:
      'Suggest 5 creative, memorable product names for a new line of Kenyan-made herbal soaps using natural ingredients like shea butter, aloe vera, and turmeric. Each name should be easy to pronounce, feel premium, and work on packaging. Include a one-line reason for each suggestion.',
    questions: [
      'Can you brainstorm creative brand names?',
      'Do you understand what makes a product name marketable?',
      'Can you deliver within 20 minutes?',
    ],
    category: 'Marketing',
    payment: 1400,
  },
  {
    title: 'Rewrite 3 Sentences in Simpler, Clearer English',
    description:
      'Rewrite the 3 provided sentences so they are easier to read and understand for someone with a basic education. Avoid jargon, shorten long sentences, and use common words. Do not change the meaning — only simplify the language and improve clarity.',
    questions: [
      'Can you simplify written content without losing meaning?',
      'Are you comfortable editing for plain-language clarity?',
      'Can you submit within 15 minutes?',
    ],
    category: 'Writing',
    payment: 1400,
  },
  {
    title: 'Write a Welcome Message for a New WhatsApp Group',
    description:
      'Write a warm, professional 60-word welcome message for the launch of a new WhatsApp group for a savings chama (group) of 20 Kenyan women. The message should introduce the group\'s purpose (saving together, supporting each other), set a positive tone, and invite members to introduce themselves.',
    questions: [
      'Can you write in a warm, community-oriented tone?',
      'Are you familiar with the concept of Kenyan chamas?',
      'Can you complete this within 20 minutes?',
    ],
    category: 'Writing',
    payment: 1500,
  },
  {
    title: 'Write a Short Out-of-Office Email Reply Template',
    description:
      'Create a professional but friendly out-of-office auto-reply email template for a freelance graphic designer who will be unavailable for one week. The template should mention the return date, offer an emergency contact option, and thank the sender for reaching out.',
    questions: [
      'Can you write professional business email templates?',
      'Can you keep the tone warm but professional?',
      'Can you deliver within 15 minutes?',
    ],
    category: 'Admin',
    payment: 1500,
  },
  {
    title: 'Write an Apology Message for a Late Delivery',
    description:
      'Write a 3-sentence apology message a Nairobi online shop can send to a customer whose order arrived 3 days late. The message should: sincerely apologize, briefly explain it was an unforeseen logistics issue, and offer a 10% discount on their next order as goodwill.',
    questions: [
      'Can you write empathetic, customer-focused messages?',
      'Can you keep it brief and professional?',
      'Can you deliver within 15 minutes?',
    ],
    category: 'Writing',
    payment: 1600,
  },
  {
    title: 'Suggest 5 TikTok Content Ideas for a Motivational Page',
    description:
      'Suggest 5 short TikTok video ideas for a Kenyan youth motivational page. Each idea should include: a title (e.g., "Things nobody tells you about starting a business"), the hook for the first 3 seconds, and the key message. Ideas should be original, relatable, and encourage comments or shares.',
    questions: [
      'Are you familiar with viral TikTok content formats?',
      'Can you tailor ideas to a Kenyan youth audience?',
      'Can you deliver within 30 minutes?',
    ],
    category: 'Marketing',
    payment: 1600,
  },
  {
    title: 'Translate a Product Label from English to Swahili',
    description:
      'Translate a simple cosmetics product label (ingredients list, usage directions, and warning text — approximately 60 words total) from English into Swahili. The translation must be accurate and natural. Use standard Swahili vocabulary, not overly technical terms that consumers may not understand.',
    questions: [
      'Are you fluent in Swahili with good writing skills?',
      'Can you translate product/technical text accurately?',
      'Can you deliver within 25 minutes?',
    ],
    category: 'Translation',
    payment: 1600,
  },
  {
    title: 'Create a 5-Question Customer Feedback Form',
    description:
      'Design a simple 5-question customer feedback form for a Nairobi barbershop. Questions should cover: overall experience, staff friendliness, waiting time, value for money, and likelihood to recommend. Use a mix of rating scales (1–5) and one open-ended question. Format it clearly.',
    questions: [
      'Can you write clear, unbiased survey questions?',
      'Are you familiar with customer satisfaction measurement?',
      'Can you complete the form within 20 minutes?',
    ],
    category: 'Survey',
    payment: 1700,
  },
  {
    title: 'Write an SMS Marketing Message for a Clothes Sale',
    description:
      'Write a 50-word SMS marketing message for a Nairobi clothing shop announcing a 30% off sale this weekend. The message must include: the discount amount, store name (Business Hub Boutique), sale dates (Saturday–Sunday), and a call to action. It must fit within a standard SMS character limit (160 characters).',
    questions: [
      'Can you write punchy, action-driving SMS marketing copy?',
      'Can you keep to under 160 characters?',
      'Can you deliver within 15 minutes?',
    ],
    category: 'Marketing',
    payment: 1700,
  },
  {
    title: 'Write 3 Call-to-Action (CTA) Phrases for a Website Button',
    description:
      'Write 3 different CTA button phrases for the homepage of a Kenyan online tutoring platform. Each phrase should be short (2–5 words), action-oriented, and create urgency or excitement. Avoid clichés like "Click Here." Suggest one phrase each for three different audience emotions: curiosity, urgency, and confidence.',
    questions: [
      'Do you understand conversion-focused copywriting?',
      'Can you write creative, non-generic CTAs?',
      'Can you deliver within 20 minutes?',
    ],
    category: 'Marketing',
    payment: 1800,
  },
  {
    title: 'Write a Simple Thank-You Reply Email to a Customer',
    description:
      'Write a warm, professional thank-you email reply a small Nairobi bakery can send to a customer who left a positive Google review. The email should: thank them by name (use "[Customer Name]"), acknowledge what they said, invite them back, and offer a small loyalty discount code.',
    questions: [
      'Can you write genuine, warm customer relationship emails?',
      'Are you familiar with customer retention strategies?',
      'Can you deliver within 20 minutes?',
    ],
    category: 'Admin',
    payment: 1800,
  },
];

// ── TIER 2 — KSh 1,900–2,800 (Easy — 15 to 40 min) ─────────────────────────
const tier2 = [
  {
    title: 'Write 3 Facebook Ad Headlines for a Nairobi Salon',
    description:
      'Write 3 compelling Facebook ad headlines for a Nairobi hair salon promoting a "Hair Makeover Package." Each headline should be different in approach: one benefit-focused, one curiosity-driven, and one urgency-based. Keep each headline under 10 words and make it scroll-stopping.',
    questions: [
      'Can you write attention-grabbing ad copy?',
      'Do you understand how Facebook ad headlines work?',
      'Can you deliver 3 options within 30 minutes?',
    ],
    category: 'Marketing',
    payment: 1900,
  },
  {
    title: 'Summarize a 300-Word News Article in 80 Words',
    description:
      'Read the provided 300-word Kenyan news article and write an accurate 80-word summary. The summary must cover: the main event or announcement, the key people or organizations involved, and the significance or outcome. Write in plain, neutral language suitable for a news digest newsletter.',
    questions: [
      'Can you summarize news accurately without adding opinion?',
      'Can you hit an 80-word limit while keeping all key information?',
      'Can you deliver within 25 minutes?',
    ],
    category: 'Research',
    payment: 1900,
  },
  {
    title: 'Write a 5-Item FAQ for a Delivery Service App',
    description:
      'Write a clear, simple 5-question FAQ for a Kenyan parcel delivery app. Cover these questions: (1) How do I track my package? (2) What happens if I miss my delivery? (3) Which areas do you deliver to? (4) How do I pay? (5) What is the delivery fee? Answers should be under 40 words each.',
    questions: [
      'Can you write clear, helpful FAQ answers?',
      'Are you familiar with how delivery apps work?',
      'Can you complete within 30 minutes?',
    ],
    category: 'Admin',
    payment: 2000,
  },
  {
    title: 'Write a 100-Word Motivational Post for a Youth Page',
    description:
      'Write a 100-word motivational post for a Kenyan youth empowerment Facebook page. The post should: open with a powerful statement that grabs attention, include a relatable real-life scenario (e.g., struggling to find a job), give an encouraging message, and end with an action prompt or question to drive comments.',
    questions: [
      'Can you write engaging, authentic motivational content?',
      'Can you relate to the challenges Kenyan youth face?',
      'Can you deliver within 30 minutes?',
    ],
    category: 'Writing',
    payment: 2000,
  },
  {
    title: 'Translate a 50-Word Product Description to Swahili',
    description:
      'Translate the provided 50-word English product description for a Kenyan hair growth serum into Swahili. The translation should be natural and appealing — not a word-for-word literal translation. Maintain the promotional tone and ensure the key benefits (fast growth, natural ingredients, no side effects) come through clearly.',
    questions: [
      'Can you write persuasive promotional content in Swahili?',
      'Can you match the tone and intent of the original text?',
      'Can you deliver within 25 minutes?',
    ],
    category: 'Translation',
    payment: 2100,
  },
  {
    title: 'Write 5 Professional Responses to 1-Star Customer Reviews',
    description:
      'Write 5 professional, empathetic responses that a restaurant manager can post publicly in reply to 1-star Google reviews. Each response should: acknowledge the complaint, apologize sincerely, take responsibility, and invite the customer to return. Do not be defensive. Vary the wording for each response — do not use the same template.',
    questions: [
      'Can you write empathetic, de-escalating customer service replies?',
      'Can you vary tone and wording across 5 responses?',
      'Can you deliver within 40 minutes?',
    ],
    category: 'Writing',
    payment: 2100,
  },
  {
    title: 'Generate 5 LinkedIn Post Ideas for a Career Coach',
    description:
      'Suggest 5 LinkedIn post ideas for a Kenyan career coach targeting job seekers aged 22–35. For each idea, provide: the post title/topic, the type of content (story, list, question, etc.), the key message, and one hook sentence to open the post. Ideas should be original and encourage engagement.',
    questions: [
      'Are you familiar with LinkedIn content strategy?',
      'Can you tailor ideas to a Kenyan professional audience?',
      'Can you deliver within 35 minutes?',
    ],
    category: 'Marketing',
    payment: 2100,
  },
  {
    title: 'Write an 80-Word Return Policy for an Online Shop',
    description:
      'Write a clear, customer-friendly 80-word return policy statement for a Kenyan online fashion shop. Cover: the return window (7 days), condition of items (unworn, tags attached), how to initiate a return (WhatsApp message with photo), and the resolution options (exchange or store credit). Use simple, easy-to-understand language.',
    questions: [
      'Can you write clear business policy statements?',
      'Are you familiar with standard e-commerce return policies?',
      'Can you keep to under 80 words?',
    ],
    category: 'Admin',
    payment: 2200,
  },
  {
    title: 'Generate 10 Blog Post Title Ideas for a Personal Finance Blog',
    description:
      'Generate 10 compelling, click-worthy blog post titles for a Kenyan personal finance blog targeting young adults (18–30). Titles should cover topics like saving, investing, side hustles, budgeting, and M-PESA money management. Mix question-based, list-based, and how-to formats. Each title should be specific and relatable to Kenyans.',
    questions: [
      'Can you generate SEO-friendly, clickable blog titles?',
      'Are you familiar with personal finance topics relevant to young Kenyans?',
      'Can you deliver within 25 minutes?',
    ],
    category: 'Research',
    payment: 2200,
  },
  {
    title: 'Write a 100-Word Product Description for an Organic Juice',
    description:
      'Write a compelling 100-word product description for "Mama\'s Fresh" — a locally made Kenyan cold-pressed juice blend of watermelon, ginger, and lemon. The description should: highlight natural, no-preservatives ingredients; mention health benefits (energy boost, digestion, hydration); appeal to health-conscious urban consumers; and end with a purchase call-to-action.',
    questions: [
      'Can you write persuasive product descriptions for health/food products?',
      'Can you target urban health-conscious consumers?',
      'Can you deliver within 30 minutes?',
    ],
    category: 'Writing',
    payment: 2200,
  },
  {
    title: 'Write a Professional Bio for a Business Consultant',
    description:
      'Write a 100-word professional bio for a Kenyan business consultant who specializes in helping SMEs with financial planning and digital transformation. Use a confident, third-person voice. Include: years of experience (10 years), key expertise areas, notable achievement (helped 200+ businesses), and a closing line about their passion for helping entrepreneurs grow.',
    questions: [
      'Can you write professional third-person bios?',
      'Can you capture a confident, expert tone without sounding arrogant?',
      'Can you deliver within 25 minutes?',
    ],
    category: 'Writing',
    payment: 2400,
  },
  {
    title: 'Write a 100-Word Homepage Introduction for a Business Website',
    description:
      'Write a 100-word homepage introduction paragraph for a Nairobi-based IT support company called "TechFix Kenya." It should: clearly explain what the business does (computer repairs, software installation, network setup), who they serve (homes and small businesses), why they\'re different (fast response, affordable, honest), and end with a CTA ("Get a free quote today").',
    questions: [
      'Can you write concise, conversion-focused website copy?',
      'Are you familiar with the IT services market in Kenya?',
      'Can you deliver within 30 minutes?',
    ],
    category: 'Writing',
    payment: 2500,
  },
  {
    title: 'Create a Weekly Social Media Posting Schedule',
    description:
      'Create a clear 1-week social media posting schedule for a Nairobi restaurant active on Facebook, Instagram, TikTok, WhatsApp Status, and Twitter/X. For each platform, specify: how many times to post per day, the best posting times (based on general social media best practices), and the type of content recommended (e.g., food video, customer review, behind-the-scenes).',
    questions: [
      'Are you familiar with social media best practices for food businesses?',
      'Can you tailor posting schedules to a Kenyan audience and time zone?',
      'Can you deliver within 35 minutes?',
    ],
    category: 'Marketing',
    payment: 2500,
  },
  {
    title: 'Write 3 Persuasive WhatsApp Sales Messages for a Real Estate Agency',
    description:
      'Write 3 different persuasive WhatsApp messages a real estate agency can send to potential buyers for a 2-bedroom apartment in Kilimani, Nairobi, priced at KSh 8.5M. Each message should use a different angle: (1) investment value, (2) lifestyle appeal, (3) urgency/scarcity. Keep each under 80 words.',
    questions: [
      'Can you write persuasive real estate sales copy?',
      'Are you familiar with what motivates property buyers in Nairobi?',
      'Can you vary angle and tone across the 3 messages?',
    ],
    category: 'Marketing',
    payment: 2600,
  },
  {
    title: 'Summarize a 500-Word Blog Post into 3 Bullet Points',
    description:
      'Read the provided 500-word blog post on mobile internet safety tips for Kenyan smartphone users and extract the 3 most important, actionable points. Present each as a clear, complete bullet point (1–2 sentences). The summary should be usable as a social media caption or newsletter snippet without reading the full article.',
    questions: [
      'Can you identify and distill key information from long-form content?',
      'Can you write punchy, standalone bullet-point summaries?',
      'Can you deliver within 20 minutes?',
    ],
    category: 'Research',
    payment: 2600,
  },
  {
    title: 'Translate a 100-Word Business Email from English to Swahili',
    description:
      'Translate the provided 100-word formal business email (a meeting request from a supplier) from English into formal, professional Swahili. The translation must be grammatically correct, use appropriate business Swahili vocabulary, and maintain the formal, respectful tone of the original. Avoid casual or colloquial Swahili.',
    questions: [
      'Can you write formal business Swahili?',
      'Are you comfortable with professional email correspondence in Swahili?',
      'Can you deliver within 35 minutes?',
    ],
    category: 'Translation',
    payment: 2800,
  },
  {
    title: 'Write a 150-Word "About Us" for a Nairobi Bakery',
    description:
      'Write a 150-word "About Us" section for "Sweetie\'s Bakery" — a small home-based Nairobi bakery known for custom celebration cakes, mandazi, and chapati. The copy should: tell a brief origin story, highlight the founder\'s passion for baking, mention the use of fresh local ingredients, and invite customers to order via WhatsApp.',
    questions: [
      'Can you write warm, brand-story content for small businesses?',
      'Can you capture a homemade, community feel in professional copy?',
      'Can you deliver within 35 minutes?',
    ],
    category: 'Writing',
    payment: 2800,
  },
];

// ── TIER 3 — KSh 2,900–3,800 (Medium — 40 min to 1.5 hrs) ──────────────────
const tier3 = [
  {
    title: 'Write 5 Product Descriptions for a Skincare Line',
    description:
      'Write 5 product descriptions (80–100 words each) for a Kenyan natural skincare brand called "Glow Naturals." Products are: (1) Shea Butter Face Cream, (2) Turmeric Face Mask, (3) Aloe Vera Toner, (4) Rosehip Body Oil, (5) Charcoal Soap Bar. Each description must highlight key ingredients, main skin benefits, skin type suitability, and a short CTA. Tone: warm, science-backed but accessible.',
    questions: [
      'Can you write compelling, benefit-driven product descriptions?',
      'Are you familiar with skincare ingredient benefits and terminology?',
      'Can you deliver all five within 1 hour?',
    ],
    category: 'Writing',
    payment: 2900,
  },
  {
    title: 'Create a 7-Day Healthy Meal Plan',
    description:
      'Create a simple 7-day healthy meal plan for a budget-conscious Kenyan adult trying to eat better without spending more than KSh 500/day on food. For each day, list breakfast, lunch, and dinner. Use locally available, affordable ingredients (e.g., sukuma wiki, beans, eggs, ugali, sweet potatoes). Add a brief note on the key nutritional benefit of each day\'s meals.',
    questions: [
      'Can you create practical meal plans using locally available Kenyan foods?',
      'Are you familiar with basic nutrition principles?',
      'Can you keep all meals within a KSh 500/day budget?',
    ],
    category: 'Admin',
    payment: 2900,
  },
  {
    title: 'Write a 200-Word Savings Tips Blog Intro for Kenyan Youth',
    description:
      'Write a 200-word introductory paragraph for a blog post titled "10 Realistic Saving Tips for Young Kenyans in 2025." The intro should: open with a relatable scenario (e.g., payday running out before month-end), acknowledge the real financial pressure young Kenyans face, briefly tease the 10 tips, and hook the reader into reading more. Tone: conversational, empathetic, and motivating.',
    questions: [
      'Can you write engaging, relatable personal finance content for Kenyan youth?',
      'Can you write a hook that makes readers want to continue?',
      'Can you deliver within 40 minutes?',
    ],
    category: 'Writing',
    payment: 3000,
  },
  {
    title: 'Research the Top 5 Affordable Co-Working Spaces in Nairobi',
    description:
      'Research and compile a list of the top 5 affordable co-working spaces in Nairobi. For each space, provide: name, location (area/estate), daily/monthly pricing, key amenities (Wi-Fi speed, printing, meeting rooms), and one unique selling point. Format the output as a clean, readable comparison table or structured list. Use only spaces that are currently operational.',
    questions: [
      'Can you research and verify business information for Nairobi co-working spaces?',
      'Can you present findings in a clean, structured format?',
      'Can you deliver within 1 hour?',
    ],
    category: 'Research',
    payment: 3000,
  },
  {
    title: 'Create a 2-Week Social Media Content Calendar',
    description:
      'Create a 14-day social media content calendar for a Kenyan online shoe store. For each of the 14 days, provide: the platform (rotate between Instagram, Facebook, WhatsApp Status, TikTok), post topic/theme, a ready-to-use caption (under 50 words), and 3–5 hashtags. Mix promotional posts (40%), engagement posts (40%), and educational/tips posts (20%).',
    questions: [
      'Can you build structured content calendars with ready-to-publish captions?',
      'Are you familiar with social media strategy for e-commerce businesses?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Marketing',
    payment: 3100,
  },
  {
    title: 'Write 10 Interview Preparation Tips for Fresh Graduates',
    description:
      'Write a list of 10 practical, actionable interview preparation tips specifically for recent Kenyan university graduates entering the job market for the first time. Each tip should be a short heading followed by 2–3 sentences of explanation. Cover areas like: researching the company, dressing appropriately, common interview questions, how to handle salary questions, and follow-up etiquette.',
    questions: [
      'Can you write practical, relatable career advice for new graduates?',
      'Are you familiar with what Kenyan employers look for in entry-level candidates?',
      'Can you deliver within 45 minutes?',
    ],
    category: 'Education',
    payment: 3200,
  },
  {
    title: 'Write a 200-Word Investor Pitch for a Mobile Money Startup',
    description:
      'Write a compelling 200-word investor pitch paragraph for "PayQuick" — a Kenyan mobile money startup that allows unbanked users to save, borrow, and pay bills using only a basic phone (no smartphone required). The pitch should: state the problem clearly, present the solution, mention the target market size, highlight the unique advantage over existing apps, and end with a funding ask of KSh 5M seed capital.',
    questions: [
      'Can you write persuasive business pitch copy?',
      'Are you familiar with the mobile money ecosystem in Kenya?',
      'Can you deliver within 45 minutes?',
    ],
    category: 'Writing',
    payment: 3200,
  },
  {
    title: 'Translate a 200-Word Customer Service Policy to Swahili',
    description:
      'Translate the provided 200-word customer service policy document from English into clear, professional Swahili. The document covers refund timelines, complaint handling steps, and customer rights. The Swahili version should be grammatically correct, easy to understand for an average customer, and maintain the authoritative but respectful tone of the original.',
    questions: [
      'Can you translate formal business policy documents into professional Swahili?',
      'Are you able to balance formal tone with clarity in Swahili?',
      'Can you deliver within 1 hour?',
    ],
    category: 'Translation',
    payment: 3300,
  },
  {
    title: 'Write a 250-Word Smartphone Comparison Article',
    description:
      'Write a 250-word comparison article for two popular budget smartphones available in Kenya: the Tecno Spark 20 and the Samsung Galaxy A05. Compare them on: display quality, camera performance, battery life, storage and RAM, and price in Kenya. End with a clear recommendation of which phone is better value and for whom. Write for a general, non-technical Kenyan audience.',
    questions: [
      'Can you write clear, non-technical product comparison articles?',
      'Are you familiar with the Kenyan smartphone market and these devices?',
      'Can you deliver within 50 minutes?',
    ],
    category: 'Research',
    payment: 3300,
  },
  {
    title: 'Write a Detailed FAQ Section (15 Questions) for a Delivery App',
    description:
      'Write a comprehensive FAQ section with 15 questions and answers for a Kenyan last-mile delivery app called "Peleka." Topics must include: how to place an order, delivery areas, pricing, package size limits, real-time tracking, payment methods, damaged packages, cancellations, driver tipping, and business account options. Each answer must be clear, complete, and under 60 words.',
    questions: [
      'Can you write comprehensive and accurate FAQ content?',
      'Are you familiar with how last-mile delivery apps work in Kenya?',
      'Can you deliver 15 Q&As within 1.5 hours?',
    ],
    category: 'Admin',
    payment: 3400,
  },
  {
    title: 'Create a How-To Guide: Setting Up an M-PESA Paybill',
    description:
      'Write a clear, step-by-step 10-step guide on how a small business owner can set up an M-PESA Paybill account in Kenya. Each step should be brief (1–2 sentences), easy to follow for someone with no banking background, and include any important tips or common mistakes to avoid. Also include a short intro paragraph explaining what a Paybill is and why businesses need one.',
    questions: [
      'Can you write simple, accurate how-to guides for non-technical users?',
      'Are you familiar with M-PESA Paybill setup requirements?',
      'Can you deliver within 1 hour?',
    ],
    category: 'Education',
    payment: 3500,
  },
  {
    title: 'Write a 300-Word "Why Choose Us" Section for a Cleaning Company',
    description:
      'Write a persuasive 300-word "Why Choose Us" website section for "SparkClean Kenya" — a professional cleaning company serving homes and offices in Nairobi. Cover: trained and vetted cleaners, eco-friendly products, flexible scheduling, competitive pricing, satisfaction guarantee, and 5-star reviews. The tone should be confident and reassuring, speaking directly to a homeowner\'s concerns about letting strangers into their home.',
    questions: [
      'Can you write trust-building, persuasive marketing copy?',
      'Can you address consumer concerns naturally and confidently?',
      'Can you deliver within 50 minutes?',
    ],
    category: 'Writing',
    payment: 3500,
  },
  {
    title: 'Write a Complete Job Posting for a Data Entry Clerk',
    description:
      'Write a complete, professional job posting for a Data Entry Clerk position at a Nairobi-based logistics company. Include all standard sections: job title, company overview (2 sentences), role summary, key responsibilities (6 bullet points), required qualifications, preferred skills, salary range (KSh 25,000–35,000), working hours, and application instructions. Use professional HR language and ensure the ad would attract qualified candidates.',
    questions: [
      'Can you write complete, professional job advertisements?',
      'Are you familiar with HR writing and standard job posting formats?',
      'Can you deliver within 1 hour?',
    ],
    category: 'Admin',
    payment: 3600,
  },
  {
    title: 'Write a 300-Word LinkedIn Thought Leadership Article',
    description:
      'Write a 300-word thought leadership LinkedIn article titled "Why Digital Payments Are Changing Business in Kenya" for a Nairobi-based fintech entrepreneur. The article should: open with a surprising statistic or bold statement, discuss 2–3 key changes digital payments have enabled for Kenyan SMEs, acknowledge a current challenge, and close with an optimistic forward-looking statement or question to drive comments.',
    questions: [
      'Can you write authoritative, professional LinkedIn articles?',
      'Are you familiar with the digital payments landscape in Kenya?',
      'Can you write in a confident, executive voice?',
    ],
    category: 'Writing',
    payment: 3700,
  },
  {
    title: 'Research 5 Government Grants for Kenyan Small Businesses',
    description:
      'Research and summarize 5 government grants or funding programmes currently available to small businesses and entrepreneurs in Kenya. For each programme, provide: programme name, administering body, target beneficiaries, maximum funding amount, eligibility requirements, and the application process or link. Information must be current and verified — not outdated or speculative.',
    questions: [
      'Can you research and verify government funding programmes in Kenya?',
      'Can you present funding information in a clear, actionable format?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Research',
    payment: 3800,
  },
];

// ── TIER 4 — KSh 3,900–4,600 (Medium-Hard — 1.5 to 2.5 hrs) ─────────────────
const tier4 = [
  {
    title: 'Write a 500-Word Blog Post on Growing a Business with Social Media',
    description:
      'Write a complete, engaging 500-word blog post titled "5 Ways to Grow Your Small Business Using Social Media in Kenya." The post should include: a compelling intro, 5 clearly structured tips (each with a sub-heading and 2–3 sentences of explanation), real Kenyan examples where relevant (e.g., Instagram shops, WhatsApp Business), and a closing call to action. Tone: practical, encouraging, and written for non-technical small business owners.',
    questions: [
      'Can you write long-form, SEO-friendly blog content for Kenyan SMEs?',
      'Are you familiar with social media marketing for small businesses?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Writing',
    payment: 3900,
  },
  {
    title: 'Create a Complete 30-Day Social Media Content Plan',
    description:
      'Build a full 30-day social media content plan for a Kenyan clothing brand selling ankara print fashion online. For each of the 30 days, provide: platform, content type (video, photo, carousel, story), post caption (ready to publish, 30–60 words), and 5 hashtags. Ensure the plan balances new product showcases (50%), lifestyle/aspirational content (30%), and customer reviews/UGC (20%).',
    questions: [
      'Can you build comprehensive, ready-to-use social media content plans?',
      'Are you familiar with African fashion brand marketing on social platforms?',
      'Can you deliver within 2.5 hours?',
    ],
    category: 'Marketing',
    payment: 4000,
  },
  {
    title: 'Write 5 Full Email Marketing Campaigns for a Grocery App',
    description:
      'Write 5 complete email marketing campaigns for a Nairobi grocery delivery app. Each campaign must include: a subject line, a preview text (30 words), a full email body (150–200 words) with intro, main offer or message, bullet-point highlights, and a CTA button text. Campaigns should cover: welcome email, first order offer, abandoned cart, loyalty reward, and weekly deals newsletter.',
    questions: [
      'Can you write complete, conversion-focused email campaigns?',
      'Are you familiar with email marketing best practices for e-commerce?',
      'Can you deliver all 5 within 2 hours?',
    ],
    category: 'Marketing',
    payment: 4000,
  },
  {
    title: 'Translate a 400-Word Product Manual from English to Swahili',
    description:
      'Translate a 400-word product user manual for a Kenyan-made water purifier from English to Swahili. The manual covers installation steps, daily usage, maintenance tips, and safety warnings. The Swahili translation must be clear, technically accurate, and readable by someone with a primary school education. Avoid overly technical vocabulary where simpler Swahili equivalents exist.',
    questions: [
      'Can you translate technical manuals into clear, accessible Swahili?',
      'Are you familiar with technical/instructional translation requirements?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Translation',
    payment: 4100,
  },
  {
    title: 'Write a 400-Word Business Proposal for a School Supply Vendor',
    description:
      'Write a 400-word formal business proposal for "Karatasi Supplies Ltd" — a stationery vendor in Nairobi seeking a supply contract with a private primary school. The proposal should include: an executive summary, company overview, products offered, pricing structure (desks, books, pens, charts), delivery terms, and a competitive advantage section. End with a professional closing and contact details placeholder.',
    questions: [
      'Can you write formal, persuasive B2B business proposals?',
      'Are you familiar with the structure of vendor supply proposals?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Writing',
    payment: 4100,
  },
  {
    title: 'Create a 20-Step Onboarding Guide for New Freelancers',
    description:
      'Write a detailed 20-step onboarding guide for new freelancers joining an online task platform similar to Upwork or Fiverr in Kenya. Steps should cover: profile setup, skills selection, setting rates, writing a bio, completing a test task, receiving payments via M-PESA, handling disputes, building ratings, and scaling their earnings. Each step should have a clear heading and 2–3 sentences of guidance.',
    questions: [
      'Can you write comprehensive, structured onboarding guides?',
      'Are you familiar with how freelance platforms work?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Admin',
    payment: 4200,
  },
  {
    title: 'Write a 500-Word SEO Article on Budget Smartphones in Kenya',
    description:
      'Write a 500-word SEO-optimised article titled "Best Mobile Phones Under KSh 20,000 in Kenya (2025 Guide)." Include: a brief intro on the Kenyan smartphone market, a comparison of 5 phones (Tecno, Infinix, Samsung, Itel, Nokia) in table format, a summary of key features and prices, and a conclusion with a buying recommendation. Naturally include keywords like "affordable smartphones Kenya" and "best phones Kenya 2025."',
    questions: [
      'Can you write SEO-friendly, accurate tech review articles?',
      'Are you familiar with the Kenyan smartphone market?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Research',
    payment: 4200,
  },
  {
    title: 'Write a Customer Service Training Script (10 Complaint Scenarios)',
    description:
      'Write a customer service training script covering 10 common complaint scenarios for a Kenyan e-commerce business. For each scenario, provide: the customer complaint (in realistic conversational language), the wrong response (to demonstrate what not to do), and the correct response (empathetic, solution-focused, professional). Scenarios should cover: late delivery, wrong item, refund request, rude agent complaint, payment failure, and damaged item.',
    questions: [
      'Can you write realistic, training-ready customer service scripts?',
      'Are you familiar with customer service best practices?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Admin',
    payment: 4300,
  },
  {
    title: 'Write 10 Product Reviews for an Electronics E-Commerce Store',
    description:
      'Write 10 authentic-sounding product reviews (100–120 words each) for an online electronics store selling phones, earbuds, and phone accessories in Kenya. Reviews should vary in tone (very happy, satisfied, one constructively critical), mention specific product features (battery life, sound quality, durability), and reflect realistic Kenyan customer experiences. Do not use the same phrases or structure for any two reviews.',
    questions: [
      'Can you write varied, authentic-sounding consumer product reviews?',
      'Are you familiar with electronics products commonly sold in Kenya?',
      'Can you deliver all 10 within 2 hours?',
    ],
    category: 'Writing',
    payment: 4300,
  },
  {
    title: 'Compile a Directory of 20 SME Support Organizations in Nairobi',
    description:
      'Research and compile a verified directory of 20 organizations in Nairobi that provide support to small and medium enterprises. For each entry include: organization name, type of support offered (loans, training, mentorship, market access), contact details (phone/email/website), eligibility requirements, and whether it is free or fee-based. All entries must be currently operational — not disbanded or outdated programs.',
    questions: [
      'Can you research and compile verified business support resource directories?',
      'Are you familiar with the SME support ecosystem in Kenya?',
      'Can you deliver within 2.5 hours?',
    ],
    category: 'Research',
    payment: 4400,
  },
  {
    title: 'Write a Brand Voice Guide for a Kenyan Fintech Startup',
    description:
      'Create a complete brand voice guide for "NjiaFasta" — a Kenyan fintech startup helping informal traders access small loans via mobile. The guide should define: the brand personality (3–5 traits), tone for different contexts (social media vs. loan approval vs. payment reminder), vocabulary to use and avoid, example phrases (before and after rewrites), and guidance for customer service agents. The guide should be practical and immediately usable by a non-marketing team member.',
    questions: [
      'Can you define and document brand voice and tone guidelines?',
      'Are you familiar with fintech brand communication principles?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Admin',
    payment: 4400,
  },
  {
    title: 'Write a 600-Word Explainer Article: How M-PESA Works',
    description:
      'Write a clear, engaging 600-word explainer article titled "How M-PESA Works: A Simple Guide for Everyone" for a general Kenyan audience including people in rural areas who may be new to mobile money. Cover: what M-PESA is, how to register, how to send and receive money, how to pay bills, how to save with M-Akiba or Fuliza, and common safety tips. Use very simple language, short sentences, and relatable examples.',
    questions: [
      'Can you write clear, educational content for non-technical readers?',
      'Do you have accurate knowledge of how M-PESA features work?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Education',
    payment: 4500,
  },
  {
    title: 'Write 15 Social Media Posts for a Hospital Awareness Campaign',
    description:
      'Write 15 diverse social media posts (with captions and hashtags) for a Nairobi private hospital running a 3-week diabetes awareness campaign. Posts should cover: warning signs, prevention tips, myth-busting, diet advice, success patient stories (fictional), free screening promo days, and encouragement to get tested. Mix educational posts, engaging questions, and motivational messages. Platform: Facebook and Instagram.',
    questions: [
      'Can you write accurate, empathetic health awareness content?',
      'Can you balance medical accuracy with accessible, engaging language?',
      'Can you deliver all 15 within 2.5 hours?',
    ],
    category: 'Marketing',
    payment: 4500,
  },
  {
    title: 'Write an Affiliate Marketing Beginner\'s Guide for Kenyans',
    description:
      'Write a comprehensive 600-word beginner\'s guide to affiliate marketing for Kenyans titled "How to Make Money with Affiliate Marketing in Kenya (2025)." Cover: what affiliate marketing is, how it works, best platforms available in Kenya (Jumia Affiliate, Amazon, ClickBank), how to start with no money, how to promote links (WhatsApp, Facebook, blog), how earnings are paid out in Kenya, and realistic earnings expectations. Tone: practical, honest, motivating.',
    questions: [
      'Can you write accurate, practical guides on digital income strategies?',
      'Are you familiar with how affiliate marketing works and which platforms are active in Kenya?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Education',
    payment: 4600,
  },
  {
    title: 'Write a 5-Chapter E-Book Outline on Earning Online in Kenya',
    description:
      'Create a detailed 5-chapter outline for an e-book titled "Earning Online in Kenya: Your Complete Beginner\'s Guide." For each chapter, provide: chapter title, a 3-sentence chapter description, and 5–7 sub-topics or section headings with brief descriptions (1 sentence each). The e-book should cover: freelancing, content creation, affiliate marketing, online selling, and digital skills training. Make the outline specific enough that a writer could use it to write the full book without additional direction.',
    questions: [
      'Can you build detailed, structured e-book outlines?',
      'Are you familiar with the different ways Kenyans can earn income online?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Writing',
    payment: 4600,
  },
  {
    title: 'Produce a 500-Word Competitive Analysis of 3 Kenyan Food Delivery Apps',
    description:
      'Research and write a 500-word competitive analysis comparing 3 Kenyan food delivery apps: Glovo Kenya, Uber Eats Kenya, and Jumia Food (or current equivalents). Compare them on: delivery coverage areas, delivery fees and speed, restaurant partner selection, app user experience, customer support, and promotional offers. Conclude with a recommendation of which app offers the best overall value for a Nairobi consumer ordering daily lunch.',
    questions: [
      'Can you research and compare digital products/services operating in Kenya?',
      'Can you write structured competitive analyses with clear recommendations?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Research',
    payment: 4600,
  },
];

// ── JAMAICA — Culture, Politics & Society (KSh 3,000–6,300) ─────────────────
// These carry their own Jamaican poster names and city locations.
const jamaicaTasks = [
  {
    title: 'Write a 500-Word Article on the Roots of Reggae Music',
    description:
      'Write a 500-word article tracing the origins of reggae music in Jamaica — from ska and rocksteady to the global rise of artists like Bob Marley. Cover the social conditions in 1960s–70s Kingston that shaped its message, the role of Rastafari, and reggae\'s influence on Jamaican identity today. Tone: informative and engaging for a cultural magazine.',
    questions: [
      'Are you knowledgeable about Jamaican music history and its cultural context?',
      'Can you write engaging, well-structured cultural articles?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Writing',
    payment: 3000,
    poster:   'Andre Campbell',
    location: 'Kingston, Jamaica',
  },
  {
    title: 'Translate 10 Common Phrases from English to Jamaican Patois',
    description:
      'Translate 10 everyday English phrases into authentic Jamaican Patois (Patwa) as actually spoken — not a literal word-for-word version. For each phrase, add a short note on the tone and the situation in which a Jamaican would naturally use it. Phrases cover greetings, giving directions, and friendly conversation.',
    questions: [
      'Are you a fluent Jamaican Patois speaker?',
      'Can you capture natural, conversational Patois rather than literal translation?',
      'Can you deliver within 45 minutes?',
    ],
    category: 'Translation',
    payment: 3400,
    poster:   'Shanice Brown',
    location: 'Montego Bay, Jamaica',
  },
  {
    title: 'Research the Lives of Jamaica\'s 7 National Heroes',
    description:
      'Compile a researched profile of each of Jamaica\'s seven National Heroes: Nanny of the Maroons, Paul Bogle, Samuel Sharpe, George William Gordon, Marcus Garvey, Norman Manley, and Alexander Bustamante. For each, provide their era, their key contribution to the nation, and one defining achievement. All information must be historically accurate.',
    questions: [
      'Are you familiar with Jamaican history and its national heroes?',
      'Can you research and verify historical facts accurately?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Research',
    payment: 3800,
    poster:   'Damion Reid',
    location: 'Spanish Town, Jamaica',
  },
  {
    title: 'Write a 250-Word Feature on Authentic Jamaican Jerk Cuisine',
    description:
      'Write a 250-word feature article on jerk cooking as a pillar of Jamaican food culture. Cover its Maroon origins, the key spices (pimento/allspice, Scotch bonnet, thyme), the traditional pimento-wood smoking method, and its place at roadside cook shops and family gatherings. Tone: warm, vivid, and appetising for a food and travel blog.',
    questions: [
      'Are you familiar with Jamaican cuisine and its cultural roots?',
      'Can you write vivid, sensory food writing?',
      'Can you deliver within 1 hour?',
    ],
    category: 'Writing',
    payment: 4200,
    poster:   'Keisha Williams',
    location: 'Ocho Rios, Jamaica',
  },
  {
    title: 'Write an Educational Guide to Jamaica\'s Maroon Heritage',
    description:
      'Write a 400-word educational guide explaining the history and legacy of the Jamaican Maroons — communities of formerly enslaved Africans who resisted colonial rule. Cover the First and Second Maroon Wars, the leadership of Nanny and Cudjoe, the 1739 treaty, and present-day Maroon communities such as Accompong. Write clearly for secondary-school students.',
    questions: [
      'Are you knowledgeable about Maroon history in Jamaica?',
      'Can you write accurate educational content for students?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Education',
    payment: 4500,
    poster:   'Marlon Bennett',
    location: 'Mandeville, Jamaica',
  },
  {
    title: 'Write a 500-Word Explainer on Jamaica\'s Political System',
    description:
      'Write a 500-word explainer on how Jamaica\'s parliamentary democracy works for a civic-education audience. Cover the Westminster-style system, the roles of the Prime Minister and Governor-General, the bicameral Parliament (House of Representatives and Senate), and the two main parties — the People\'s National Party and the Jamaica Labour Party. Keep the piece neutral and non-partisan.',
    questions: [
      'Are you familiar with Jamaica\'s political and parliamentary structure?',
      'Can you write clear, balanced, non-partisan civic content?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Research',
    payment: 4900,
    poster:   'Latoya Grant',
    location: 'Portmore, Jamaica',
  },
  {
    title: 'Write a 400-Word Article on the Jamaican Diaspora and Remittances',
    description:
      'Write a 400-word article on the importance of the Jamaican diaspora to the island\'s society and economy. Cover the major diaspora communities in the UK, US, and Canada; the scale and role of remittances in household income; the cultural ties maintained abroad; and the diaspora\'s influence on Jamaican identity. Use a balanced, informative tone.',
    questions: [
      'Are you familiar with the Jamaican diaspora and its economic role?',
      'Can you write informative socio-economic articles?',
      'Can you deliver within 1.5 hours?',
    ],
    category: 'Writing',
    payment: 5300,
    poster:   'Romario Henry',
    location: 'May Pen, Jamaica',
  },
  {
    title: 'Draft 5 Community Safety Messages for a Jamaican Parish',
    description:
      'Write 5 short, respectful community-safety messages (under 60 words each) that a Jamaican parish council could share on social media to encourage neighbourhood-watch participation and crime reporting. Messages should build trust, avoid stigmatising any community, use lightly localised language, and include a clear call to action. Suitable for Facebook and WhatsApp community groups.',
    questions: [
      'Can you write sensitive, community-focused public messaging?',
      'Are you familiar with the Jamaican social context?',
      'Can you deliver within 1 hour?',
    ],
    category: 'Marketing',
    payment: 5700,
    poster:   'Shelly-Ann Powell',
    location: 'Port Antonio, Jamaica',
  },
  {
    title: 'Write a 500-Word Piece on Jamaica\'s Tourism Economy and Society',
    description:
      'Write a 500-word researched piece examining how tourism shapes Jamaican society and the economy. Cover the key resort areas (Montego Bay, Negril, Ocho Rios), tourism\'s share of employment and GDP, the tension between all-inclusive resorts and local communities, and efforts toward community and heritage tourism. Conclude with a balanced view of the opportunities and challenges.',
    questions: [
      'Are you familiar with Jamaica\'s tourism sector and its social impact?',
      'Can you write balanced, well-researched analytical content?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Research',
    payment: 6000,
    poster:   'Devon Walker',
    location: 'Negril, Jamaica',
  },
  {
    title: 'Write a Cultural Guide to Jamaican Festivals and Emancipendence',
    description:
      'Write a 600-word cultural guide to Jamaica\'s major festivals and national celebrations, including the Emancipation–Independence ("Emancipendence") season in late July and August, Reggae Sumfest, the Maroon celebrations at Accompong, and Bacchanal Carnival. For each, describe its origins, what happens, and its meaning to Jamaican identity. Tone: celebratory and informative for a travel-culture publication.',
    questions: [
      'Are you knowledgeable about Jamaican festivals and national celebrations?',
      'Can you write rich, culturally accurate guides?',
      'Can you deliver within 2.5 hours?',
    ],
    category: 'Writing',
    payment: 6300,
    poster:   'Tashana Clarke',
    location: 'Savanna-la-Mar, Jamaica',
  },
];

// ── Build final TASKS array ──────────────────────────────────────────────────
let idCounter = 1;

const allTemplates = [...tier1, ...tier2, ...tier3, ...tier4, ...jamaicaTasks];

export const TASKS = allTemplates.map(t => ({
  id: idCounter++,
  ...t,
  poster:     t.poster   ?? randomItem(posters),
  location:   t.location ?? randomItem(locations),
  datePosted: recentDate(Math.floor(Math.random() * 7)),
}));
