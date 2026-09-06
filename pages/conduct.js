import Head from "next/head";

export default function ConductPage() {
  return (
    <>
      <Head>
        <title>Customer Conduct & Suspension Policy | GWENO Hub</title>
      </Head>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <style jsx global>{`
        :root {
          --text: #202124;
          --secondary: #5f6368;
          --border: #dadce0;
          --link: #1a73e8;
          --background: #ffffff;
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        body {
          margin: 0;
          background: var(--background);
          color: var(--text);
          font-family: "Roboto", Arial, sans-serif;
          font-size: 16px;
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
        }

        header {
          border-bottom: 1px solid var(--border);
          padding: 18px 32px;
        }

        .brand {
          max-width: 960px;
          margin: 0 auto;
          font-family: "Google Sans", Arial, sans-serif;
          font-size: 20px;
          font-weight: 500;
        }

        .legal-nav {
          border-bottom: 1px solid var(--border);
          padding: 14px 24px;
        }

        .legal-nav-inner {
          max-width: 760px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          font-size: 14px;
        }

        main {
          max-width: 760px;
          margin: 0 auto;
          padding: 72px 24px 80px;
        }

        h1 {
          font-family: "Google Sans", Arial, sans-serif;
          font-size: 40px;
          line-height: 1.2;
          font-weight: 500;
          margin: 0 0 12px;
        }

        h2 {
          font-family: "Google Sans", Arial, sans-serif;
          font-size: 22px;
          font-weight: 500;
          line-height: 1.35;
          margin: 42px 0 16px;
        }

        h3 {
          font-family: "Google Sans", Arial, sans-serif;
          font-size: 18px;
          font-weight: 500;
          margin: 28px 0 12px;
        }

        .updated {
          color: var(--secondary);
          font-size: 14px;
          margin-bottom: 48px;
        }

        p { margin: 0 0 18px; }

        ul, ol {
          margin: 0 0 20px;
          padding-left: 24px;
        }

        li { margin-bottom: 8px; }

        a {
          color: var(--link);
          text-decoration: none;
        }

        a:hover { text-decoration: underline; }

        .notice {
          border-left: 3px solid var(--border);
          padding: 14px 18px;
          background: #fafafa;
          color: var(--secondary);
          margin: 24px 0;
        }

        footer {
          max-width: 760px;
          margin: 0 auto;
          padding: 32px 24px 48px;
          border-top: 1px solid var(--border);
          color: var(--secondary);
          font-size: 14px;
        }

        footer p { margin-bottom: 8px; }

        .footer-links {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          margin: 14px 0;
          padding: 0;
        }

        .footer-links li { margin: 0; }

        @media (max-width: 600px) {
          header { padding: 16px 20px; }
          main { padding: 48px 20px 60px; }
          h1 { font-size: 32px; }
          h2 { font-size: 20px; margin-top: 36px; }
          body { font-size: 15px; }
          .legal-nav { padding: 12px 20px; }
        }
      `}</style>

      <header>
        <div className="brand">GWENO HUB</div>
      </header>

      <nav className="legal-nav" aria-label="Legal navigation">
        <div className="legal-nav-inner">
          <a href="/terms">Terms &amp; Conditions</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/conduct">Conduct Policy</a>
          <a href="mailto:businesshub.comke@gmail.com">Support</a>
        </div>
      </nav>

      <main>
        <h1>Customer Conduct &amp; Suspension Policy</h1>
        <p className="updated">Last updated: August 30, 2026</p>

        <p>GWENO Hub is committed to maintaining a professional, safe, secure, fair, and respectful environment for users, customer care representatives, technical personnel, task providers, payment partners, and other individuals involved in operating or using the platform.</p>

        <p>This Customer Conduct &amp; Suspension Policy explains the standards expected from users and the actions GWENO Hub may take when users engage in fraudulent, abusive, unlawful, manipulative, disruptive, or otherwise prohibited conduct.</p>

        <p>This Policy should be read together with the <a href="/terms">GWENO Hub Terms &amp; Conditions</a> and <a href="/privacy">GWENO Hub Privacy Policy</a>.</p>

        <h2>1. Expected Customer Conduct</h2>
        <p>Users are expected to communicate and interact with GWENO Hub honestly, responsibly, and respectfully.</p>
        <ul>
          <li>Communicate respectfully with customer care and other users.</li>
          <li>Provide accurate and truthful information.</li>
          <li>Use only official GWENO Hub support channels.</li>
          <li>Allow reasonable time for support staff to investigate issues.</li>
          <li>Follow legitimate platform instructions.</li>
          <li>Complete tasks honestly and according to the applicable instructions.</li>
          <li>Maintain accurate account and profile information.</li>
          <li>Protect your account credentials and personal information.</li>
          <li>Use the platform only for lawful and legitimate purposes.</li>
        </ul>

        <h2>2. One Account Per User</h2>
        <p>Unless GWENO Hub expressly provides otherwise, each person is permitted to maintain only one personal GWENO Hub account.</p>
        <p>Users must not create, purchase, sell, rent, transfer, lend, or otherwise share GWENO Hub accounts.</p>
        <p>Users must not create an account on behalf of another person or allow another person to operate their account.</p>
        <p>Where GWENO Hub identifies multiple accounts that appear to be connected for the purpose of manipulating tasks, referrals, bonuses, withdrawals, verification, or other platform benefits, the related accounts may be reviewed and restricted.</p>

        <h2>3. Prohibited Account and Identity Practices</h2>
        <p>Users must provide genuine information belonging to themselves and must not attempt to misrepresent their identity or account information.</p>
        <p>Users must not:</p>
        <ul>
          <li>Use another person&apos;s identity.</li>
          <li>Impersonate another user.</li>
          <li>Use false or deliberately misleading personal information.</li>
          <li>Submit identification documents belonging to another person.</li>
          <li>Submit forged, altered, manipulated, or fraudulent documents.</li>
          <li>Misrepresent age, location, contact information, or other account details.</li>
          <li>Create an account using information that the user knows to be inaccurate.</li>
          <li>Attempt to bypass account verification requirements.</li>
        </ul>

        <h2>4. Honest Task Participation</h2>
        <p>Tasks available through GWENO Hub must be completed genuinely by the account holder.</p>
        <p>Users must not:</p>
        <ul>
          <li>Submit fabricated task results.</li>
          <li>Submit copied work while representing it as original work.</li>
          <li>Intentionally provide false information in surveys or tasks.</li>
          <li>Manipulate task results to obtain rewards.</li>
          <li>Complete the same task repeatedly by attempting to bypass platform controls.</li>
          <li>Use another person&apos;s account to complete tasks.</li>
          <li>Use automated tools to complete tasks where automation is prohibited.</li>
          <li>Use scripts, bots, or software to generate artificial activity.</li>
          <li>Attempt to obtain rewards for tasks that were not genuinely completed.</li>
        </ul>

        <h2>5. Fraud, Manipulation and Abuse</h2>
        <p>Any attempt to manipulate GWENO Hub systems, task allocation, referrals, bonuses, earnings, withdrawals, verification, or account controls is prohibited.</p>
        <p>Examples include:</p>
        <ul>
          <li>Creating multiple accounts to obtain additional rewards.</li>
          <li>Using another person&apos;s account to obtain benefits.</li>
          <li>Manipulating referral systems.</li>
          <li>Attempting to earn referral commissions from one&apos;s own activity.</li>
          <li>Using fraudulent payment or withdrawal information.</li>
          <li>Attempting to bypass withdrawal or verification controls.</li>
          <li>Submitting false information to qualify for tasks.</li>
          <li>Attempting to exploit technical errors for financial benefit.</li>
          <li>Attempting to obtain rewards through deliberately deceptive activity.</li>
        </ul>

        <h2>6. Bots, Automation, VPNs and Technical Manipulation</h2>
        <p>Users must not use technical methods intended to deceive, manipulate, or bypass GWENO Hub systems.</p>
        <p>This includes, where used for prohibited purposes:</p>
        <ul>
          <li>Bots and automated task-completion software.</li>
          <li>Auto-clickers or click-simulation software.</li>
          <li>Scripts designed to generate artificial activity.</li>
          <li>Browser automation intended to bypass platform controls.</li>
          <li>Browser emulators used to manipulate platform activity.</li>
          <li>Attempts to manipulate cookies, sessions, IP addresses, or tracking mechanisms.</li>
          <li>Attempts to repeatedly access tasks or offers by circumventing eligibility controls.</li>
          <li>Unauthorized security testing or vulnerability exploitation.</li>
          <li>Distributed or automated traffic intended to overload the platform.</li>
        </ul>
        <p>GWENO Hub may apply reasonable technical controls to detect suspicious patterns, automated activity, account connections, or other behavior that threatens the integrity of the platform.</p>

        <h2>7. VPN, Proxy and Location Manipulation</h2>
        <p>Users must not use VPNs, proxies, location-spoofing tools, or similar technologies for the purpose of misrepresenting their location, circumventing geographic restrictions, manipulating eligibility, or obtaining tasks or rewards for which they are not eligible.</p>
        <p>Where a task or platform feature has geographic eligibility requirements, users must comply with those requirements honestly.</p>

        <h2>8. Prohibited Content</h2>
        <p>Users must not upload, submit, transmit, or distribute content through GWENO Hub that is unlawful, malicious, threatening, hateful, deliberately discriminatory, sexually explicit where prohibited, or otherwise harmful to users or the platform.</p>
        <p>Users must not:</p>
        <ul>
          <li>Upload malicious software or harmful code.</li>
          <li>Distribute viruses, malware, or other harmful programs.</li>
          <li>Threaten other users or GWENO Hub personnel.</li>
          <li>Promote violence or unlawful activity.</li>
          <li>Submit content intended to harass or intimidate others.</li>
          <li>Submit content that infringes another person&apos;s intellectual-property rights.</li>
        </ul>

        <h2>9. System Security and Computer Misuse</h2>
        <p>Users must not attempt to gain unauthorized access to GWENO Hub systems, accounts, databases, servers, APIs, payment processes, communications, security mechanisms, or other technical infrastructure.</p>
        <p>Prohibited activity includes:</p>
        <ul>
          <li>Attempting to hack or compromise another user&apos;s account.</li>
          <li>Attempting to access information without authorization.</li>
          <li>Changing another user&apos;s personal or payment information.</li>
          <li>Attempting to bypass authentication or security controls.</li>
          <li>Introducing malicious code.</li>
          <li>Interfering with the availability or integrity of the platform.</li>
          <li>Conducting denial-of-service or similar disruptive attacks.</li>
          <li>Exploiting technical vulnerabilities without authorization.</li>
          <li>Intercepting communications or attempting unauthorized access to data.</li>
        </ul>
        <p>Conduct that may constitute an offence under applicable Kenyan computer misuse, cybersecurity, fraud, or other laws may be referred to the appropriate authorities where required or reasonably appropriate.</p>

        <h2>10. Customer Care and Staff Conduct</h2>
        <p>GWENO Hub expects users to communicate respectfully with customer care representatives and other personnel.</p>
        <p>Users must not:</p>
        <ul>
          <li>Threaten staff.</li>
          <li>Harass staff.</li>
          <li>Intimidate staff.</li>
          <li>Use repeated abusive or degrading language.</li>
          <li>Make threats of violence or unlawful retaliation.</li>
          <li>Impersonate GWENO Hub personnel.</li>
          <li>Attempt to obtain confidential staff or company information.</li>
          <li>Deliberately flood official support channels with excessive messages.</li>
        </ul>

        <div className="notice">
          Serious threats, credible safety concerns, unlawful conduct, or deliberate attempts to compromise GWENO Hub systems may result in immediate account restrictions while the matter is investigated.
        </div>

        <h2>11. Official Communication Channels</h2>
        <p>Users should use official GWENO Hub communication channels when requesting account assistance or reporting an issue.</p>
        <p>GWENO Hub personnel will not request passwords, PINs, OTP codes, or other sensitive authentication credentials through unofficial channels.</p>
        <p>Users should be cautious of individuals falsely claiming to represent GWENO Hub and should report suspected impersonation through official support channels.</p>

        <h2>12. Intellectual Property and User Content</h2>
        <p>Users must respect the intellectual-property rights of GWENO Hub, task providers, other users, and third parties.</p>
        <p>Users must not copy, reproduce, distribute, sell, modify, reverse engineer, or commercially exploit GWENO Hub materials without appropriate authorization.</p>
        <p>Users must also ensure that content submitted through tasks or platform features does not unlawfully infringe the rights of another person.</p>

        <h2>13. Circumvention of Platform Rules</h2>
        <p>Users must not deliberately attempt to circumvent any rule, security measure, eligibility requirement, verification procedure, task restriction, payment control, referral limitation, or account restriction implemented by GWENO Hub.</p>
        <p>Attempting to exploit a weakness in the platform after becoming aware that the activity is prohibited may itself constitute a violation of this Policy.</p>

        <h2>14. Automated Fraud and Security Monitoring</h2>
        <p>GWENO Hub may use automated systems, technical monitoring, risk controls, and other security measures to identify suspicious activity, fraudulent behavior, unusual account patterns, automation, or attempts to manipulate platform systems.</p>
        <p>Where appropriate, automated detection may result in an account being temporarily restricted for additional review.</p>
        <p>Automated detection may be supplemented by human review where reasonably necessary.</p>

        <h2>15. Investigation of Suspicious Activity</h2>
        <p>GWENO Hub may review account activity where there is a reasonable basis to suspect fraud, manipulation, unauthorized access, false information, prohibited conduct, or other activity that may compromise platform integrity.</p>
        <p>During an investigation, GWENO Hub may temporarily restrict certain account functions, including task participation, referrals, earnings, or withdrawals, where reasonably necessary to protect users, platform systems, or payment processes.</p>
        <p>Users may be required to provide reasonable information or documentation needed to confirm account ownership or resolve a legitimate security or compliance concern.</p>

        <h2>16. Warnings, Suspension and Termination</h2>
        <p>Depending on the seriousness, frequency, and circumstances of a violation, GWENO Hub may take one or more of the following actions:</p>
        <ul>
          <li>Issue a warning.</li>
          <li>Remove or reject prohibited content.</li>
          <li>Restrict certain account features.</li>
          <li>Temporarily suspend an account.</li>
          <li>Temporarily restrict task participation.</li>
          <li>Temporarily restrict withdrawals while an investigation is conducted.</li>
          <li>Reverse or withhold rewards associated with invalid or fraudulent activity.</li>
          <li>Permanently terminate an account.</li>
          <li>Prevent creation of another account after termination.</li>
          <li>Report suspected unlawful activity to appropriate authorities where required or permitted.</li>
        </ul>
        <p>GWENO Hub is not required to provide a warning before taking action where immediate action is reasonably necessary to protect the platform, users, staff, payment processes, or security.</p>

        <h2>17. Fraudulent Earnings and Rewards</h2>
        <p>Where earnings, rewards, bonuses, referrals, or other account benefits are determined to have resulted from fraudulent, invalid, automated, manipulated, or prohibited activity, GWENO Hub may review, adjust, reverse, withhold, or cancel those benefits in accordance with the Terms &amp; Conditions.</p>
        <p>Technical errors, display errors, duplicate credits, or incorrect account values may also be corrected where necessary to maintain accurate account records.</p>

        <h2>18. No Second Account After Termination</h2>
        <p>If an account is permanently terminated for serious or repeated violations, the user must not create another account to bypass the termination.</p>
        <p>Attempting to create or operate another account following a permanent termination may result in the additional account being restricted or terminated.</p>

        <h2>19. Appeals and Account Reviews</h2>
        <p>Where an appeal process is available, users may contact GWENO Hub support to request a review of an account restriction or suspension.</p>
        <p>Appeals should provide relevant information and explain the circumstances clearly and respectfully.</p>
        <p>GWENO Hub may request additional information where reasonably necessary to complete the review.</p>

        <h2>20. Compliance With Applicable Laws</h2>
        <p>Users must comply with the laws and regulations applicable to their use of GWENO Hub.</p>
        <p>For users in Kenya, this may include applicable provisions of Kenyan laws concerning computer misuse and cybersecurity, data protection, fraud, electronic transactions, consumer protection, intellectual property, and other relevant areas of law, as amended from time to time.</p>
        <p>GWENO Hub may also take reasonable account of applicable international legal requirements and generally recognized principles relating to online safety, fraud prevention, cybersecurity, privacy, and lawful digital activity.</p>
        <p>Nothing in this Policy is intended to remove or restrict any right or protection that cannot lawfully be excluded under applicable law.</p>

        <h2>21. Cooperation With Lawful Investigations</h2>
        <p>GWENO Hub may cooperate with lawful requests from competent authorities where required or permitted by applicable law.</p>
        <p>Information may be disclosed where reasonably necessary to investigate suspected fraud, unlawful activity, threats to safety, computer misuse, security incidents, or other matters requiring lawful intervention.</p>

        <h2>22. Changes to This Policy</h2>
        <p>GWENO Hub may update this Customer Conduct &amp; Suspension Policy from time to time to reflect changes in platform operations, security requirements, legal requirements, or user safety practices.</p>
        <p>The updated version will be published on this page together with a revised date.</p>

        <h2>23. Contact GWENO Hub</h2>
        <p>If you believe another user is violating this Policy, or if you need to appeal an account restriction, contact GWENO Hub through the official support channels.</p>
        <p>Email: <a href="mailto:businesshub.comke@gmail.com">businesshub.comke@gmail.com</a></p>
        <p>
          WhatsApp:{" "}
          <a href="https://wa.me/254765772203" target="_blank" rel="noopener noreferrer">
            Contact GWENO Hub Support on WhatsApp
          </a>
        </p>
        <p>
          You may also review the <a href="/terms">Terms &amp; Conditions</a>{" "}
          and <a href="/privacy">Privacy Policy</a>.
        </p>

        <h2>24. Acceptance</h2>
        <p>By creating an account, accessing GWENO Hub, accepting tasks, submitting work, communicating with customer care, or continuing to use the platform, you acknowledge that you have read, understood, and agree to comply with this Customer Conduct &amp; Suspension Policy.</p>
      </main>

      <footer>
        <p>© 2026 GWENO Hub. All rights reserved.</p>

        <ul className="footer-links">
          <li><a href="/terms">Terms &amp; Conditions</a></li>
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/conduct">Conduct Policy</a></li>
          <li><a href="/manual">Help Center</a></li>
        </ul>

        <p>
          Support: <a href="mailto:businesshub.comke@gmail.com">businesshub.comke@gmail.com</a>
          &nbsp;·&nbsp;
          <a href="https://wa.me/254765772203" target="_blank" rel="noopener noreferrer">
            WhatsApp Support
          </a>
        </p>
      </footer>
    </>
  );
}
