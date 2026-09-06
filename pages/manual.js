import React, { useEffect } from "react";

export default function Manual() {
  useEffect(() => {
    const questions = document.querySelectorAll(".faq-q");
    const handlers = [];

    questions.forEach((question) => {
      const handler = () => {
        const item = question.parentElement;
        const isOpen = item.classList.contains("open");

        document.querySelectorAll(".faq-item").forEach((faqItem) => {
          faqItem.classList.remove("open");
        });

        if (!isOpen) {
          item.classList.add("open");
        }
      };

      question.addEventListener("click", handler);
      handlers.push({ question, handler });
    });

    return () => {
      handlers.forEach(({ question, handler }) => {
        question.removeEventListener("click", handler);
      });
    };
  }, []);

  return (
    <>
      <style jsx global>{`
:root {
      --text: #202124;
      --secondary: #5f6368;
      --muted: #80868b;
      --border: #dadce0;
      --border-light: #e8eaed;
      --link: #1a73e8;
      --link-hover: #174ea6;
      --background: #ffffff;
      --surface: #ffffff;
      --surface-subtle: #f8f9fa;
      --black: #202124;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      background: var(--background);
      color: var(--text);
      font-family: "Google Sans Text", "Google Sans", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    a {
      color: var(--link);
      text-decoration: none;
    }

    a:hover {
      color: var(--link-hover);
      text-decoration: underline;
    }

    strong {
      font-weight: 600;
    }

    /* ------------------------------------------------------------
       TOP NAVIGATION
    ------------------------------------------------------------ */

    .topbar {
      position: static;
      min-height: 64px;
      background: #fff;
      border-bottom: 1px solid var(--border);
      padding: 16px 32px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .topbar-logo {
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: var(--text);
      letter-spacing: -0.1px;
      white-space: nowrap;
    }

    .topbar-badge {
      font-family: "Google Sans Text", Arial, sans-serif;
      font-size: 14px;
      color: var(--secondary);
      white-space: nowrap;
    }

    .topbar-right {
      margin-left: auto;
      display: flex;
      gap: 22px;
      align-items: center;
    }

    .topbar-right a {
      font-size: 14px;
      font-weight: 500;
      color: var(--link);
      white-space: nowrap;
    }

    /* ------------------------------------------------------------
       MAIN DOCUMENT
    ------------------------------------------------------------ */

    .layout {
      display: block;
    }

    .main {
      max-width: 820px;
      margin: 0 auto;
      padding: 72px 28px 80px;
    }

    /* ------------------------------------------------------------
       HERO
    ------------------------------------------------------------ */

    .hero {
      background: transparent;
      border: 0;
      padding: 0;
      margin-bottom: 60px;
    }

    .hero-eyebrow {
      color: var(--secondary);
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      letter-spacing: 0.1px;
    }

    .hero h1 {
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 44px;
      line-height: 1.16;
      font-weight: 500;
      letter-spacing: -1px;
      color: var(--text);
      margin: 0 0 18px;
    }

    .hero p {
      color: var(--secondary);
      font-size: 17px;
      line-height: 1.65;
      max-width: 720px;
      margin: 0 0 24px;
    }

    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 22px;
      color: var(--secondary);
      font-size: 14px;
    }

    .hero-meta-item {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .hero-meta-item::before {
      content: "";
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #5f6368;
      display: inline-block;
    }

    /* ------------------------------------------------------------
       LEGAL REFERENCES
    ------------------------------------------------------------ */

    .legal-links {
      margin: 0 0 60px;
      padding: 24px 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .legal-links h2 {
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 20px;
      line-height: 1.4;
      font-weight: 500;
      margin: 0 0 10px;
    }

    .legal-links p {
      color: var(--secondary);
      font-size: 14px;
      margin: 0 0 14px;
    }

    .legal-links a {
      display: inline-block;
      margin-right: 20px;
      margin-bottom: 5px;
      font-size: 14px;
      font-weight: 500;
    }

    /* ------------------------------------------------------------
       SECTIONS
    ------------------------------------------------------------ */

    .section {
      padding: 0 0 52px;
      margin: 0 0 52px;
      border-bottom: 1px solid var(--border);
      scroll-margin-top: 24px;
    }

    .section-header {
      display: flex;
      align-items: baseline;
      gap: 13px;
      margin-bottom: 18px;
    }

    .section-number {
      color: var(--secondary);
      font-size: 13px;
      font-weight: 500;
      min-width: 24px;
    }

    h2,
    h3 {
      font-family: "Google Sans", Arial, sans-serif;
      color: var(--text);
      font-weight: 500;
    }

    .section-header h2 {
      font-size: 24px;
      line-height: 1.35;
      letter-spacing: -0.2px;
      margin: 0;
    }

    h3 {
      font-size: 18px;
      line-height: 1.45;
      margin: 30px 0 10px;
    }

    p {
      margin: 0 0 18px;
    }

    ul,
    ol {
      padding-left: 25px;
      margin-top: 12px;
      margin-bottom: 22px;
    }

    li {
      margin: 8px 0;
    }

    /* ------------------------------------------------------------
       STEPS
    ------------------------------------------------------------ */

    .steps {
      margin: 24px 0;
    }

    .step {
      display: flex;
      gap: 16px;
      padding: 15px 0;
      border-bottom: 1px solid var(--border-light);
    }

    .step:last-child {
      border-bottom: 0;
    }

    .step-num {
      flex: 0 0 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border);
      border-radius: 50%;
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
    }

    .step-body {
      flex: 1;
    }

    /* ------------------------------------------------------------
       CALLOUTS
    ------------------------------------------------------------ */

    .callout {
      border: 1px solid var(--border);
      background: var(--surface-subtle);
      padding: 16px 18px;
      margin: 22px 0;
      font-size: 15px;
    }

    .callout.info {
      border-left: 3px solid #5f6368;
    }

    .callout.warning {
      border-left: 3px solid #202124;
    }

    .callout.danger {
      border-left: 3px solid #202124;
    }

    .callout-icon {
      display: none;
    }

    /* ------------------------------------------------------------
       TASK FLOW
    ------------------------------------------------------------ */

    .task-flow {
      margin: 25px 0;
    }

    .task-flow-step {
      display: flex;
      gap: 18px;
      padding: 20px 0;
      border-bottom: 1px solid var(--border-light);
    }

    .task-flow-step:last-child {
      border-bottom: 0;
    }

    .task-flow-icon {
      display: none;
    }

    .task-flow-body {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .task-flow-body strong {
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 16px;
      font-weight: 600;
    }

    .task-flow-body span {
      color: var(--secondary);
      font-size: 15px;
      line-height: 1.65;
    }

    /* ------------------------------------------------------------
       CORRECTION BOX
    ------------------------------------------------------------ */

    .correction-box {
      border: 1px solid var(--border);
      padding: 20px;
      margin: 25px 0;
      background: #fff;
    }

    .correction-box-title {
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 9px;
    }

    .correction-box p {
      margin-bottom: 0;
      color: var(--secondary);
    }

    /* ------------------------------------------------------------
       STATUS CARDS
    ------------------------------------------------------------ */

    .status-cards {
      display: grid;
      gap: 12px;
      margin: 24px 0;
    }

    .status-card {
      border: 1px solid var(--border);
      padding: 18px;
      background: #fff;
    }

    .status-card .badge {
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 9px;
    }

    .status-card p {
      color: var(--secondary);
      font-size: 15px;
      margin: 0;
    }

    /* ------------------------------------------------------------
       EARNINGS CARDS
    ------------------------------------------------------------ */

    .earnings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 25px 0;
    }

    .earning-card {
      border: 1px solid var(--border);
      padding: 20px;
      background: #fff;
    }

    .earning-card-label {
      color: var(--secondary);
      font-size: 13px;
      margin-bottom: 6px;
    }

    .earning-card-title {
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .earning-card-desc {
      color: var(--secondary);
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }

    /* ------------------------------------------------------------
       CHECKLIST
    ------------------------------------------------------------ */

    .checklist-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin: 24px 0;
    }

    .checklist-card {
      border: 1px solid var(--border);
      padding: 20px;
    }

    .checklist-card-title {
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 14px;
    }

    .checklist-item {
      display: flex;
      gap: 9px;
      margin: 10px 0;
      font-size: 14px;
      line-height: 1.55;
    }

    .check-icon {
      font-weight: 600;
      flex: 0 0 auto;
    }

    /* ------------------------------------------------------------
       DELAYS
    ------------------------------------------------------------ */

    .delay-list {
      margin: 25px 0;
      border-top: 1px solid var(--border-light);
    }

    .delay-item {
      padding: 13px 0;
      border-bottom: 1px solid var(--border-light);
      font-size: 15px;
    }

    .delay-dot {
      display: inline-block;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #5f6368;
      margin-right: 10px;
      vertical-align: middle;
    }

    /* ------------------------------------------------------------
       FAQ
    ------------------------------------------------------------ */

    .faq {
      margin-top: 24px;
    }

    .faq-item {
      border-bottom: 1px solid var(--border);
    }

    .faq-q {
      padding: 18px 0;
      cursor: pointer;
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: var(--text);
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }

    .faq-q:hover {
      color: var(--link);
    }

    .arrow {
      color: var(--secondary);
      font-size: 12px;
      transition: transform 0.2s ease;
    }

    .faq-item.open .arrow {
      transform: rotate(180deg);
    }

    .faq-a {
      display: none;
      padding: 0 0 19px;
      color: var(--secondary);
      font-size: 15px;
      line-height: 1.7;
    }

    .faq-item.open .faq-a {
      display: block;
    }

    /* ------------------------------------------------------------
       FOOTER
    ------------------------------------------------------------ */

    .doc-footer {
      max-width: 820px;
      margin: 0 auto;
      padding: 30px 28px 45px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
    }

    .doc-footer-left,
    .doc-footer-right {
      font-size: 13px;
      line-height: 1.7;
      color: var(--secondary);
    }

    .doc-footer-left strong {
      color: var(--text);
      font-weight: 600;
    }

    .doc-footer-right {
      text-align: right;
    }


    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 18px;
      list-style: none;
      margin: 0;
      padding: 0;
      align-items: center;
    }

    .footer-links li {
      margin: 0;
    }

    .footer-links a {
      font-size: 13px;
      color: var(--link);
      text-decoration: none;
    }

    .footer-links a:hover {
      color: var(--link-hover);
      text-decoration: underline;
    }

    @media (max-width: 760px) {
      .footer-links {
        width: 100%;
      }
    }

    /* ------------------------------------------------------------
       MOBILE
    ------------------------------------------------------------ */

    @media (max-width: 760px) {
      .topbar {
        padding: 15px 20px;
      }

      .topbar-badge {
        display: none;
      }

      .topbar-right {
        display: none;
      }

      .main {
        padding: 50px 20px 65px;
      }

      .hero h1 {
        font-size: 36px;
      }

      .hero p {
        font-size: 16px;
      }

      .earnings-grid,
      .checklist-grid {
        grid-template-columns: 1fr;
      }

      .doc-footer {
        padding-left: 20px;
        padding-right: 20px;
      }

      .doc-footer-right {
        text-align: left;
      }
    }

    @media (max-width: 480px) {
      .hero h1 {
        font-size: 32px;
      }

      .section-header h2 {
        font-size: 22px;
      }

      .hero-meta {
        flex-direction: column;
        gap: 8px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      html {
        scroll-behavior: auto;
      }

      .arrow {
        transition: none;
      }
    }
      `}</style>

<header className="topbar">
  <div className="topbar-logo">GWENO HUB</div>

  <div className="topbar-badge">
    Official User Guide &amp; Member Handbook
  </div>

  <nav className="topbar-right" aria-label="Legal and support links">
    <a href="https://swastaskhub.github.io/terms-/">
      Terms &amp; Conditions
    </a>

    <a href="https://swastaskhub.github.io/privacy/">
      Privacy Policy
    </a>

    <a href="https://swastaskhub.github.io/conduct/">
      Conduct Policy
    </a>
  </nav>
</header>


<div className="layout">

<main className="main">

  {/* ==========================================================
       HERO
  =========================================================== */}

  <div className="hero" id="hero">

    <div className="hero-eyebrow">
      Official Member Handbook
    </div>

    <h1>
      GWENO HUB<br />
      User Guide
    </h1>

    <p>
      This guide explains how to create and manage your GWENO Hub account,
      activate your membership, access available tasks, submit completed
      assignments, monitor review results, manage earnings, and request
      withdrawals. Read this guide carefully before using the platform.
    </p>

    <div className="hero-meta">

      <div className="hero-meta-item">
        Version 1.0
      </div>

      <div className="hero-meta-item">
        16 Sections
      </div>

      <div className="hero-meta-item">
        All Member Types
      </div>

    </div>

  </div>


  {/* ==========================================================
       LEGAL REFERENCES
  =========================================================== */}

  <div className="legal-links" id="legal-references">

    <h2>
      Related Policies &amp; Legal Documents
    </h2>

    <p>
      This User Guide should be read together with the official GWENO Hub
      policies below. These documents explain the rules governing account
      use, privacy, member responsibilities, acceptable conduct, suspension,
      and other important platform requirements.
    </p>

    <a href="https://swastaskhub.github.io/terms-/">
      Terms &amp; Conditions
    </a>

    <a href="https://swastaskhub.github.io/privacy/">
      Privacy Policy
    </a>

    <a href="https://swastaskhub.github.io/conduct/">
      Customer Conduct &amp; Suspension Policy
    </a>

  </div>


  {/* ==========================================================
       01 GETTING STARTED
  =========================================================== */}

  <section className="section" id="getting-started">

    <div className="section-header">
      <span className="section-number">01</span>
      <h2>Getting Started</h2>
    </div>

    <p>
      Joining GWENO Hub begins with creating a member account. Registration
      should be completed using accurate information that belongs to you.
      Your account information may be used for account management,
      communication, verification, task participation, and payment
      processing.
    </p>

    <p>
      Take your time when completing the registration form. Incorrect
      information can make it difficult to access your account, receive
      important communications, complete verification, or process a
      withdrawal request.
    </p>

    <div className="steps">

      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          Visit the official GWENO Hub platform and select
          <strong>Register</strong>.
        </div>
      </div>

      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          Complete every required field. Make sure your information is
          accurate before continuing.
        </div>
      </div>

      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          Create a secure username and password. Do not use a password that
          you have already shared with another person.
        </div>
      </div>

      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          Carefully review your information and submit the registration form.
        </div>
      </div>

      <div className="step">
        <div className="step-num">5</div>
        <div className="step-body">
          Sign in using your new credentials and review your member
          dashboard.
        </div>
      </div>

    </div>

    <p>
      Depending on the registration process presented on the platform, you
      may be asked to provide:
    </p>

    <ul>
      <li>Full legal name</li>
      <li>Email address</li>
      <li>Mobile phone number</li>
      <li>Country of residence</li>
      <li>Username</li>
      <li>Password</li>
      <li>Other information required for account verification</li>
    </ul>

    <div className="callout info">
      Members are responsible for ensuring that the information associated
      with their account remains accurate and up to date. If your contact
      or payment information changes, update it through the official
      account settings or support process.
    </div>

  </section>


  {/* ==========================================================
       02 ACCOUNT ACTIVATION
  =========================================================== */}

  <section className="section" id="activation">

    <div className="section-header">
      <span className="section-number">02</span>
      <h2>Account Activation</h2>
    </div>

    <p>
      Some GWENO Hub features may require account activation before they
      become available. Activation confirms that the required activation
      process has been completed and verified.
    </p>

    <p>
      Members should only complete activation through the official platform
      and approved payment channels displayed within their account. Do not
      send activation payments to individuals or payment channels that are
      not officially provided by GWENO Hub.
    </p>

    <div className="steps">

      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          Sign in to your GWENO Hub account and open the
          <strong>Account Activation</strong> section.
        </div>
      </div>

      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          Read the activation instructions displayed on your account.
        </div>
      </div>

      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          Complete the required activation payment of
          <strong>USD 5</strong> using an approved payment method.
        </div>
      </div>

      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          Allow the payment to be verified. Your account status should
          update to <strong>Active</strong> after successful confirmation.
        </div>
      </div>

    </div>

    <p>
      Depending on the current platform configuration, an activated member
      may gain access to task participation, earning features, withdrawal
      functionality, dashboard features, and additional member resources.
    </p>

    <div className="callout warning">
      Complete activation payments only through official GWENO Hub payment
      channels. Keep your payment confirmation or transaction reference
      until the activation has been successfully reflected on your account.
    </div>

    <div className="callout danger">
      Members cannot withdraw earnings until the account activation
      requirements have been successfully completed and verified.
    </div>

  </section>


  {/* ==========================================================
       03 PREMIUM
  =========================================================== */}

  <section className="section" id="premium">

    <div className="section-header">
      <span className="section-number">03</span>
      <h2>Premium Membership</h2>
    </div>

    <p>
      Premium Membership is an optional account level that may provide
      access to additional tasks, higher-value assignments, expanded
      features, or other benefits made available by GWENO Hub.
    </p>

    <p>
      Premium availability, pricing, benefits, and subscription periods may
      change. Members should review the information displayed in the
      Premium section of their dashboard before completing an upgrade.
    </p>

    <div className="steps">

      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          Sign in and open the <strong>Premium Upgrade</strong> section.
        </div>
      </div>

      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          Review the available Premium package and its stated benefits.
        </div>
      </div>

      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          Complete the payment using an approved payment method.
        </div>
      </div>

      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          Wait for payment confirmation. The account should be upgraded
          automatically after successful verification.
        </div>
      </div>

    </div>

    <p>
      Premium members may receive access to higher-value assignments,
      priority opportunities, early access to selected tasks, expanded
      functionality, or other benefits specifically described in the
      applicable Premium package.
    </p>

    <div className="callout info">
      Premium benefits may operate for a defined subscription period.
      Review your package information and renewal date so that you understand
      when your Premium access begins and ends.
    </div>

  </section>


  {/* ==========================================================
       04 DASHBOARD
  =========================================================== */}

  <section className="section" id="dashboard">

    <div className="section-header">
      <span className="section-number">04</span>
      <h2>Dashboard Overview</h2>
    </div>

    <p>
      Your Member Dashboard is the primary place where you manage your
      GWENO Hub account. The exact layout may vary depending on your account
      type and the features currently available to you.
    </p>

    <p>
      The dashboard may contain several important areas, including:
    </p>

    <ul>
      <li>Account Overview</li>
      <li>Task Center</li>
      <li>Earnings Summary</li>
      <li>Available Balance</li>
      <li>Pending Earnings</li>
      <li>Premium Management</li>
      <li>Withdrawal Requests</li>
      <li>Notifications</li>
      <li>Account Settings</li>
      <li>Support or Help Resources</li>
    </ul>

    <p>
      Review your dashboard regularly. Important changes to task status,
      account status, available earnings, verification, and withdrawal
      requests may be reflected through your dashboard.
    </p>

    <div className="callout info">
      Dashboard information and email communications should be checked
      regularly. Some task reviews, correction requests, and withdrawal
      instructions may be communicated through your registered email.
    </div>

  </section>


  {/* ==========================================================
       05 TASKS
  =========================================================== */}

  <section className="section" id="tasks">

    <div className="section-header">
      <span className="section-number">05</span>
      <h2>Completing Tasks</h2>
    </div>

    <p>
      GWENO Hub may provide different types of assignments depending on
      available opportunities. Examples can include writing tasks, email
      replies, research activities, review questionnaires, information
      analysis, and other digital assignments.
    </p>

    <p>
      Every task includes instructions that explain what is expected.
      Read the complete task description before beginning your work. Do not
      assume that an assignment follows the same requirements as a previous
      task.
    </p>

    <div className="steps">

      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          Open the <strong>Task Center</strong> from your dashboard and
          review the available assignment.
        </div>
      </div>

      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          Select the task and choose <strong>View</strong> to read the full
          task brief, requirements, format, and submission instructions.
        </div>
      </div>

      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          Complete the assignment carefully according to the instructions.
          Depending on the task, this may involve writing, research,
          answering questions, completing a questionnaire, or preparing an
          email response.
        </div>
      </div>

      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          When the work is complete, select <strong>Submit</strong> from
          your dashboard.
        </div>
      </div>

      <div className="step">
        <div className="step-num">5</div>
        <div className="step-body">
          Follow the displayed submission instructions and send the completed
          work to the designated email address.
        </div>
      </div>

    </div>

    <div className="callout danger">
      Images are not accepted as task submissions. Submit your work as
      typed text in the email body or as an appropriate document attachment.
      Screenshots and photographs of completed work should not be used as
      the primary submission format.
    </div>

    <h3>Task Quality Standards</h3>

    <p>
      Good submissions should be complete, accurate, readable, and directly
      responsive to the assignment. Before submitting, compare your work
      against every requirement in the task description.
    </p>

    <ul>
      <li>Follow the task instructions precisely.</li>
      <li>Answer every required question.</li>
      <li>Check spelling, grammar, and formatting.</li>
      <li>Do not intentionally submit duplicate work.</li>
      <li>Complete the assignment within the stated timeframe.</li>
      <li>Use the required document or text format.</li>
      <li>Do not submit photographs or screenshots instead of typed work.</li>
    </ul>

    <div className="callout info">
      Only one task can be worked on at a time. After submitting a task,
      wait for the review outcome before beginning another task when the
      platform places your account in a review state.
    </div>

  </section>


  {/* ==========================================================
       06 SUBMISSION
  =========================================================== */}

  <section className="section" id="submission">

    <div className="section-header">
      <span className="section-number">06</span>
      <h2>Submitting Your Work</h2>
    </div>

    <p>
      Correct submission is an important part of the task process. A
      completed assignment must be delivered using the submission method
      specified by GWENO Hub. Follow the instructions displayed on your
      dashboard rather than using an unrelated email address.
    </p>

    <div className="task-flow">

      <div className="task-flow-step">
        <div className="task-flow-body">
          <strong>Complete the Task</strong>
          <span>
            Finish the assignment in full and check that all requirements
            have been satisfied before preparing your submission.
          </span>
        </div>
      </div>

      <div className="task-flow-step">
        <div className="task-flow-body">
          <strong>Click Submit on Your Dashboard</strong>
          <span>
            Open the task and select the Submit option. The platform will
            direct you toward the designated submission process.
          </span>
        </div>
      </div>

      <div className="task-flow-step">
        <div className="task-flow-body">
          <strong>Send Your Work by Email</strong>
          <span>
            Send the completed assignment to the email address shown by the
            platform. You may paste the content into the email body or attach
            it as an accepted document.
          </span>
        </div>
      </div>

      <div className="task-flow-step">
        <div className="task-flow-body">
          <strong>Wait for Review</strong>
          <span>
            Review typically takes approximately 30 minutes to 1 hour after
            the submission is received. Processing times may vary depending
            on workload and verification requirements.
          </span>
        </div>
      </div>

      <div className="task-flow-step">
        <div className="task-flow-body">
          <strong>Receive Your Review Outcome</strong>
          <span>
            The review outcome may be sent to your registered email. An
            approved submission may proceed toward earnings and withdrawal,
            while a submission requiring corrections may be returned with
            instructions.
          </span>
        </div>
      </div>

    </div>

    <div className="correction-box">

      <div className="correction-box-title">
        If Corrections Are Required
      </div>

      <p>
        If your submission does not satisfy the required standard, you may
        receive correction instructions by email. Read the feedback carefully
        and identify every item that needs to be changed. Correct the work
        completely before resubmitting it to the specified email address.
        The corrected submission will then go through the applicable review
        process again.
      </p>

    </div>

    <div className="callout warning">
      Monitor your registered email after every submission. Review results,
      correction instructions, and other important task communications may
      be sent directly to that address.
    </div>

  </section>


  {/* ==========================================================
       07 REVIEW
  =========================================================== */}

  <section className="section" id="review">

    <div className="section-header">
      <span className="section-number">07</span>
      <h2>Task Review &amp; Verification</h2>
    </div>

    <p>
      Submitted tasks are reviewed before earnings are awarded. The review
      process helps determine whether the submitted work satisfies the
      instructions and applicable eligibility requirements.
    </p>

    <p>
      Reviewers may consider accuracy, completeness, compliance with the
      task instructions, content quality, formatting, and other requirements
      relevant to the assignment.
    </p>

    <div className="status-cards">

      <div className="status-card approved">
        <div className="badge">Approved</div>
        <p>
          Your submission has met the applicable requirements. You may
          receive an email explaining the next step, including withdrawal
          instructions where applicable.
        </p>
      </div>

      <div className="status-card rejected">
        <div className="badge">Needs Correction</div>
        <p>
          Your submission has been returned with instructions explaining what
          needs to be corrected. Make the requested changes and resubmit.
        </p>
      </div>

      <div className="status-card pending">
        <div className="badge">Under Review</div>
        <p>
          Your submission has been received and is currently being assessed.
          Review commonly takes approximately 30 to 60 minutes, although
          processing time can vary.
        </p>
      </div>

    </div>

    <div className="callout info">
      Review outcomes may be communicated through email. Keep your registered
      email account active and accessible so that you do not miss important
      task communications.
    </div>

  </section>


  {/* ==========================================================
       08 EARNINGS
  =========================================================== */}

  <section className="section" id="earnings">

    <div className="section-header">
      <span className="section-number">08</span>
      <h2>Earnings &amp; Account Balance</h2>
    </div>

    <p>
      Earnings are associated with successfully completed and approved
      platform activities. Your dashboard may display different balance
      categories so that you can distinguish between earnings that are
      available and amounts that are still being reviewed.
    </p>

    <div className="earnings-grid">

      <div className="earning-card">
        <div className="earning-card-label">Balance</div>
        <div className="earning-card-title">
          Available Balance
        </div>
        <p className="earning-card-desc">
          Funds that have been approved and are currently eligible for
          withdrawal, subject to applicable account requirements.
        </p>
      </div>

      <div className="earning-card">
        <div className="earning-card-label">Pending</div>
        <div className="earning-card-title">
          Pending Earnings
        </div>
        <p className="earning-card-desc">
          Earnings associated with activities that are still waiting for
          review or confirmation.
        </p>
      </div>

      <div className="earning-card">
        <div className="earning-card-label">Summary</div>
        <div className="earning-card-title">
          Total Earnings
        </div>
        <p className="earning-card-desc">
          The combined amount associated with eligible platform activity
          recorded on your account.
        </p>
      </div>

      <div className="earning-card">
        <div className="earning-card-label">Activity</div>
        <div className="earning-card-title">
          Completed Tasks
        </div>
        <p className="earning-card-desc">
          A record or count of assignments that have been successfully
          completed and processed.
        </p>
      </div>

    </div>

    <p>
      Always confirm that an amount is shown as available before attempting
      to withdraw it. A pending amount should not be treated as immediately
      withdrawable until the applicable review process has been completed.
    </p>

  </section>


  {/* ==========================================================
       09 WITHDRAWAL
  =========================================================== */}

  <section className="section" id="withdrawal">

    <div className="section-header">
      <span className="section-number">09</span>
      <h2>Withdrawal Process</h2>
    </div>

    <p>
      Withdrawals become available when the applicable account and task
      requirements have been satisfied. Following approval, you may receive
      an email prompting you to initiate the withdrawal process.
    </p>

    <p>
      Before submitting a withdrawal request, confirm that your account is
      active, your task has been approved, and the amount you want to
      withdraw is reflected in your available balance.
    </p>

    <ul>
      <li>Your account is active.</li>
      <li>Your task has received an approval outcome.</li>
      <li>Your earnings are available for withdrawal.</li>
      <li>Your registered phone number is accurate.</li>
      <li>Your National ID information is accurate where required.</li>
      <li>Your payment information belongs to you.</li>
    </ul>

    <div className="steps">

      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <strong>Receive Approval</strong> — Wait until your submitted task
          has been reviewed and approved.
        </div>
      </div>

      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <strong>Open Withdrawals</strong> — Access the Withdraw section
          from your dashboard.
        </div>
      </div>

      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <strong>Enter Required Information</strong> — Provide the
          registered phone number, National ID information where requested,
          and withdrawal amount.
        </div>
      </div>

      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <strong>Review Your Details</strong> — Carefully confirm that the
          information belongs to you and matches the account information.
        </div>
      </div>

      <div className="step">
        <div className="step-num">5</div>
        <div className="step-body">
          <strong>Submit the Request</strong> — Submit your withdrawal after
          confirming that all information is correct.
        </div>
      </div>

    </div>

    <div className="callout warning">
      Your payment information must belong to you and correspond with the
      identity information associated with your account. Incorrect or
      mismatched information can delay verification or prevent a payout from
      being processed.
    </div>

  </section>


  {/* ==========================================================
       09B INTERNATIONAL
  =========================================================== */}

  <section className="section" id="withdrawal-international">

    <div className="section-header">
      <span className="section-number">09b</span>
      <h2>Withdrawal &amp; International Clients</h2>
    </div>

    <p>
      Members outside Kenya who do not have access to M-Pesa may be able to
      withdraw through <strong>Bank Transfer (Wire)</strong>, where this
      option is available on their dashboard.
    </p>

    <p>
      International members should provide complete and accurate banking
      information. Bank transfers can involve additional processing time
      because transactions may pass through multiple financial institutions
      and international clearing systems.
    </p>

    <div className="steps">

      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <strong>Open the Sidebar</strong> — Access the dashboard sidebar
          and locate the withdrawal section.
        </div>
      </div>

      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <strong>Select Bank Transfer</strong> — Choose
          <strong>Bank Transfer (Wire)</strong> where the option is
          available.
        </div>
      </div>

      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <strong>Enter Bank Details</strong> — Provide the account name,
          account number, bank name, SWIFT/BIC code, and country.
        </div>
      </div>

      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <strong>Enter the Amount</strong> — Confirm that the withdrawal
          amount does not exceed your available balance.
        </div>
      </div>

      <div className="step">
        <div className="step-num">5</div>
        <div className="step-body">
          <strong>Submit</strong> — Review all banking information before
          submitting the withdrawal request.
        </div>
      </div>

    </div>

    <div className="callout info">
      International bank transfers may take longer than local M-Pesa
      payments because of bank processing and clearing procedures.
    </div>

    <div className="callout warning">
      The bank account name must correspond with the name registered on your
      GWENO Hub account. Third-party or mismatched payment information may
      not be accepted.
    </div>

  </section>


  {/* ==========================================================
       10 VERIFICATION
  =========================================================== */}

  <section className="section" id="verification">

    <div className="section-header">
      <span className="section-number">10</span>
      <h2>Withdrawal Verification</h2>
    </div>

    <p>
      Withdrawal requests may undergo verification before payment is
      released. Verification is intended to confirm that the request is
      associated with an eligible account and that the requested amount and
      payment information are consistent with the account records.
    </p>

    <p>
      Verification may include:
    </p>

    <ul>
      <li>Account validation</li>
      <li>Balance confirmation</li>
      <li>Identity checks where applicable</li>
      <li>Payment information verification</li>
      <li>Compliance checks</li>
      <li>Review of account activity where required</li>
    </ul>

    <p>
      If additional information is required, follow the instructions
      provided through the official platform or official support channels.
      Do not provide sensitive account information to individuals claiming
      to represent GWENO Hub through unofficial channels.
    </p>

  </section>


  {/* ==========================================================
       11 GUIDELINES
  =========================================================== */}

  <section className="section" id="guidelines">

    <div className="section-header">
      <span className="section-number">11</span>
      <h2>Withdrawal Guidelines</h2>
    </div>

    <p>
      Following the withdrawal guidelines helps reduce errors and
      unnecessary processing delays. Always review your information before
      submitting a request.
    </p>

    <div className="checklist-grid">

      <div className="checklist-card do">

        <div className="checklist-card-title">
          Always Do
        </div>

        <div className="checklist-item">
          <span className="check-icon">+</span>
          Use accurate personal information.
        </div>

        <div className="checklist-item">
          <span className="check-icon">+</span>
          Submit withdrawal requests only when eligible.
        </div>

        <div className="checklist-item">
          <span className="check-icon">+</span>
          Keep your account information current.
        </div>

        <div className="checklist-item">
          <span className="check-icon">+</span>
          Confirm your available balance.
        </div>

        <div className="checklist-item">
          <span className="check-icon">+</span>
          Review payment information before submitting.
        </div>

      </div>


      <div className="checklist-card dont">

        <div className="checklist-card-title">
          Never Do
        </div>

        <div className="checklist-item">
          <span className="check-icon">−</span>
          Submit inaccurate payment information.
        </div>

        <div className="checklist-item">
          <span className="check-icon">−</span>
          Request more than your available balance.
        </div>

        <div className="checklist-item">
          <span className="check-icon">−</span>
          Attempt withdrawals before task approval.
        </div>

        <div className="checklist-item">
          <span className="check-icon">−</span>
          Use unauthorized payment information.
        </div>

        <div className="checklist-item">
          <span className="check-icon">−</span>
          Provide misleading information during verification.
        </div>

      </div>

    </div>

    <div className="callout danger">
      Failure to comply with withdrawal requirements may result in delayed
      processing, additional verification, or an account review.
    </div>

  </section>


  {/* ==========================================================
       12 DELAYS
  =========================================================== */}

  <section className="section" id="delays">

    <div className="section-header">
      <span className="section-number">12</span>
      <h2>Common Causes of Withdrawal Delays</h2>
    </div>

    <p>
      A withdrawal may take longer than expected for several reasons.
      Before contacting support, review the status of your task, account,
      balance, and payment information.
    </p>

    <div className="delay-list">

      <div className="delay-item">
        <span className="delay-dot"></span>
        Incorrect payment details.
      </div>

      <div className="delay-item">
        <span className="delay-dot"></span>
        Incomplete verification information.
      </div>

      <div className="delay-item">
        <span className="delay-dot"></span>
        Task submission still under review.
      </div>

      <div className="delay-item">
        <span className="delay-dot"></span>
        Correction request has not yet been completed.
      </div>

      <div className="delay-item">
        <span className="delay-dot"></span>
        Insufficient available balance.
      </div>

      <div className="delay-item">
        <span className="delay-dot"></span>
        Account security or compliance review.
      </div>

      <div className="delay-item">
        <span className="delay-dot"></span>
        Expired Premium benefits where applicable.
      </div>

      <div className="delay-item">
        <span className="delay-dot"></span>
        Temporary payment processing interruptions.
      </div>

      <div className="delay-item">
        <span className="delay-dot"></span>
        Incorrect bank details for international transfers.
      </div>

    </div>

    <div className="callout info">
      Check your dashboard and registered email regularly for updates.
      If the platform requests additional information, provide it through
      the official process as soon as reasonably possible.
    </div>

  </section>


  {/* ==========================================================
       13 SECURITY
  =========================================================== */}

  <section className="section" id="security">

    <div className="section-header">
      <span className="section-number">13</span>
      <h2>Account Security</h2>
    </div>

    <p>
      Protecting your account is a shared responsibility. GWENO Hub may
      provide security features, but members must also take reasonable
      precautions to protect passwords, devices, email accounts, and other
      account credentials.
    </p>

    <ul>
      <li>Create a strong and unique password.</li>
      <li>Never share your password with another person.</li>
      <li>Do not reuse your GWENO Hub password on unrelated services.</li>
      <li>Use security features provided by the platform when available.</li>
      <li>Avoid signing in on public or shared devices when possible.</li>
      <li>Log out after using a shared computer.</li>
      <li>Keep your email account secure.</li>
      <li>Review your account activity regularly.</li>
      <li>Keep your contact information current.</li>
    </ul>

    <p>
      Be cautious of messages requesting passwords, payment information,
      verification codes, or other sensitive information. Official
      communications should be handled through the platform's established
      channels.
    </p>

    <div className="callout danger">
      If you notice suspicious activity, unauthorized account access, or
      unusual communications relating to your account, report the matter
      immediately through an official GWENO Hub support channel.
    </div>

  </section>


  {/* ==========================================================
       14 POLICIES
  =========================================================== */}

  <section className="section" id="policies">

    <div className="section-header">
      <span className="section-number">14</span>
      <h2>Platform Policies</h2>
    </div>

    <p>
      Use of GWENO Hub is subject to the platform's applicable policies.
      Members are expected to understand and follow those requirements
      while using the service.
    </p>

    <p>
      By using the platform, members agree to follow applicable
      requirements, including:
    </p>

    <ul>
      <li>Providing accurate account information.</li>
      <li>Following task instructions.</li>
      <li>Submitting original and appropriate work.</li>
      <li>Using the platform responsibly.</li>
      <li>Respecting other members and support personnel.</li>
      <li>Following withdrawal and payment requirements.</li>
      <li>Complying with applicable platform policies.</li>
    </ul>

    <p>
      Members should read the full Terms &amp; Conditions, Privacy Policy,
      and Customer Conduct &amp; Suspension Policy rather than relying
      solely on this User Guide.
    </p>

    <div className="callout warning">
      Violations of platform rules may result in restrictions, suspension,
      additional review, or permanent account termination depending on the
      nature and seriousness of the violation.
    </div>

  </section>


  {/* ==========================================================
       15 SUPPORT
  =========================================================== */}

  <section className="section" id="support">

    <div className="section-header">
      <span className="section-number">15</span>
      <h2>Support &amp; Assistance</h2>
    </div>

    <p>
      GWENO Hub support is available for questions and issues related to
      your account and platform activity. Before contacting support, review
      your dashboard, registered email, task instructions, and relevant
      policy documents.
    </p>

    <p>
      Support may assist with topics such as:
    </p>

    <ul>
      <li>Account activation inquiries</li>
      <li>Premium membership questions</li>
      <li>Task submission questions</li>
      <li>Task review status</li>
      <li>Correction requests</li>
      <li>Withdrawal requests</li>
      <li>Payment processing questions</li>
      <li>Login and account access issues</li>
      <li>Technical difficulties</li>
    </ul>

    <p>
      When contacting support, provide enough information for the team to
      understand your issue. Avoid sending unnecessary sensitive information
      unless it is specifically requested through an official and secure
      verification process.
    </p>

    <div className="callout info">
      Use only the official support channels displayed by GWENO Hub. Do not
      rely on unofficial individuals or third parties claiming to provide
      customer support.
    </div>

    <div className="callout danger">
      Members are expected to communicate respectfully with customer care.
      Abusive, threatening, discriminatory, or seriously disrespectful
      communication may result in account action under the Customer Conduct
      &amp; Suspension Policy.
      <a href="https://swastaskhub.github.io/conduct/">
        Read the Customer Conduct &amp; Suspension Policy.
      </a>
    </div>

  </section>


  {/* ==========================================================
       16 FAQ
  =========================================================== */}

  <section className="section" id="faq">

    <div className="section-header">
      <span className="section-number">16</span>
      <h2>Frequently Asked Questions</h2>
    </div>


    <div className="faq">

      <div className="faq-item">

        <div className="faq-q">
          How do I submit my completed task?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          Once you have completed your assignment, open the task on your
          dashboard and select the Submit option. Follow the displayed
          instructions and send the completed work to the designated email
          address. You may paste typed content into the email body or attach
          it as an accepted document. Images and screenshots are not accepted
          as task submissions.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          How long does the review take?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          Task review typically takes approximately 30 minutes to 1 hour
          after the completed work has been received. Actual processing time
          may vary depending on workload, task complexity, verification
          requirements, and other operational factors. Monitor your
          registered email for the review result.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          What happens if my work is returned for corrections?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          You will receive correction instructions explaining what needs to
          be changed. Read the instructions carefully, make all required
          corrections, and resubmit the completed work through the specified
          submission method. The corrected work will be reviewed again.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          When can I withdraw my earnings?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          Withdrawals become available after the applicable account
          requirements have been satisfied and the relevant task has been
          reviewed and approved. Your available balance should reflect the
          amount eligible for withdrawal. Follow the withdrawal instructions
          displayed on your dashboard.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          Can I send my work as a photo or screenshot?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          No. GWENO Hub task submissions should be provided as typed text or
          an accepted document attachment. Photographs, screenshots, and
          other image-based representations of completed work are not
          accepted as the required submission format.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          How do I upgrade to Premium?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          Open the Premium section within your dashboard. Review the
          available package, benefits, price, and applicable subscription
          conditions. If you decide to proceed, complete payment through the
          approved payment method displayed by the platform. Your Premium
          status should update after successful payment confirmation.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          I am an international client without M-Pesa. How do I withdraw?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          International members who do not have M-Pesa may be able to use
          Bank Transfer (Wire) where that option is available on their
          dashboard. Select the withdrawal option and provide the requested
          bank account name, account number, bank name, SWIFT/BIC code, and
          country. Banking information must be accurate and correspond with
          the account holder's registered information.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          Can I use someone else's payment details?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          No. Payment information used for a withdrawal must belong to the
          account holder and satisfy the platform's verification
          requirements. Using another person's phone number, bank account,
          identification information, or other payment details can cause the
          withdrawal to be rejected or delayed.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          How do I know my account is activated?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          Your dashboard account status should display the applicable
          activation status after successful verification. If your account
          continues to show as inactive after completing the activation
          process, first confirm that your payment was successfully
          processed. If the issue remains, contact support through an
          official channel.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          What should I do if my withdrawal is delayed?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          First check your dashboard and registered email for status
          information. Confirm that your task has been approved, your
          available balance is sufficient, and your payment details are
          correct. If the withdrawal remains unresolved after checking these
          items, contact official support and provide the relevant
          transaction or request information.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          What documents should I use when submitting work?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          Follow the specific instructions provided with the task. Where a
          document is required, use an accepted typed document format such as
          PDF or Word where permitted. If the task allows text directly in
          the email, you may paste the completed content into the email body.
          Do not submit photographs or screenshots unless a particular task
          explicitly states otherwise.
        </div>

      </div>


      <div className="faq-item">

        <div className="faq-q">
          Why is accurate account information important?
          <span className="arrow">▼</span>
        </div>

        <div className="faq-a">
          Accurate information helps maintain reliable communication,
          account verification, task administration, and payment processing.
          Incorrect names, phone numbers, identification details, email
          addresses, or bank information can cause verification problems or
          delay account services.
        </div>

      </div>

    </div>

  </section>


</main>
</div>


{/* ==========================================================
     FOOTER
=========================================================== */}

<footer className="doc-footer">
  <div className="doc-footer-left">
    <strong>GWENO Hub</strong>
    — Official User Guide &amp; Member Handbook
  </div>

  <ul className="footer-links">
    <li>
      <a href="/manual">Help Center</a>
    </li>

    <li>
      <a href="/terms">Terms of Service</a>
    </li>

    <li>
      <a href="/conduct">Conduct and Policies</a>
    </li>

    <li>
      <a href="/privacy">Privacy Policy</a>
    </li>

    <li>
      <a href="mailto:businesshub.comke@gmail.com">
        businesshub.comke@gmail.com
      </a>
    </li>
  </ul>
</footer>



    </>
  );
}
