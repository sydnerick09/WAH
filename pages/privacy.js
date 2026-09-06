import Head from "next/head";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | GWENO HUB</title>
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
          letter-spacing: -0.5px;
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

        ul {
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
          margin: 24px 0;
          color: var(--secondary);
          background: #fafafa;
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
        <h1>Privacy Policy</h1>
        <p className="updated">Last updated: August 30, 2026</p>

        <p>GWENO Hub respects the privacy of people who use its website and services. This Privacy Policy explains how information may be collected, used, protected, retained, disclosed, and otherwise processed when you access or use GWENO Hub.</p>

        <p>This Policy applies to users accessing GWENO Hub from different countries and regions. Depending on where you live, how you use the platform, and which services you access, additional privacy rights or legal requirements may apply.</p>

        <p>By creating an account, accessing, or using GWENO Hub, you acknowledge that you have read this Privacy Policy. If you do not agree with the practices described here, you should not register for or use the platform.</p>

        <div className="notice">
          <strong>Important:</strong> GWENO Hub is intended only for individuals who are at least <strong>20 years old</strong>. Information may be processed where reasonably necessary to verify age, identity, account ownership, eligibility, security, fraud prevention, and payment requirements.
        </div>

        <h2>1. Information We Collect</h2>
        <p>We may collect information that you provide directly to us when creating an account, completing your profile, using tasks, requesting services, requesting a withdrawal, contacting support, completing verification, or otherwise interacting with GWENO Hub.</p>

        <h3>Information you provide</h3>
        <ul>
          <li>Full name and account details.</li>
          <li>Email address.</li>
          <li>Telephone number.</li>
          <li>Date of birth or age information where required for eligibility verification.</li>
          <li>National identification information where required for verification.</li>
          <li>Tax or related identification information where required.</li>
          <li>Payment and withdrawal information.</li>
          <li>Account credentials and authentication information.</li>
          <li>Task submissions and information contained in task responses.</li>
          <li>Information contained in support requests or other communications.</li>
          <li>Information voluntarily provided when reporting an issue or giving feedback.</li>
        </ul>

        <h3>Technical and usage information</h3>
        <p>When you access or use GWENO Hub, certain technical and usage information may be collected automatically, depending on the technologies used by the platform and its service providers.</p>
        <ul>
          <li>IP address.</li>
          <li>Browser type and version.</li>
          <li>Device type and device information.</li>
          <li>Operating system information.</li>
          <li>Pages, tasks, and features accessed.</li>
          <li>Approximate usage times and activity logs.</li>
          <li>Referral and campaign information where applicable.</li>
          <li>Cookies and similar technologies.</li>
          <li>Security and authentication logs.</li>
          <li>Information relating to suspicious or unusual account activity.</li>
        </ul>

        <h2>2. Information You Provide Voluntarily</h2>
        <p>You may voluntarily provide additional information when contacting support, completing tasks, reporting a problem, submitting feedback, participating in platform activities, or communicating with GWENO Hub.</p>
        <p>You should avoid sending passwords, PINs, OTP codes, recovery codes, or other unnecessary confidential security information through support messages.</p>

        <h2>3. How We Use Information</h2>
        <p>We use information for purposes reasonably necessary to operate, administer, protect, maintain, and improve GWENO Hub.</p>
        <ul>
          <li>Create and manage user accounts.</li>
          <li>Confirm that users meet the minimum age requirement.</li>
          <li>Verify account information and account ownership.</li>
          <li>Provide tasks and platform services.</li>
          <li>Determine eligibility for certain tasks or platform features.</li>
          <li>Review and validate task submissions.</li>
          <li>Process eligible earnings and withdrawals.</li>
          <li>Prevent duplicate, fraudulent, or unauthorized accounts.</li>
          <li>Detect and prevent fraud and unauthorized activity.</li>
          <li>Investigate suspicious transactions or platform activity.</li>
          <li>Maintain platform and account security.</li>
          <li>Respond to customer support requests.</li>
          <li>Send important service communications.</li>
          <li>Improve website functionality and user experience.</li>
          <li>Monitor technical performance and reliability.</li>
          <li>Investigate suspected misuse or violations of our Terms.</li>
          <li>Protect users and the integrity of the platform.</li>
          <li>Meet applicable legal, regulatory, security, or compliance obligations.</li>
        </ul>

        <h2>4. Age and Eligibility Verification</h2>
        <p>GWENO Hub requires users to be at least <strong>20 years old</strong>. Information may be collected or processed where reasonably necessary to confirm that a user satisfies this requirement.</p>
        <p>Where appropriate, GWENO Hub may request information or documentation to verify age, identity, account ownership, eligibility, or compliance with platform requirements.</p>
        <p>If a user cannot reasonably establish that they meet the applicable eligibility requirements, access to certain services may be restricted or the account may be suspended or terminated.</p>
        <p>GWENO Hub does not intentionally design its services for persons below the applicable minimum age.</p>

        <h2>5. Identity and Account Verification</h2>
        <p>Some services may require verification of information associated with your account. Verification may be used to protect account security, prevent fraud, confirm ownership, confirm eligibility, process certain transactions, or satisfy applicable legal or operational requirements.</p>
        <p>Verification information may include identification documents, account information, transaction details, contact information, or other reasonable information necessary for the verification process.</p>
        <p>Where GWENO Hub uses a third-party verification provider, information may be processed by that provider in accordance with its applicable privacy practices and contractual requirements.</p>
        <p>If information supplied during verification is inaccurate, incomplete, fraudulent, altered, or cannot reasonably be confirmed, access to certain services may be restricted until the matter is resolved.</p>

        <h2>6. Task and Activity Information</h2>
        <p>When you participate in tasks or other activities through GWENO Hub, we may collect information relating to your participation and submissions.</p>
        <p>This may include task selections, task responses, completion records, submission timestamps, quality or validation results, referral activity, reward information, and other information reasonably necessary to administer the platform.</p>
        <p>Task and activity information may be reviewed to determine whether a task was completed legitimately and in accordance with the applicable instructions and platform rules.</p>

        <h2>7. Fraud Prevention and Security Monitoring</h2>
        <p>GWENO Hub may process account, technical, transaction, device, usage, location-related, and other relevant information to identify and prevent fraud, abuse, unauthorized access, manipulation, duplicate accounts, and other activity that may threaten users or platform integrity.</p>
        <p>Security and fraud-prevention measures may consider information such as IP addresses, device characteristics, browser information, account activity, login patterns, task activity, referral activity, transaction information, and other reasonable security indicators.</p>
        <p>GWENO Hub may use automated systems, rules-based systems, statistical analysis, and other technical tools to identify potentially suspicious activity.</p>
        <p>Where reasonably necessary, suspicious activity may be subject to additional human review or verification.</p>

        <h2>8. VPNs, Proxies, Automation and Technical Abuse</h2>
        <p>GWENO Hub may process technical information to detect attempts to bypass geographic, security, task, account, or eligibility restrictions.</p>
        <p>This may include detecting unusual use of VPNs, proxies, anonymization services, automated browsers, bots, scripts, emulators, or other technical methods where such use violates the GWENO Hub Terms &amp; Conditions or the requirements of a particular task.</p>
        <p>Such information may be used to protect platform security, prevent manipulation, validate task activity, and enforce applicable platform rules.</p>

        <h2>9. Payment and Withdrawal Information</h2>
        <p>Where you request a payment or withdrawal, information necessary to process the transaction may be used for that purpose.</p>
        <p>Payment information may include information such as the applicable payment account, transaction details, account holder information, and other information reasonably required by the selected payment method.</p>
        <p>Payment information may be processed through relevant payment or financial service providers. Such providers may process information under their own terms, privacy practices, and legal requirements.</p>
        <p>GWENO Hub does not require users to disclose passwords, PINs, or OTP codes to customer care representatives for normal payment processing.</p>

        <h2>10. Information From Third Parties</h2>
        <p>Depending on the services you use, GWENO Hub may receive relevant information from third-party service providers.</p>
        <p>These providers may include payment processors, identity verification services, task providers, advertisers, survey providers, authentication providers, hosting providers, security services, and other technology or operational partners.</p>
        <p>Information received from third parties may be used for legitimate purposes such as processing transactions, validating task activity, preventing fraud, verifying accounts, maintaining security, and providing requested services.</p>

        <h2>11. Sharing of Information</h2>
        <p>GWENO Hub does not sell or rent personal information as a commercial product.</p>
        <p>Information may be shared where reasonably necessary to operate the platform, provide requested services, protect users, or meet applicable requirements.</p>
        <p>Depending on the circumstances, information may be shared with:</p>
        <ul>
          <li>Payment and financial service providers.</li>
          <li>Identity and age verification providers.</li>
          <li>Task, survey, and offer providers.</li>
          <li>Hosting and infrastructure providers.</li>
          <li>Authentication and security providers.</li>
          <li>Technical service providers.</li>
          <li>Analytics and monitoring providers where applicable.</li>
          <li>Professional advisers where appropriate.</li>
          <li>Law enforcement, regulators, courts, or other authorities where disclosure is required or permitted.</li>
        </ul>
        <p>Service providers receiving information for platform operations are expected to handle information appropriately and only for legitimate purposes consistent with their role and applicable requirements.</p>

        <h2>12. Legal and Safety Disclosures</h2>
        <p>Information may be disclosed where reasonably necessary to comply with a lawful request, protect users, investigate fraud, protect the platform, address security incidents, enforce applicable agreements, recover or protect platform assets, or respond to unlawful activity.</p>
        <p>Where appropriate and legally permitted, disclosures will be limited to information reasonably necessary for the relevant purpose.</p>

        <h2>13. Data Security</h2>
        <p>GWENO Hub uses reasonable administrative, technical, and organizational measures designed to protect personal information against unauthorized access, misuse, loss, alteration, disclosure, or destruction.</p>
        <p>Security measures may include access controls, authentication procedures, system monitoring, secure storage practices, account restrictions, encryption or secure transmission where appropriate, and other safeguards appropriate to the nature of the information and platform.</p>
        <p>No electronic system, internet transmission, or storage environment can be guaranteed to be completely secure. Users should therefore also take reasonable precautions to protect their accounts and personal information.</p>

        <h2>14. Cookies and Similar Technologies</h2>
        <p>GWENO Hub may use cookies and similar technologies to maintain sessions, remember preferences, support functionality, understand platform usage, improve performance, and assist with security.</p>
        <p>Cookies or similar technologies may also be used to support task tracking, referral attribution, authentication, fraud prevention, or other platform functionality where applicable.</p>
        <p>You may control cookies through your browser settings. Disabling certain cookies may affect the availability or functionality of some features.</p>

        <h2>15. Communications</h2>
        <p>GWENO Hub may send service-related communications by email, platform notifications, WhatsApp where appropriate, or other legitimate channels.</p>
        <p>These communications may include account information, security notices, task information, transaction updates, maintenance announcements, policy changes, verification requests, or support responses.</p>
        <p>You should keep your registered email address and other account information current so that important communications can reach you.</p>
        <p>GWENO Hub will not intentionally request passwords, PINs, OTP codes, or similar authentication credentials through unofficial support channels.</p>

        <h2>16. Data Retention</h2>
        <p>Personal information may be retained for as long as reasonably necessary for the purposes described in this Policy.</p>
        <p>This may include periods necessary to:</p>
        <ul>
          <li>Maintain your account.</li>
          <li>Provide services.</li>
          <li>Process transactions and withdrawals.</li>
          <li>Complete or document verification.</li>
          <li>Resolve disputes.</li>
          <li>Investigate security or fraud issues.</li>
          <li>Prevent repeated abuse or fraudulent account creation.</li>
          <li>Maintain appropriate business records.</li>
          <li>Meet applicable legal or regulatory requirements.</li>
        </ul>
        <p>When information is no longer reasonably required, it may be deleted, anonymized, securely disposed of, or otherwise handled in accordance with applicable retention practices.</p>

        <h2>17. Account Closure and Data Deletion</h2>
        <p>Subject to applicable law, users may request closure of their GWENO Hub account and deletion of personal information through the official support channels.</p>
        <p>A deletion request may require reasonable verification to confirm that the request was made by the account holder.</p>
        <p>Some information may need to be retained after account closure where required by law, necessary for legitimate security or fraud-prevention purposes, required to resolve disputes, necessary to establish or defend legal claims, or otherwise permitted by applicable law.</p>
        <p>Deleting an account does not necessarily require GWENO Hub to immediately erase information that it is legally required or otherwise lawfully permitted to retain.</p>

        <h2>18. Your Privacy Rights</h2>
        <p>Depending on your jurisdiction and applicable requirements, you may have rights relating to your personal information.</p>
        <p>Where applicable, these may include:</p>
        <ul>
          <li>Request access to information held about you.</li>
          <li>Request correction of inaccurate or incomplete information.</li>
          <li>Request deletion where legally applicable.</li>
          <li>Object to certain processing activities.</li>
          <li>Request restriction of certain processing.</li>
          <li>Withdraw consent where processing is based on consent.</li>
          <li>Request information about how your personal data is handled.</li>
          <li>Raise a privacy-related concern or complaint through the appropriate channels.</li>
        </ul>
        <p>Some requests may be subject to identity verification, legal limitations, security requirements, contractual obligations, or legitimate reasons for retaining particular information.</p>

        <h2>19. Kenya Data Protection Requirements</h2>
        <p>Where applicable to GWENO Hub&apos;s processing activities, personal information is handled with regard to Kenya&apos;s applicable data-protection framework, including the <strong>Data Protection Act, 2019</strong> and applicable regulations, guidance, and lawful requirements.</p>
        <p>GWENO Hub seeks to apply reasonable measures relating to the lawful collection, use, protection, retention, and handling of personal information.</p>
        <p>Where applicable, users may exercise rights available to them under Kenya&apos;s data-protection framework through the official GWENO Hub support channels.</p>

        <h2>20. International Users and Cross-Border Processing</h2>
        <p>GWENO Hub may be accessed by users in different countries. Information associated with an account may therefore be processed through systems, providers, or infrastructure located in a country other than the country where the user resides.</p>
        <p>Where information is transferred or processed across jurisdictions, reasonable measures may be applied to protect it and to meet applicable legal and contractual requirements.</p>
        <p>Users are responsible for ensuring that they are legally eligible to use GWENO Hub from their location. Certain countries and territories may be restricted from accessing the platform in accordance with the GWENO Hub Terms &amp; Conditions.</p>

        <h2>21. Restricted Countries and Locations</h2>
        <p>GWENO Hub may restrict access from certain countries or territories for legal, sanctions, security, payment, operational, or risk-management reasons.</p>
        <p>The current list of restricted countries and territories is contained in the <a href="/terms">GWENO Hub Terms &amp; Conditions</a>.</p>
        <p>Technical information such as IP address, device information, or other reasonable indicators may be processed to help enforce geographic and eligibility restrictions.</p>

        <h2>22. Children&apos;s Privacy</h2>
        <p>GWENO Hub is intended only for individuals who are at least <strong>20 years old</strong>.</p>
        <p>We do not knowingly seek to collect personal information from individuals below the applicable minimum age for the purpose of allowing them to operate a GWENO Hub account.</p>
        <p>If we become aware that an account has been created or operated by a person who does not meet the minimum age requirement, we may take appropriate steps, including restricting or terminating the account and handling the associated information in accordance with applicable law.</p>

        <h2>23. Third-Party Websites and Services</h2>
        <p>GWENO Hub may contain links to external websites or services. Those websites may have their own privacy policies and practices.</p>
        <p>GWENO Hub is not responsible for the privacy practices of third-party websites that it does not control. Users should review the relevant privacy information before submitting personal information to external services.</p>
        <p>Third-party task providers, advertisers, payment providers, verification services, and other partners may independently process information under their own applicable privacy policies and legal obligations.</p>

        <h2>24. Account Security</h2>
        <p>Users should protect their login information and immediately report suspected unauthorized account activity.</p>
        <p>GWENO Hub staff will not request your password, PIN, OTP, recovery code, or other authentication credentials through unofficial communication channels.</p>
        <p>If you believe that your account has been compromised, you should contact GWENO Hub through the official support channels as soon as reasonably possible.</p>

        <h2>25. Fraud and Security Investigations</h2>
        <p>GWENO Hub may process relevant account and technical information when investigating suspected fraud, unauthorized access, manipulation, security incidents, misuse of the platform, duplicate accounts, false information, payment irregularities, or other activity that may threaten users or platform integrity.</p>
        <p>Such processing is intended to protect the platform, its users, legitimate earnings, payment processes, and the reliability of its services.</p>
        <p>Where appropriate, information associated with suspicious activity may be reviewed using automated systems and/or human review.</p>

        <h2>26. Legal Compliance and Disclosure</h2>
        <p>GWENO Hub may process or disclose personal information where reasonably necessary to comply with applicable laws, lawful governmental requests, court orders, regulatory requirements, fraud-prevention obligations, payment requirements, or other legitimate legal processes.</p>
        <p>GWENO Hub may also disclose information where reasonably necessary to protect the rights, property, security, or safety of GWENO Hub, its users, service providers, or other persons.</p>

        <h2>27. Data Accuracy</h2>
        <p>Users are responsible for providing accurate and current information and should update account information when necessary.</p>
        <p>GWENO Hub may rely on information supplied by users when operating accounts, processing tasks, conducting verification, or processing transactions.</p>
        <p>Where inaccurate information creates security, payment, compliance, or account-integrity concerns, additional verification may be required.</p>

        <h2>28. Changes to This Privacy Policy</h2>
        <p>This Privacy Policy may be updated periodically. Changes may be made to reflect new services, technical developments, operational practices, security improvements, legal requirements, or changes in how GWENO Hub processes information.</p>
        <p>The revised version will be published on this page with an updated date. Users should review this page periodically for changes.</p>
        <p>Where required by applicable law, GWENO Hub may provide additional notice of material changes through an appropriate communication channel.</p>

        <h2>29. Contact Us</h2>
        <p>If you have questions, concerns, requests, or complaints regarding privacy or personal information, contact GWENO Hub through the official support channels.</p>
        <p>Email: <a href="mailto:businesshub.comke@gmail.com">businesshub.comke@gmail.com</a></p>
        <p>
          WhatsApp:{" "}
          <a href="https://wa.me/254765772203" target="_blank" rel="noopener noreferrer">
            Contact GWENO Hub Support on WhatsApp
          </a>
        </p>
        <p>
          You may also review the <a href="/terms">Terms &amp; Conditions</a>{" "}
          and <a href="/conduct">Customer Conduct &amp; Suspension Policy</a>.
        </p>
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
