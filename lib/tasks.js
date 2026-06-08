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

// ── SIMPLE TASKS (Tasks 1–4) ────────────────────────────────────────────────
const simpleTasks = [
  {
    title: 'Write a Short Product Description',
    description:
      'Write a clear, engaging 80–100 word product description for a locally made shea butter moisturiser targeting Kenyan women aged 18–35. The description should highlight key benefits, have a warm and approachable tone, and end with a call to action.',
    questions: [
      'Can you write in a friendly, consumer-facing tone?',
      'Are you comfortable with short-form copywriting?',
      'Can you deliver within 2 hours?',
    ],
    category: 'Writing',
    payment: 2500,
  },
  {
    title: 'Summarise a News Article',
    description:
      'Read a provided news article (approximately 800 words) on Kenya\'s housing policy and produce a clean 150-word summary. The summary must capture the main argument, key statistics, and policy implications without personal opinion.',
    questions: [
      'Can you summarise factual content accurately?',
      'Do you read and understand policy-related articles?',
      'Can you avoid inserting personal opinions in summaries?',
    ],
    category: 'Research',
    payment: 2500,
  },
  {
    title: 'Translate a Short SMS Notification',
    description:
      'Translate five short M-PESA-style SMS notifications (each under 30 words) from English to Swahili. The translations must be natural, conversational, and match the tone used in typical mobile banking messages in Kenya.',
    questions: [
      'Are you fluent in both English and Swahili?',
      'Can you match conversational SMS tone?',
      'Can you deliver all five within 30 minutes?',
    ],
    category: 'Translation',
    payment: 2500,
  },
  {
    title: 'Format a Simple CV Template',
    description:
      'Take the provided raw CV text for a recent university graduate and reformat it into a clean, professional layout using consistent fonts, spacing, and section headings. Output should be submitted as a Word document (.docx) or PDF.',
    questions: [
      'Can you format documents in Word or Google Docs?',
      'Do you understand professional CV standards?',
      'Can you follow a provided layout guide?',
    ],
    category: 'Admin',
    payment: 2600,
  },
];

// ── ADVANCED TASKS (Tasks 5–84) ─────────────────────────────────────────────
const advancedTaskTemplates = [
  // TIER 1 — KSh 2,900–3,400
  {
    title: 'Evaluate the Feasibility of Rooftop Solar for Urban Nairobi Households',
    description:
      'Using publicly available data on Nairobi\'s average solar irradiance, typical household energy consumption, and current inverter/panel pricing in Kenya, evaluate the financial feasibility of a 1.5kW rooftop solar system for a middle-income household in Westlands. Provide a payback period estimate, key assumptions made, and at least two alternative scenarios (e.g., with KPLC net metering vs. off-grid battery backup). Your analysis must be grounded in real Kenyan market conditions — not generic global averages.',
    questions: [
      'Have you worked with energy economics or renewable energy costing?',
      'Can you source and interpret local utility tariff data?',
      'Can you clearly present scenario comparisons in a structured format?',
    ],
    category: 'Research',
    payment: 2900,
  },
  {
    title: 'Assess the Nutritional Adequacy of a Typical Kenyan School Lunch Menu',
    description:
      'Review the standard school lunch menu provided (ugali, sukuma wiki, and beans, served 5 days a week) against WHO and Kenya MoH dietary guidelines for children aged 6–12. Identify any nutritional gaps (macro and micronutrient deficiencies), suggest two realistic, cost-effective menu additions using locally available foods, and justify each recommendation with reference to specific nutritional data. Your analysis should reflect real dietary science, not just general advice.',
    questions: [
      'Do you have background in nutrition science or public health?',
      'Can you reference WHO or Kenya MoH dietary frameworks?',
      'Can you make cost-sensitive recommendations for a school budget context?',
    ],
    category: 'Research',
    payment: 3000,
  },
  {
    title: 'Compare Two Mobile Loan Products Available in Kenya',
    description:
      'Select any two active mobile loan products available in Kenya (e.g., M-Shwari, KCB M-PESA, Tala, Branch, or Fuliza). Compare their effective annual interest rates, eligibility criteria, repayment flexibility, and consumer protection mechanisms. Based on your analysis, recommend which product is better suited for a self-employed market trader earning KSh 15,000/month, with clear reasoning. Avoid general descriptions — this task requires evidence-based comparison using actual product terms.',
    questions: [
      'Are you familiar with mobile lending products operating in Kenya?',
      'Can you compute effective annual interest rates from daily or monthly charges?',
      'Can you make a recommendation grounded in a specific user profile?',
    ],
    category: 'Research',
    payment: 3100,
  },
  {
    title: 'Identify Three High-Demand Skills in Kenya\'s Job Market and Justify Their Value',
    description:
      'Based on a review of at least three current job listing platforms active in Kenya (e.g., BrighterMonday, LinkedIn, Fuzu, MyJobMag), identify three professional skills that appear most frequently in demand across different industries. For each skill, explain why it is in high demand in the current Kenyan economic context, which sectors are driving that demand, and what a job seeker would need to demonstrate that skill credibly. Your findings must be based on observable market data, not assumptions.',
    questions: [
      'Can you systematically review job boards and draw evidence-based insights?',
      'Do you understand Kenya\'s current labour market dynamics?',
      'Can you produce structured, professional findings with cited sources?',
    ],
    category: 'Research',
    payment: 3100,
  },
  {
    title: 'Analyse the Environmental Impact of Single-Use Plastics in Nairobi\'s Informal Markets',
    description:
      'Draw on existing environmental reports, news investigations, or academic literature (post-2018) to analyse the specific environmental impact of single-use plastics in Nairobi\'s informal market sector. Focus on at least two specific impact categories (e.g., Nairobi River pollution, soil contamination in Eastlands). Discuss whether Kenya\'s 2017 plastic ban has been effectively enforced in these settings and recommend one practical, evidence-backed intervention for market operators. Do not submit generic information about plastic pollution.',
    questions: [
      'Can you cite and evaluate environmental literature or official reports?',
      'Do you have knowledge of Kenya\'s regulatory environment for plastics?',
      'Can you make context-specific, actionable recommendations?',
    ],
    category: 'Research',
    payment: 3200,
  },
  {
    title: 'Evaluate the Accuracy of Three Health Claims Circulating on Kenyan WhatsApp Groups',
    description:
      'You will be provided with three health-related claims commonly shared in Kenyan WhatsApp groups (e.g., "drinking warm water cures COVID-19", "moringa reverses diabetes", "alkaline water prevents cancer"). For each claim, assess its scientific validity using peer-reviewed evidence or WHO/CDC guidance. Clearly rate each claim as supported, partially supported, or unsupported, provide a brief explanation of the actual science, and suggest how a non-expert could critically evaluate similar claims in the future.',
    questions: [
      'Can you evaluate health claims against peer-reviewed or WHO-level evidence?',
      'Can you communicate scientific nuance in plain language?',
      'Are you comfortable distinguishing evidence levels (anecdotal vs. clinical trial)?',
    ],
    category: 'Research',
    payment: 3200,
  },
  {
    title: 'Design a Savings and Budget Plan for a Nairobi Boda Boda Rider',
    description:
      'Create a realistic 3-month savings and budget plan for a boda boda motorcycle rider in Nairobi who earns KSh 800–1,200 per day (gross), spends approximately KSh 400/day on fuel, pays KSh 1,500/week on bike hire, and has a family of four to support. The plan should include a daily/weekly/monthly cash flow breakdown, an emergency fund strategy, and identification of at least one productive savings or micro-investment vehicle available in Kenya. All figures and tools must be realistic for this income profile.',
    questions: [
      'Do you have experience with personal finance planning for low-income earners?',
      'Are you familiar with savings products like M-Akiba, SACCOs, or chamas?',
      'Can you produce a structured cash flow model with real numbers?',
    ],
    category: 'Data Entry',
    payment: 3300,
  },
  {
    title: 'Critically Review a Startup Pitch Deck Summary',
    description:
      'You will receive a one-page summary of a fictional Kenyan agri-tech startup\'s pitch deck. Your task is to critically evaluate its strengths and weaknesses across four dimensions: problem–solution fit, market sizing approach, revenue model viability, and team credibility. For each dimension, provide a 2–3 sentence evidence-based critique and suggest one specific improvement. Your review should reflect the standards of an experienced early-stage investor or accelerator program evaluator — not generic startup advice.',
    questions: [
      'Have you evaluated startup pitches or business plans before?',
      'Can you assess market sizing and revenue model logic?',
      'Are you familiar with the East African startup funding landscape?',
    ],
    category: 'Research',
    payment: 3400,
  },

  // TIER 2 — KSh 3,500–4,200
  {
    title: 'Conduct a Comparative Policy Analysis: Free Primary Education in Kenya vs. Uganda',
    description:
      'Compare Kenya\'s Free Primary Education (FPE) policy (introduced 2003) with Uganda\'s Universal Primary Education (UPE) programme across three dimensions: enrolment outcomes, teacher deployment challenges, and learning quality indicators. Use data from published government reports, UNESCO, or credible academic sources. Identify which country\'s programme has produced better measurable outcomes, and explain why — with specific evidence, not broad claims. Conclude with one transferable lesson each country could adopt from the other.',
    questions: [
      'Can you source and compare cross-country education policy data?',
      'Are you comfortable interpreting UNESCO or World Bank education statistics?',
      'Can you make evidence-based comparative judgements without bias?',
    ],
    category: 'Research',
    payment: 3500,
  },
  {
    title: 'Evaluate the Effectiveness of Kenya\'s National Hospital Insurance Fund (NHIF) for Informal Sector Workers',
    description:
      'Critically evaluate NHIF\'s current coverage model as it applies to informal sector workers — the majority of Kenya\'s labour force. Your analysis should cover enrolment barriers, benefit adequacy, claims denial rates (use any published data or audit reports), and comparison with at least one successful community health financing model from SSA. Based on your analysis, propose two specific reforms that would meaningfully improve NHIF coverage for this population, with justification grounded in evidence.',
    questions: [
      'Do you have knowledge of health financing systems in Sub-Saharan Africa?',
      'Can you critically evaluate insurance programme design and delivery gaps?',
      'Can you reference published audits or health system assessments?',
    ],
    category: 'Research',
    payment: 3600,
  },
  {
    title: 'Analyse Land Tenure Security and Agricultural Productivity in Western Kenya',
    description:
      'Drawing on published land economics literature and Kenya-specific studies, analyse the relationship between land tenure security and smallholder agricultural productivity in Western Kenya (Busia, Siaya, Kisumu counties). Distinguish between the effects of formal title deeds and customary tenure systems on farmers\' willingness to invest in land improvements. Identify at least two empirical studies that support or challenge conventional assumptions, and explain what the evidence means for land reform policy in the region.',
    questions: [
      'Are you familiar with land tenure economics and smallholder agriculture literature?',
      'Can you synthesise and critically evaluate multiple empirical studies?',
      'Do you have knowledge of Kenya\'s land policy and registration systems?',
    ],
    category: 'Research',
    payment: 3700,
  },
  {
    title: 'Prepare a Risk Assessment for a Small Import Business in Kenya',
    description:
      'You are advising a Kenyan entrepreneur planning to import second-hand electronics from Dubai and China for resale in Nairobi\'s Luthuli Avenue market. Prepare a structured risk assessment covering: import duty and tax compliance risks, foreign exchange volatility risk, customs clearance delays, competition from dumped goods, and consumer protection liabilities under the Kenya Bureau of Standards. For each risk category, rate severity and likelihood, and propose one mitigation measure. Your assessment must reflect actual Kenyan trade and tax regulations.',
    questions: [
      'Do you understand Kenya Revenue Authority import procedures and duty rates?',
      'Can you assess foreign exchange and supply chain risks in a practical context?',
      'Are you familiar with KEBS product standards and their enforcement?',
    ],
    category: 'Research',
    payment: 3700,
  },
  {
    title: 'Evaluate Peer-to-Peer Lending Platforms Operating in East Africa',
    description:
      'Select three peer-to-peer (P2P) lending or investment platforms that are currently active in East Africa. For each platform, assess: the regulatory framework under which it operates, its default risk management mechanisms, reported return rates for lenders, and the demographic it primarily serves. Based on your comparative analysis, identify which platform offers the most credible risk-adjusted return for a risk-moderate investor with KSh 50,000 to invest. Your recommendation must be supported by specific platform data, not general impressions.',
    questions: [
      'Are you familiar with fintech regulation under CBK or CMA in Kenya?',
      'Can you assess financial product risk-return profiles?',
      'Do you have knowledge of active P2P platforms in East Africa?',
    ],
    category: 'Research',
    payment: 3800,
  },
  {
    title: 'Write a Policy Brief on Menstrual Health Management in Kenyan Public Schools',
    description:
      'Prepare a 600-word evidence-based policy brief addressed to Kenya\'s Ministry of Education on the state of menstrual health management (MHM) in public primary schools. The brief must: define the problem with reference to specific data on school absenteeism and dropout rates linked to MHM; summarise the adequacy of current government interventions; identify a gap in implementation; and propose one specific, costed, and operationally realistic policy recommendation. Cite at least two credible sources (e.g., UNICEF, UNFPA, peer-reviewed papers).',
    questions: [
      'Have you written policy briefs or public health advocacy documents before?',
      'Can you integrate evidence into a structured, decision-facing document?',
      'Are you familiar with MHM programme frameworks in Sub-Saharan Africa?',
    ],
    category: 'Writing',
    payment: 3900,
  },
  {
    title: 'Perform a Market Entry Analysis for a Kenyan Organic Honey Brand Entering Rwanda',
    description:
      'Conduct a structured market entry analysis for a small Kenyan organic honey producer seeking to expand into Rwanda. Your analysis should cover: the regulatory and customs requirements for food imports into Rwanda under EAC protocols, consumer demand indicators for organic products in Rwanda, key competitors already operating in that segment, and the most viable distribution channel. Conclude with a go/no-go recommendation with clear reasoning. All claims must be grounded in verifiable trade data or credible secondary research.',
    questions: [
      'Are you familiar with EAC trade regulations and Rwanda\'s food import requirements?',
      'Can you assess consumer market conditions in a new country from secondary data?',
      'Have you conducted market entry analyses before?',
    ],
    category: 'Research',
    payment: 4000,
  },
  {
    title: 'Evaluate the Development Impact of Chinese Infrastructure Loans in Kenya',
    description:
      'Critically evaluate the development impact of at least two Chinese-financed infrastructure projects in Kenya — specifically the Standard Gauge Railway (SGR) and one road or energy project. For each, assess: the stated development objectives vs. measurable outcomes; debt sustainability implications for Kenya\'s public finances; and critiques raised by credible analysts or institutions (e.g., Brookings, IMF, ODI, academic papers). Present a balanced conclusion — neither dismissing the projects nor uncritically endorsing them — supported by evidence and data.',
    questions: [
      'Can you evaluate infrastructure economics and sovereign debt sustainability?',
      'Are you familiar with the literature on Chinese development finance in Africa?',
      'Can you present a balanced, evidence-based analysis on a politically contested topic?',
    ],
    category: 'Research',
    payment: 4100,
  },
  {
    title: 'Develop a Monitoring and Evaluation Framework for a Community Water Project in Turkana',
    description:
      'Design a practical M&E framework for a borehole water project serving 1,200 people in Turkana County, Kenya. The framework must include: a theory of change (with at least one diagram), key outcome indicators at output, outcome, and impact levels, data collection methods appropriate for a low-literacy, remote context, and a simple dashboard template for reporting to donors. All indicators must be SMART and contextually grounded in WASH (Water, Sanitation, and Hygiene) programming in arid/semi-arid regions of Kenya.',
    questions: [
      'Have you developed M&E frameworks for development or humanitarian projects?',
      'Are you familiar with WASH indicators and data collection in ASAL contexts?',
      'Can you create practical monitoring tools for use by community-level staff?',
    ],
    category: 'Research',
    payment: 4200,
  },

  // TIER 3 — KSh 4,300–5,100
  {
    title: 'Analyse the Relationship Between Mobile Money Penetration and Financial Inclusion in SSA',
    description:
      'Using data from the Global Findex Database (2021 or most recent), World Bank financial inclusion indicators, and relevant academic literature, analyse the extent to which mobile money penetration has driven financial inclusion across Sub-Saharan Africa. Identify at least three countries with contrasting outcomes and explain the contextual factors that account for the differences. Critically assess whether mobile money alone is sufficient for meaningful financial inclusion, or whether it requires complementary interventions. Present findings in a structured analytical report format.',
    questions: [
      'Are you familiar with the Global Findex Database and financial inclusion metrics?',
      'Can you interpret cross-country data and draw analytically valid comparisons?',
      'Can you critically assess causal claims in development finance literature?',
    ],
    category: 'Research',
    payment: 4300,
  },
  {
    title: 'Investigate the Effects of Drought on Pastoralist Household Economies in Northern Kenya',
    description:
      'Drawing on NDMA (National Drought Management Authority) reports, academic studies, or credible NGO assessments, investigate how recurring drought events have affected the economic resilience of pastoralist households in Marsabit, Turkana, or Wajir counties. Quantify the impact where data allows (e.g., livestock mortality rates, income loss estimates, food insecurity indicators). Evaluate the effectiveness of at least two current response mechanisms (e.g., Hunger Safety Net Programme, livestock insurance). Conclude with an evidence-based critique of the existing resilience-building approach.',
    questions: [
      'Are you familiar with NDMA reports and pastoralist livelihood literature in Kenya?',
      'Can you quantify economic impacts from secondary data sources?',
      'Can you critically evaluate humanitarian and resilience programming effectiveness?',
    ],
    category: 'Research',
    payment: 4400,
  },
  {
    title: 'Conduct a Sector Competitiveness Analysis of Kenya\'s Cut Flower Export Industry',
    description:
      'Analyse the competitive position of Kenya\'s cut flower export industry using Porter\'s Five Forces or a comparable analytical framework. Incorporate data on Kenya\'s current market share in the EU, key competitors (Netherlands, Ethiopia, Colombia), production cost structures, regulatory standards compliance (e.g., MPS, Rainforest Alliance), and logistical advantages/disadvantages. Identify two structural threats to Kenya\'s long-term competitiveness and propose one strategic recommendation for the Kenya Flower Council or relevant government body.',
    questions: [
      'Can you apply competitive analysis frameworks to an export industry context?',
      'Are you familiar with Kenya\'s horticultural sector and EU market access requirements?',
      'Can you draw on trade statistics to support your analysis?',
    ],
    category: 'Research',
    payment: 4500,
  },
  {
    title: 'Design a Trauma-Informed Curriculum Module for Secondary Schools in Post-Conflict Kenya',
    description:
      'Design a 4-session curriculum module (with session outlines and sample activities) for Form 2 students in schools affected by post-election violence (e.g., Kisumu or Nakuru). The module should be grounded in trauma-informed education principles and aligned with Kenya\'s Competency-Based Curriculum (CBC) values framework. Identify the psychological outcomes each session targets, explain the evidence base for the approach used, and flag at least two ethical considerations for educators implementing this content. Generic activities are not acceptable — the design must demonstrate professional knowledge of trauma-informed pedagogy.',
    questions: [
      'Do you have background in educational psychology or trauma-informed pedagogy?',
      'Are you familiar with Kenya\'s CBC framework and secondary school context?',
      'Can you design curriculum content that meets ethical safeguarding standards?',
    ],
    category: 'Education',
    payment: 4600,
  },
  {
    title: 'Evaluate the Legal and Operational Compliance Requirements for Running a HealthTech Startup in Kenya',
    description:
      'Prepare a comprehensive compliance checklist and explanatory memo for a Kenyan entrepreneur launching a digital health platform that connects patients with private doctors via telemedicine. Cover: business registration requirements (BRS, KRA), Kenya Medical Practitioners and Dentists Council (KMPDC) digital health guidelines, data privacy obligations under Kenya\'s Data Protection Act 2019, insurance requirements, and any CBK-related obligations if handling payments. Identify the three highest-risk compliance areas and explain potential penalties for non-compliance. All guidance must reflect current Kenyan law.',
    questions: [
      'Are you knowledgeable about Kenyan health regulation and the Data Protection Act 2019?',
      'Can you produce a structured compliance document suitable for a startup founder?',
      'Can you identify regulatory risk and prioritise compliance actions?',
    ],
    category: 'Research',
    payment: 4700,
  },
  {
    title: 'Critically Analyse Urban Informal Settlement Upgrading Policies in Sub-Saharan Africa',
    description:
      'Compare at least three urban informal settlement upgrading programmes in Sub-Saharan Africa — including Kenya\'s Kenya Informal Settlements Improvement Project (KISIP) — in terms of their design philosophy, community participation mechanisms, measurable housing quality improvements, and displacement risks. Draw on academic urban planning literature and credible evaluation reports. Identify the key failure modes common across programmes and propose one evidence-based design principle that consistently differentiates successful upgrading programmes from failed ones.',
    questions: [
      'Are you familiar with urban informal settlement literature and housing policy in SSA?',
      'Can you evaluate programme effectiveness from published evaluations?',
      'Can you synthesise cross-country evidence into actionable design principles?',
    ],
    category: 'Research',
    payment: 4800,
  },
  {
    title: 'Forecast the Economic Viability of Electric Motorcycle Adoption in Kenya over 5 Years',
    description:
      'Develop a 5-year economic viability forecast for mass adoption of electric motorcycles (e-boda) in Kenya. Your analysis should model: total cost of ownership comparison (e-boda vs. petrol), EV charging infrastructure investment requirements, projected impact of falling battery costs, government incentive assumptions, and demand-side adoption barriers among boda boda riders. Build at least two scenarios (optimistic and conservative) with clearly stated assumptions. Reference actual market entrants in Kenya (e.g., Roam, BasiGo, Ampersand) where relevant.',
    questions: [
      'Can you build scenario-based economic models with clearly stated assumptions?',
      'Are you familiar with Kenya\'s EV market and energy infrastructure constraints?',
      'Can you interpret cost-of-ownership data and project adoption curves?',
    ],
    category: 'Research',
    payment: 4900,
  },
  {
    title: 'Assess the Effectiveness of Social Cash Transfer Programmes on Child Nutrition in Rural Kenya',
    description:
      'Drawing on impact evaluation studies of Kenya\'s Cash Transfer for Orphans and Vulnerable Children (CT-OVC) or the Hunger Safety Net Programme (HSNP), assess their measurable effectiveness on under-5 child nutrition outcomes. Identify what the evidence shows about the size of nutritional improvements, the conditions under which transfers have greater nutritional impact, and where the programmes have fallen short. Critically evaluate whether cash alone is sufficient to improve nutrition or whether it must be combined with other interventions, with evidence.',
    questions: [
      'Can you evaluate impact evaluation designs and interpret effect sizes?',
      'Are you familiar with Kenya\'s social protection programme architecture?',
      'Can you engage critically with debates about cash transfers vs. in-kind support?',
    ],
    category: 'Research',
    payment: 5000,
  },
  {
    title: 'Prepare an Investment Memo for a Renewable Energy Project in Rural Kenya',
    description:
      'Write a structured investment memo (approx. 700 words) for a hypothetical 100kW mini-grid solar project in a rural Kenyan community of 450 households. The memo should include: a demand analysis, projected revenue model (based on published KPLC or off-grid tariff data), capital expenditure breakdown, key risks (regulatory, technical, financial), and a break-even analysis. The memo should be presented at a level suitable for a clean energy impact investor. All financial assumptions must be grounded in real Kenyan market data — not hypothetical or global averages.',
    questions: [
      'Can you build financial models and break-even analyses for energy projects?',
      'Are you familiar with off-grid solar economics and KPLC tariff structures in Kenya?',
      'Have you written investment memos or project appraisals before?',
    ],
    category: 'Research',
    payment: 5100,
  },

  // TIER 4 — KSh 5,200–6,000
  {
    title: 'Evaluate Algorithmic Bias Risks in AI-Based Credit Scoring for African Markets',
    description:
      'Critically analyse the specific risks of algorithmic bias in AI-based credit scoring models deployed in African markets, with particular focus on Kenya and Nigeria. Address: what data features commonly used in these models (e.g., mobile usage patterns, social network data) may introduce or amplify existing inequalities; what regulatory mechanisms currently exist or are proposed under Kenya\'s Data Protection Act or Nigeria\'s NDPR; and what model auditing or fairness techniques the industry should adopt. Your analysis should engage with published research on algorithmic fairness and specific African case studies — not generic AI ethics content.',
    questions: [
      'Do you have knowledge of machine learning model fairness and bias evaluation techniques?',
      'Are you familiar with African fintech credit scoring models and their data sources?',
      'Can you engage with AI ethics research at a technically informed level?',
    ],
    category: 'Research',
    payment: 5200,
  },
  {
    title: 'Write a Comparative Legal Analysis of Digital Content Creator Rights in East Africa',
    description:
      'Compare the legal framework protecting digital content creators (YouTubers, podcasters, online writers) across Kenya, Uganda, and Tanzania. Analyse copyright ownership, platform liability, revenue monetisation rights, and protections against content theft under each country\'s intellectual property law and any relevant regional (EAC) instruments. Identify the jurisdiction offering the strongest protections for a creator\'s commercial rights, with specific statutory references, and flag two legal grey areas that require legislative reform in the region.',
    questions: [
      'Do you have knowledge of IP law and copyright frameworks in East Africa?',
      'Can you reference specific statutory provisions across multiple jurisdictions?',
      'Are you able to produce a structured legal analysis document?',
    ],
    category: 'Research',
    payment: 5300,
  },
  {
    title: 'Analyse Determinants of Child Stunting in Kenya\'s Arid and Semi-Arid Lands (ASAL)',
    description:
      'Using data from Kenya\'s Demographic and Health Survey (DHS) and relevant nutritional epidemiology studies, analyse the key determinants of child stunting in Kenya\'s ASAL counties (Turkana, Wajir, Mandera, Garissa). Go beyond general food insecurity — examine the role of maternal education, water access, sanitation, birth spacing, and healthcare service proximity in explaining stunting rates. Discuss the relative contribution of each determinant where data allows, and identify which two have the strongest evidence base for intervention. Present findings at an academic or technical policy report standard.',
    questions: [
      'Are you trained in nutritional epidemiology or public health?',
      'Can you interpret DHS data and multi-variable determinant analyses?',
      'Can you produce a technically rigorous report grounded in peer-reviewed literature?',
    ],
    category: 'Research',
    payment: 5400,
  },
  {
    title: 'Develop a Climate Adaptation Strategy for Smallholder Maize Farmers in Rift Valley, Kenya',
    description:
      'Design a practical, evidence-based climate adaptation strategy for smallholder maize farmers in Kenya\'s Rift Valley experiencing increasing rainfall variability and rising temperatures. The strategy should include: a brief climate vulnerability assessment using published climate projections (e.g., IPCC AR6 regional data for East Africa), at least three agronomic adaptation measures with evidence of effectiveness in similar agroecological zones, one financial risk management tool (e.g., index-based crop insurance), and an implementation pathway for a county-level agricultural extension programme. Avoid generic climate advice — all recommendations must be calibrated to the specific East African highland context.',
    questions: [
      'Are you familiar with IPCC East Africa regional projections and agronomy literature?',
      'Can you design practical adaptation measures grounded in field evidence?',
      'Do you have experience with agricultural extension programme design?',
    ],
    category: 'Research',
    payment: 5500,
  },
  {
    title: 'Conduct a Behavioural Economics Analysis of Low Savings Rates Among Kenyan Youth',
    description:
      'Apply behavioural economics theory to explain the persistently low savings rates among urban Kenyan youth (ages 18–30) in the informal economy. Identify at least four specific cognitive biases or psychological barriers (e.g., present bias, mental accounting, social comparison effects, loss aversion) that are empirically supported in the African context, and discuss how each manifests in this demographic. Propose two behavioural intervention designs (e.g., commitment savings devices, framing experiments) that have demonstrated effectiveness in comparable populations, citing specific programmes or studies.',
    questions: [
      'Do you have training in behavioural economics or decision-making psychology?',
      'Can you apply theoretical frameworks to a specific African economic context?',
      'Are you familiar with randomised control trials or field experiments in savings behaviour?',
    ],
    category: 'Research',
    payment: 5600,
  },
  {
    title: 'Prepare a Strategic Communications Plan for a Kenyan Public Health Campaign on Antibiotic Resistance',
    description:
      'Develop a 6-month strategic communications plan for a public health campaign to reduce antibiotic misuse among urban consumers in Kenya. The plan must include: a situational analysis grounded in Kenya-specific AMR (Antimicrobial Resistance) data, audience segmentation with distinct communication strategies per segment, selection and justification of media channels (mass media, community health workers, digital), key message frameworks informed by health communication theory (e.g., Extended Parallel Process Model), and a basic M&E framework. The plan should reflect professional public health communications practice, not generic marketing advice.',
    questions: [
      'Do you have a background in health communications or public health campaigns?',
      'Can you apply health communication theory to campaign design?',
      'Are you familiar with Kenya\'s media landscape and community health systems?',
    ],
    category: 'Marketing',
    payment: 5700,
  },
  {
    title: 'Evaluate the Impact of Internet Connectivity on Secondary School Learning Outcomes in Kenya',
    description:
      'Synthesise evidence from published studies, government reports, and programme evaluations on the impact of internet connectivity and digital device access on secondary school learning outcomes in Kenya. Specifically address: whether connectivity alone improves outcomes or requires complementary inputs (teacher training, relevant content, electricity); lessons from large-scale programmes such as Kenya\'s Digital Literacy Programme (DLP); and equity dimensions — whether rural and urban schools have benefited equally. Conclude with an evidence-graded recommendation on the most cost-effective digital education investment for Kenya\'s MoE.',
    questions: [
      'Can you evaluate education technology evidence and distinguish correlation from causation?',
      'Are you familiar with Kenya\'s DLP programme and its evaluations?',
      'Can you make evidence-graded policy recommendations in education?',
    ],
    category: 'Education',
    payment: 5800,
  },
  {
    title: 'Analyse the Structural Barriers to Women\'s Land Ownership in Kenya and Policy Implications',
    description:
      'Produce a rigorous analytical report on the structural barriers preventing women from owning or controlling land in Kenya. Cover: legal barriers (despite constitutional guarantees), customary law conflicts, inheritance norms, institutional enforcement gaps, and intra-household power dynamics. Ground your analysis in land tenure research and legal scholarship specific to Kenya and East Africa. Critically evaluate the effectiveness of at least two recent policy interventions aimed at improving women\'s land rights, and identify what the evidence says is the most impactful lever for change.',
    questions: [
      'Are you trained in gender studies, land law, or development economics?',
      'Can you critically synthesise legal, sociological, and economic evidence?',
      'Do you have knowledge of Kenya\'s land law reform history?',
    ],
    category: 'Research',
    payment: 5900,
  },
  {
    title: 'Conduct a Technical Due Diligence Review of a Kenyan EdTech Startup\'s Product Architecture',
    description:
      'You will receive a one-page technical summary of a Kenyan EdTech startup\'s product architecture (mobile-first, offline-capable learning app for secondary schools). Your task is to conduct a technical due diligence review covering: scalability of the architecture for 100,000 concurrent users; data privacy compliance under Kenya\'s Data Protection Act 2019; offline-sync design approach and its suitability for low-bandwidth rural environments; security architecture (authentication, data encryption); and performance on low-end Android devices (1GB RAM, Android 8). Each dimension should be reviewed against industry best practices with specific, actionable observations.',
    questions: [
      'Do you have software architecture or engineering experience?',
      'Are you familiar with offline-first mobile app design and low-resource Android constraints?',
      'Can you produce a structured technical due diligence report?',
    ],
    category: 'Testing',
    payment: 6000,
  },

  // TIER 5 — KSh 6,100–7,000
  {
    title: 'Model the Fiscal Space Implications of Universal Health Coverage in Kenya',
    description:
      'Develop a fiscal space analysis for Kenya\'s transition to Universal Health Coverage (UHC), drawing on Kenya\'s published national health accounts, current government health expenditure data (MoH, CBK), and existing UHC costing literature. Identify the five main sources of fiscal space (economic growth, reprioritisation, increased health-sector revenue, efficiency gains, donor funding) and quantitatively estimate the potential contribution of at least three under each of two economic growth scenarios. Critically assess the political economy constraints likely to limit actual fiscal mobilisation. Present your findings in a structured analytical report with a summary data table.',
    questions: [
      'Do you have training in health economics or public finance?',
      'Can you interpret national health account data and fiscal projections?',
      'Are you familiar with WHO fiscal space frameworks for UHC costing?',
    ],
    category: 'Research',
    payment: 6100,
  },
  {
    title: 'Produce a Legal Risk Memorandum on Drone Use for Agricultural Surveying in Kenya',
    description:
      'Prepare a detailed legal risk memorandum for a Kenyan agri-tech company planning to use commercial drones for crop monitoring across large farms in Nakuru, Laikipia, and Trans-Nzoia counties. The memo must cover: Kenya Civil Aviation Authority (KCAA) drone operator licensing requirements, airspace restrictions near airports and military zones in those counties, land access rights and farmer consent obligations, data protection implications of captured aerial imagery, insurance requirements, and potential liability exposure. All guidance must cite specific Kenyan regulations and KCAA directives — not generic drone law.',
    questions: [
      'Do you have knowledge of KCAA drone regulations and Kenyan aviation law?',
      'Can you prepare a professional legal risk memo at attorney-standard?',
      'Are you familiar with data privacy implications under the Data Protection Act 2019?',
    ],
    category: 'Research',
    payment: 6200,
  },
  {
    title: 'Evaluate the Effectiveness of Community-Based Natural Resource Management in East Africa',
    description:
      'Critically evaluate the evidence on Community-Based Natural Resource Management (CBNRM) programmes in East Africa, drawing on at least four published case studies from Kenya, Tanzania, or Uganda. For each case, assess: biodiversity outcomes, community income and equity effects, governance arrangements, and long-term sustainability. Engage with the critical literature that challenges CBNRM assumptions (e.g., elite capture, exclusion of marginalized groups, conflict with national conservation priorities). Conclude with a synthesised framework identifying the conditions under which CBNRM produces genuine community and conservation co-benefits.',
    questions: [
      'Are you trained in conservation biology, natural resource economics, or environmental policy?',
      'Can you synthesise cross-study evidence and engage with critical literature?',
      'Can you develop analytical frameworks from empirical case synthesis?',
    ],
    category: 'Research',
    payment: 6300,
  },
  {
    title: 'Develop a Demand Forecasting Model for Fast-Moving Consumer Goods (FMCG) Distribution in East Africa',
    description:
      'Build a conceptual and partially quantitative demand forecasting model for an FMCG distributor operating across Kenya, Uganda, and Tanzania. Your model should: identify the key demand drivers (GDP growth, urbanisation, population growth, informal retail penetration, mobile commerce); select and justify an appropriate forecasting method (time-series, econometric, or hybrid); provide a worked example using publicly available macroeconomic data for one product category (e.g., packaged cooking oil or bottled water); outline the data requirements for full model implementation; and address how to account for seasonal and shock events (e.g., COVID-19 demand disruption). Present this as a technical model specification report.',
    questions: [
      'Can you build and specify quantitative forecasting models?',
      'Are you familiar with FMCG distribution dynamics in East Africa?',
      'Can you produce a model specification document suitable for a data science or analytics team?',
    ],
    category: 'Data Entry',
    payment: 6400,
  },
  {
    title: 'Conduct a Systematic Review of Violence Against Women Interventions in Rural Kenya',
    description:
      'Conduct a mini systematic review of published interventions addressing gender-based violence (GBV) against women in rural Kenya between 2015 and 2024. Following a clearly stated inclusion/exclusion criteria, identify and summarise at least six intervention studies or programme evaluations. For each, extract: intervention type, target population, study design, key outcomes, and effect sizes where reported. Synthesise findings across studies to assess what types of interventions have the strongest evidence base, identify research gaps, and produce a GRADE-style evidence rating for at least two outcome categories. This task requires graduate-level systematic review methodology.',
    questions: [
      'Are you trained in systematic review methodology (PRISMA or equivalent)?',
      'Do you have expertise in gender-based violence programme evaluation?',
      'Can you produce a graduate-level evidence synthesis document?',
    ],
    category: 'Research',
    payment: 6500,
  },
  {
    title: 'Produce a Private Equity Investment Thesis for Sub-Saharan African Healthcare',
    description:
      'Write a professional-grade private equity investment thesis (800–1,000 words) for a healthcare-focused PE fund targeting Sub-Saharan Africa. The thesis should cover: macro thesis (demographic, epidemiological, and economic drivers); investment focus areas (with evidence for why — e.g., diagnostics, primary care, health logistics, pharmaceutical distribution); target company profile and key selection criteria; deal structuring considerations specific to SSA emerging market healthcare transactions; key risks (currency, regulatory, governance) and mitigants; and expected return drivers and exit routes. This should be written at the standard of a fund prospectus or LP presentation investment thesis section.',
    questions: [
      'Do you have experience in private equity, venture capital, or investment banking?',
      'Are you familiar with the healthcare investment landscape in Sub-Saharan Africa?',
      'Can you produce PE-quality investment writing with rigorous market logic?',
    ],
    category: 'Research',
    payment: 6600,
  },
  {
    title: 'Critically Evaluate Decolonisation Debates in African Higher Education Curricula',
    description:
      'Produce an academically rigorous critical essay (800–1,000 words) evaluating the current debates on decolonising higher education curricula in Africa, with specific reference to examples from Kenyan, South African, or Nigerian universities. Engage with at least three major theoretical positions in the decolonisation literature (e.g., Ngugi wa Thiong\'o\'s language argument, Mbembe\'s necropolitics and knowledge systems, Shay\'s graduate attribute critique), assess their practical implications for curriculum reform, and identify two unresolved tensions or contradictions in the decolonisation agenda. The essay must demonstrate command of the literature — not a surface summary.',
    questions: [
      'Do you have training in higher education studies, postcolonial theory, or curriculum studies?',
      'Can you engage critically with academic theoretical debates in the humanities or social sciences?',
      'Can you write at doctoral-seminar level without relying on surface-level summaries?',
    ],
    category: 'Education',
    payment: 6700,
  },
  {
    title: 'Design a Multi-Country Agricultural Value Chain Financing Programme for East Africa',
    description:
      'Design the conceptual architecture of a multi-country agricultural value chain financing programme targeting smallholder farmers across Kenya, Ethiopia, and Tanzania. The programme design should include: a theory of change, value chain selection rationale (with market evidence), financing instruments at each value chain node (pre-harvest, post-harvest, off-taker finance), risk-sharing structures between financiers, agribusinesses, and public actors, digital delivery infrastructure requirements, and an impact measurement framework. The design must reflect real structural constraints in each country\'s agricultural finance ecosystem — not generic blended finance templates.',
    questions: [
      'Do you have expertise in agricultural finance or blended finance programme design?',
      'Can you develop multi-country programme architecture accounting for different regulatory contexts?',
      'Have you produced development finance programme design documents before?',
    ],
    category: 'Research',
    payment: 6800,
  },
  {
    title: 'Conduct a Meta-Analysis Summary of Malaria Control Interventions in Sub-Saharan Africa',
    description:
      'Drawing on published meta-analyses, Cochrane systematic reviews, and WHO malaria programme evaluations, produce an expert-level analytical summary of the comparative effectiveness of malaria control interventions in SSA. Your summary must cover: insecticide-treated nets (ITNs), indoor residual spraying (IRS), seasonal malaria chemoprevention (SMC), RTS,S and R21 vaccines, and integrated vector management. For each intervention, quantify effect sizes where available (e.g., reduction in all-cause child mortality or confirmed malaria cases), discuss heterogeneity of effects across settings, and critically evaluate evidence quality. Conclude with a prioritisation recommendation for a resource-constrained East African country context.',
    questions: [
      'Do you have a background in epidemiology, global health, or clinical research?',
      'Can you interpret meta-analytic statistics and heterogeneity measures?',
      'Can you synthesise Cochrane-level evidence and WHO guidance critically?',
    ],
    category: 'Research',
    payment: 6900,
  },
  {
    title: 'Produce a Strategic Organisational Assessment for a Kenyan NGO Seeking Institutional Funding',
    description:
      'Conduct a strategic organisational assessment for a mid-sized Kenyan NGO working in women\'s economic empowerment that is preparing to apply for a 5-year institutional grant from DFID/FCDO or the Gates Foundation. Your assessment must cover: organisational governance and accountability structures, programme theory of change strength and coherence, financial management and reporting capacity, evidence generation and learning systems, risk management frameworks, and staff capacity gaps. For each dimension, provide a current state assessment, a rating (strong/adequate/weak), and one priority recommendation. This assessment should be at the standard used by institutional donors in their due diligence processes.',
    questions: [
      'Have you conducted organisational capacity assessments or OCA processes for NGOs before?',
      'Are you familiar with FCDO or Gates Foundation organisational standards?',
      'Can you produce an institutional-grade assessment document suitable for donor scrutiny?',
    ],
    category: 'Admin',
    payment: 7000,
  },

  // TIER 6 — KSh 7,100–7,600 (most demanding)
  {
    title: 'Write a Doctoral-Level Literature Review on Digital Financial Services and Household Poverty Reduction in Africa',
    description:
      'Produce a doctoral-level literature review (1,000–1,200 words) on the causal relationship between digital financial services (DFS) adoption and household poverty reduction in Sub-Saharan Africa. The review must: identify and organise the major research streams and debates; critically evaluate the methodological strengths and weaknesses of key studies (including Suri & Jack\'s 2016 M-PESA study and its replications/critiques); address heterogeneity of effects by gender, geography, and income quintile; identify unresolved research questions; and demonstrate command of econometric approaches used in the literature (RCT, IV estimation, difference-in-differences). The review must reflect original critical synthesis — not a descriptive list of findings.',
    questions: [
      'Do you have doctoral-level training in development economics or a closely related field?',
      'Can you critically evaluate econometric study designs and their internal/external validity?',
      'Can you produce original analytical synthesis at the standard expected in peer-reviewed journals?',
    ],
    category: 'Research',
    payment: 7100,
  },
  {
    title: 'Develop a Full Mixed-Methods Research Design for a Study on Youth Unemployment in Urban Kenya',
    description:
      'Design a complete mixed-methods research protocol for a study investigating the structural determinants of youth unemployment in Nairobi\'s informal economy. The protocol should include: a theoretically grounded conceptual framework (e.g., capabilities approach, labour market segmentation theory), research questions and hypotheses, rationale for a mixed-methods design, quantitative component design (survey instrument sketch, sampling approach, variables, planned analytic strategy), qualitative component design (IDI and FGD approach, purposive sampling rationale, analytic framework), integration strategy, ethical considerations (consent, anonymity, power dynamics), and expected limitations. The design should be at IRB-submission standard.',
    questions: [
      'Are you trained in mixed-methods research design at graduate or post-graduate level?',
      'Can you design a rigorous quantitative survey instrument and qualitative inquiry approach?',
      'Do you have experience preparing or evaluating research protocols at IRB/ethics-committee standard?',
    ],
    category: 'Research',
    payment: 7200,
  },
  {
    title: 'Produce an Advanced Financial Modelling Report for a Pan-African Fintech Expansion',
    description:
      'Build and document an advanced financial modelling framework for a Kenyan fintech company planning to expand into Ghana, Nigeria, and Rwanda over 36 months. The framework should include: a consolidated 3-statement model structure (P&L, balance sheet, cash flow) with country-specific revenue assumptions; FX risk modelling for KES, GHS, NGN, and RWF against USD; regulatory capital adequacy projections under each country\'s central bank requirements; scenario analysis (base, bull, bear) with clearly stated macroeconomic assumptions; and a venture IRR and MOIC calculation. The output should include a model narrative memo explaining the structure, assumptions, and key sensitivities — at the standard expected by a Series B CFO or institutional investor.',
    questions: [
      'Can you build consolidated 3-statement financial models in Excel or equivalent tools?',
      'Are you familiar with fintech regulatory capital requirements in West and East Africa?',
      'Can you produce a model narrative memo at CFO or investment banker standard?',
    ],
    category: 'Data Entry',
    payment: 7300,
  },
  {
    title: 'Write an Expert-Level Policy Evaluation: Kenya\'s Big Four Agenda — Housing Pillar',
    description:
      'Produce an expert-level policy evaluation (1,000–1,200 words) of the Housing Pillar of Kenya\'s Big Four Agenda (2017–2022), which targeted the construction of 500,000 affordable housing units. The evaluation should: assess actual delivery against targets using verifiable data; apply a recognised policy evaluation framework (e.g., OECD DAC criteria or the 3Es — economy, efficiency, effectiveness); critically analyse the design and implementation failures that limited outcomes; assess distributional equity — who actually benefited; and evaluate the sustainability of the Affordable Housing Levy introduced in 2023 as a successor mechanism. This evaluation must demonstrate independent analytical judgement, not reliance on government press releases or AI-generated summaries.',
    questions: [
      'Can you evaluate government programmes against a rigorous policy evaluation framework?',
      'Are you familiar with Kenya\'s housing policy history and the Big Four Agenda design?',
      'Can you produce an evaluation at the standard expected by a parliamentary committee or think tank?',
    ],
    category: 'Research',
    payment: 7400,
  },
  {
    title: 'Develop a Legal and Regulatory Strategy for a Cross-Border Remittance Fintech in East Africa',
    description:
      'Develop a comprehensive legal and regulatory strategy for a fintech startup that is building a mobile-to-mobile cross-border remittance product connecting Kenya, Tanzania, Uganda, and Rwanda. The strategy must cover: licensing requirements in each jurisdiction (PSP licences, e-money institution authorisations), EAC cross-border payment framework opportunities and gaps, AML/CFT compliance obligations under each country\'s financial intelligence unit, data localisation requirements, interoperability obligations under existing regional frameworks (e.g., EAPS, REPSS), and a sequenced market entry plan that minimises regulatory exposure. Identify the three highest-stakes regulatory risks and propose mitigation strategies grounded in existing legal instruments.',
    questions: [
      'Do you have expertise in financial services regulation in East Africa?',
      'Can you navigate multi-jurisdictional compliance strategy at a professional standard?',
      'Have you advised on or worked with cross-border payment regulatory strategy in Africa?',
    ],
    category: 'Research',
    payment: 7500,
  },
  {
    title: 'Produce a PhD-Level Critical Essay on the Political Economy of Food Systems Transformation in Sub-Saharan Africa',
    description:
      'Write a sophisticated critical essay (1,200–1,400 words) examining the political economy of food systems transformation in Sub-Saharan Africa, with a focus on the tension between smallholder-centred and agro-industrial transformation pathways. The essay must: engage critically with at least four major theoretical or empirical contributions to the debate (drawing from food sovereignty literature, agrarian political economy, and development economics); interrogate the role of transnational corporations, donor institutions, and African states in shaping food system trajectories; evaluate the evidence on whether market-led transformation has reduced food insecurity or exacerbated structural inequality; and develop an original argument that advances beyond the existing literature. The essay must demonstrate the analytical depth, theoretical fluency, and argumentative precision expected at PhD examination standard.',
    questions: [
      'Do you have doctoral-level training in development studies, agrarian political economy, food systems, or a closely related field?',
      'Can you develop and sustain an original argument through engagement with academic literature?',
      'Can you write at a standard appropriate for a high-quality peer-reviewed journal in your field?',
    ],
    category: 'Research',
    payment: 7600,
  },
];

// ── Build final TASKS array ──────────────────────────────────────────────────

const simpleEntries = simpleTasks.map((t, i) => ({
  id: i + 1,
  ...t,
  poster: randomItem(posters),
  location: randomItem(locations),
  datePosted: recentDate(Math.floor(Math.random() * 7)),
}));

const advancedEntries = advancedTaskTemplates.map((t, i) => ({
  id: i + 5,
  ...t,
  poster: randomItem(posters),
  location: randomItem(locations),
  datePosted: recentDate(Math.floor(Math.random() * 7)),
  questions: t.questions,
}));

export const TASKS = [...simpleEntries, ...advancedEntries];