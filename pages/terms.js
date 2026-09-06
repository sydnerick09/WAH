import Head from "next/head";
import { useEffect } from "react";

const TERMS_HTML = `<header>
  <div class="brand">GWENO HUB</div>
</header>

<nav class="legal-nav" aria-label="Legal navigation">
  <div class="legal-nav-inner">
    <a href="/terms">Terms &amp; Conditions</a>
    <a href="/privacy">Privacy Policy</a>
    <a href="/conduct">Conduct Policy</a>
    <a href="mailto:businesshub.comke@gmail.com">Support</a>
  </div>
</nav>

<main>

  <h1>Terms & Conditions</h1>

  <p class="updated">Last updated: April 1, 2026</p>

  <!-- SEARCH -->

  <div class="terms-search">
    <div class="search-box">
      <svg
        class="search-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7"></circle>
        <line x1="16.2" y1="16.2" x2="21" y2="21"></line>
      </svg>


  <input
    type="search"
    id="termsSearch"
    placeholder="Search these Terms & Conditions..."
    aria-label="Search Terms & Conditions"
    autocomplete="off"
  >

  <button
    type="button"
    id="clearSearch"
    class="clear-search"
    aria-label="Clear search"
    title="Clear search"
  >
    ×
  </button>
</div>

<div
  id="searchStatus"
  class="search-status"
  aria-live="polite"
></div>


  </div>

  <div id="termsContent">


<p>
  Welcome to GWENO Hub. These Terms and Conditions govern your access to
  and use of GWENO Hub, including its website, user accounts, task
  marketplace, earning features, payment and withdrawal services, support
  services, communications, and other features made available through the
  platform.
</p>

<p>
  By creating an account, accessing the website, accepting tasks, submitting
  work, using platform services, or otherwise continuing to use GWENO Hub,
  you acknowledge that you have read, understood, and agreed to these Terms
  and Conditions. If you do not agree with these Terms, you must not
  register for, access, or use the platform.
</p>

<p>
  These Terms apply to users regardless of the country from which they access
  GWENO Hub, subject to the eligibility and geographic restrictions stated
  below. Mandatory rights and protections provided by applicable law remain
  unaffected.
</p>

<h2>1. Acceptance of Terms</h2>

<p>
  Your use of GWENO Hub constitutes acceptance of these Terms and any
  applicable policies, task-specific rules, notices, or other requirements
  made available through the platform.
</p>

<p>
  These Terms form the basis on which GWENO Hub provides its services to
  users. If you do not accept these Terms, you may not use the platform.
</p>

<p>
  We may update these Terms from time to time to reflect changes to our
  services, security requirements, operational procedures, legal obligations,
  or platform features. Updated Terms may be published on this page and the
  revised date will be displayed at the top of the document.
</p>

<p>
  Where permitted by applicable law, continued use of GWENO Hub after an
  updated version becomes effective constitutes acceptance of the revised
  Terms.
</p>

<h2>2. Eligibility and Minimum Age</h2>

<p>
  You must be at least <strong>20 years old</strong> to register for and use
  GWENO Hub.
</p>

<p>
  By creating or operating an account, you confirm that you are 20 years of
  age or older and have the legal capacity required to enter into these
  Terms.
</p>

<p>
  GWENO Hub may request reasonable age, identity, or account verification
  where necessary to confirm eligibility.
</p>

<p>
  Individuals who are below the minimum age must not create, operate, or use
  a GWENO Hub account, including by using another person's identity or
  account.
</p>

<p>
  You are responsible for ensuring that your use of GWENO Hub is lawful in
  the country or territory from which you access the platform.
</p>

<h2>3. Restricted Countries and Territories</h2>

<p>
  For compliance, security, risk-management, payment, sanctions, operational,
  or legal reasons, GWENO Hub is not currently available to users located
  in, ordinarily resident in, or attempting to register from the following
  countries or territories:
</p>

<ul>
  <li>Iran</li>
  <li>North Korea</li>
  <li>Syria</li>
  <li>Sudan</li>
  <li>Cuba</li>
  <li>Russia</li>
  <li>Somalia</li>
  <li>Libya</li>
  <li>Myanmar</li>
  <li>Zimbabwe</li>
  <li>Afghanistan</li>
  <li>Restricted or sanctioned regions of Ukraine</li>
</ul>

<p>
  This list may be updated where necessary to reflect applicable sanctions,
  payment restrictions, security requirements, legal obligations, or changes
  in platform operations.
</p>

<p>
  Attempting to bypass geographic restrictions by providing false location
  information, using prohibited routing methods, or otherwise concealing
  your actual location may result in account suspension or termination.
</p>

<h2>4. Account Registration</h2>

<p>
  When creating an account, you must provide information that is accurate,
  complete, current, and capable of being verified where verification is
  required.
</p>

<p>
  Account information may include your name, email address, telephone number,
  identification information, payment information, location information,
  and other information required for account operation or verification.
</p>

<p>
  You must not register using another person's identity, impersonate another
  person, create an account using deliberately false information, or provide
  information belonging to another individual without authorization.
</p>

<p>
  You may only create an account for yourself. You must not create an account
  on behalf of another person or allow another person to operate your account.
</p>

<h2>5. One Account Per Person</h2>

<p>
  Each individual is permitted to maintain only one GWENO Hub account unless
  GWENO Hub expressly authorizes otherwise in writing.
</p>

<p>
  You must not create, operate, purchase, sell, rent, transfer, or share
  GWENO Hub accounts.
</p>

<p>
  You must not create additional accounts after an account has been
  suspended, restricted, or terminated in order to bypass the applicable
  restriction.
</p>

<p>
  GWENO Hub may use reasonable technical, identity, security, and fraud
  prevention measures to identify duplicate, linked, fraudulent, or
  unauthorized accounts.
</p>

<h2>6. Account Security</h2>

<p>
  You are responsible for taking reasonable steps to protect your account,
  including keeping passwords and authentication information confidential.
</p>

<p>
  You must not share passwords, PINs, one-time verification codes, recovery
  codes, or other security credentials with another person.
</p>

<p>
  GWENO Hub staff will not request passwords, PINs, OTP codes, or other
  sensitive authentication credentials through unofficial communication
  channels.
</p>

<p>
  If you believe your account has been compromised, you should contact the
  support team promptly through the official support options listed on this
  website.
</p>

<h2>7. Task Participation</h2>

<p>
  GWENO Hub may make tasks available to eligible users depending on task
  availability, account status, platform requirements, location, subscription
  level, verification status, advertiser requirements, and other operational
  factors.
</p>

<p>
  Before accepting a task, you are responsible for reading and understanding
  the instructions provided with that task.
</p>

<p>
  Task submissions must be genuine and must represent work actually completed
  by the account holder.
</p>

<p>
  You must not intentionally submit copied, fabricated, incomplete,
  manipulated, fraudulent, or misleading work.
</p>

<p>
  Tasks may be reviewed before earnings are credited. GWENO Hub may reject a
  submission where the work does not meet the applicable task requirements.
</p>

<p>
  Task availability is not guaranteed. The number, type, value, and timing of
  available tasks may change according to platform operations and third-party
  demand.
</p>

<h2>8. Prohibited Activities — Things You Must Not Do</h2>

<p>
  When using GWENO Hub, you agree to follow all platform rules. The following
  activities are prohibited:
</p>

<ul>
  <li>Creating or operating multiple GWENO Hub accounts for yourself.</li>

  <li>
    Buying, selling, renting, lending, transferring, or sharing GWENO Hub
    accounts.
  </li>

  <li>
    Creating an account on behalf of another person.
  </li>

  <li>
    Allowing another person to complete tasks through your account.
  </li>

  <li>
    Using another person's account or identity without authorization.
  </li>

  <li>
    Providing false, misleading, incomplete, fabricated, or deliberately
    inaccurate registration information.
  </li>

  <li>
    Providing false information in surveys, questionnaires, assessments,
    applications, task submissions, or verification procedures.
  </li>

  <li>
    Submitting work that was not genuinely completed by you.
  </li>

  <li>
    Copying another user's work or deliberately submitting duplicated work.
  </li>

  <li>
    Creating fake tasks, fake activity, or coordinated activity for the
    purpose of obtaining rewards, bonuses, referrals, rankings, or other
    benefits improperly.
  </li>

  <li>
    Registering through your own referral link or using another account to
    generate artificial referral commissions.
  </li>

  <li>
    Manipulating referrals, bonuses, rankings, task completion records, or
    other platform incentives.
  </li>

  <li>
    Using bots, scripts, auto-clickers, macros, automation software, browser
    automation, or similar tools to perform tasks or generate activity
    unless expressly authorized by GWENO Hub.
  </li>

  <li>
    Using software or automated systems to artificially generate searches,
    clicks, impressions, installations, submissions, or other activity.
  </li>

  <li>
    Using browser extensions or other tools to automatically simulate human
    activity where such activity is prohibited by the applicable task.
  </li>

  <li>
    Manipulating links, cookies, browser data, device information, IP
    addresses, or other technical information to repeat tasks or obtain a
    reward more than once.
  </li>

  <li>
    Deliberately clearing, resetting, changing, or manipulating technical
    identifiers for the purpose of bypassing task eligibility or completion
    restrictions.
  </li>

  <li>
    Using VPNs, proxies, Tor, emulators, or other location-masking services
    to bypass geographic, task, security, or eligibility restrictions.
  </li>

  <li>
    Sending artificial, proxy, automated, or fraudulent traffic to GWENO Hub,
    its task links, or third-party task providers.
  </li>

  <li>
    Attempting to manipulate an offer, survey, task, or tracking link to
    falsely represent that an activity has not previously been completed.
  </li>

  <li>
    Attempting to obtain additional surveys, offers, rewards, or task
    opportunities through deceptive technical methods.
  </li>

  <li>
    Uploading viruses, malware, ransomware, spyware, malicious code, or other
    harmful software.
  </li>

  <li>
    Attempting to hack, exploit, probe, scan, attack, overload, disable, or
    disrupt GWENO Hub systems or services without authorization.
  </li>

  <li>
    Attempting to access another user's account, personal information,
    payment information, or security credentials.
  </li>

  <li>
    Changing another person's account or payment information without
    authorization.
  </li>

  <li>
    Interfering with the normal operation, security, availability, or
    integrity of GWENO Hub.
  </li>

  <li>
    Using GWENO Hub to engage in unlawful, fraudulent, deceptive, malicious,
    threatening, discriminatory, or abusive conduct.
  </li>

  <li>
    Uploading or distributing content that is hateful, threatening,
    sexually explicit, exploitative, or that unlawfully promotes violence or
    discrimination.
  </li>

  <li>
    Uploading content that infringes another person's copyright, trademark,
    privacy, publicity, or other legal rights.
  </li>

  <li>
    Submitting photographs, documents, recordings, or other material that you
    do not have the right to use or submit.
  </li>

  <li>
    Attempting to bypass account verification, security controls, geographic
    restrictions, suspension measures, or other platform safeguards.
  </li>

  <li>
    Using GWENO Hub to facilitate or encourage another person's violation of
    these Terms.
  </li>

  <li>
    Using the platform in a manner that could damage the reputation,
    infrastructure, security, or legitimate operation of GWENO Hub.
  </li>
</ul>

<p>
  GWENO Hub may take appropriate action where prohibited activity is
  identified. Depending on the circumstances, this may include rejection of
  tasks, reversal of rewards, suspension, restriction, termination of the
  account, withholding of affected rewards, or reporting to appropriate
  authorities where required or permitted by law.
</p>

<h2>9. Honest Use of the Platform</h2>

<p>
  Users must use GWENO Hub honestly and must not attempt to obtain earnings,
  account benefits, referrals, task allocations, bonuses, or other
  advantages through deception or manipulation.
</p>

<p>
  GWENO Hub may use automated systems, fraud-detection technologies,
  statistical analysis, security tools, and other reasonable methods to
  identify suspicious, automated, fraudulent, duplicated, or otherwise
  invalid activity.
</p>

<h2>10. Earnings and Rewards</h2>

<p>
  Eligible earnings may be credited to your GWENO Hub account after the
  applicable task has been completed and accepted.
</p>

<p>
  The amount associated with a task will be communicated through the
  platform. Task values may vary depending on the task, category,
  requirements, account conditions, advertiser requirements, and other
  factors.
</p>

<p>
  GWENO Hub does not guarantee any particular level of earnings. The amount
  a user may earn depends on factors including task availability, user
  eligibility, successful completion, quality requirements, platform
  operations, and third-party demand.
</p>

<p>
  Some users may receive fewer tasks or no tasks during particular periods.
</p>

<p>
  Displayed earnings may be conditional and are not necessarily immediately
  available for withdrawal. GWENO Hub may require task validation,
  verification, fraud checks, or completion of other applicable procedures
  before earnings become available.
</p>

<h2>11. Reward Reviews, Reversals and Adjustments</h2>

<p>
  GWENO Hub reserves the right to review account activity and may adjust,
  reverse, delay, reject, cancel, or withhold rewards where activity is
  determined to be fraudulent, invalid, duplicated, automated, misleading,
  incorrectly credited, or otherwise inconsistent with these Terms or the
  applicable task requirements.
</p>

<p>
  Where a third-party task provider, advertiser, survey provider, or other
  partner rejects or reverses a task completion because the activity was
  invalid, fraudulent, incomplete, or otherwise ineligible, the associated
  reward may also be reversed where reasonably necessary.
</p>

<p>
  If a technical, database, display, calculation, or coding error causes an
  account to display earnings that were not actually earned, GWENO Hub may
  correct the error. Incorrectly displayed amounts do not automatically
  constitute amounts owed to the user.
</p>
    
<h2>12. Withdrawals</h2>

<p>
  Users must initiate withdrawals through the official withdrawal process
  available through GWENO Hub.
</p>

<p>
  The withdrawal is initiated by the client directly through their GWENO Hub
  dashboard. GWENO Hub does not independently initiate a withdrawal on behalf
  of a client. The client is responsible for selecting the appropriate
  withdrawal method and providing the required withdrawal information before
  submitting the request.
</p>

<p>
  You are responsible for ensuring that your account and withdrawal details are
  accurate. Incorrect, incomplete, inconsistent, or unverifiable information may
  result in a delay, rejection, cancellation, or additional verification.
</p>

<p>
  Processing times may vary depending on the payment method, verification
  requirements, operational circumstances, weekends, holidays, financial
  institutions, payment providers, and other factors outside GWENO Hub's
  immediate control.
</p>

<p>
  GWENO Hub does not guarantee that every withdrawal will be completed within
  a particular period unless a specific processing commitment has expressly
  been provided for that transaction.
</p>

<p>
  GWENO Hub may delay, restrict, withhold, or reverse a withdrawal while
  conducting a reasonable fraud, security, identity, compliance, or account
  review.
</p>

<h3>Supported Withdrawal Banks and Applicable Withdrawal Fees</h3>

<p>
  GWENO Hub may make bank withdrawals available through selected financial
  institutions. The applicable withdrawal fee depends on the selected bank,
  withdrawal method, transaction requirements, verification status, and other
  applicable processing conditions.
</p>

<p>
  The following withdrawal banks and applicable withdrawal fees or fee ranges
  may apply where the relevant withdrawal option is available:
</p>

<ol>
  <li>KCB Bank — <strong>USD 23</strong></li>
  <li>NCBA Bank — <strong>USD 27</strong></li>
  <li>Co-operative Bank of Kenya — <strong>NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
  <li>Equity Bank — <strong>NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
  <li>Absa Bank Kenya — <strong>NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
  <li>Standard Chartered Bank — <strong>USD 34</strong></li>
  <li>Stanbic Bank Kenya — <strong>USD 67</strong></li>
  <li>Postbank Kenya — <strong>USD 51</strong></li>
  <li>Family Bank of Kenya — <strong>NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
  <li>DTB Bank — <strong>USD 19</strong></li>

  <li>Stanbic Bank Uganda — <strong>NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
  <li>Centenary Bank — <strong>NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
  <li>Absa Bank Uganda — <strong>USD 26–80</strong></li>
  <li>Bank of Uganda — <strong>USD 26–80</strong></li>

  <li>Bank of Khartoum — <strong>USD 26–80</strong></li>
  <li>Faisal Islamic Bank — <strong>USD 26–80</strong></li>
  <li>Omdurman National Bank — <strong>USD 26–80</strong></li>

  <li>CRDB Bank — <strong>USD 26–80</strong></li>
  <li>NMB Bank — <strong>USD 26–80</strong></li>
  <li>NBC Bank — <strong>USD 26–80</strong></li>

  <li>Banco do Brasil — <strong>USD 26–80</strong></li>
  <li>Itaú Unibanco — <strong>USD 26–80</strong></li>
  <li>Bradesco — <strong>USD 26–80</strong></li>
  <li>Santander — <strong>USD 26–80</strong></li>
  <li>Banco de Bogotá — <strong>USD 26–80</strong></li>
  <li>Bancolombia — <strong>USD 26–80</strong></li>
  <li>BCI — <strong>USD 26–80</strong></li>
  <li>Banco de Chile — <strong>USD 26–80</strong></li>

  <li>JPMorgan Chase — <strong>USD 60–86</strong></li>
  <li>Bank of America — <strong>USD 60–86</strong></li>
  <li>Wells Fargo — <strong>USD 60–86</strong></li>
  <li>Citibank — <strong>USD 60–86</strong></li>
  <li>U.S. Bank — <strong>USD 60–86</strong></li>
  <li>PNC Bank — <strong>USD 60–86</strong></li>
  <li>Truist Bank — <strong>USD 60–86</strong></li>
  <li>Capital One — <strong>USD 60–86</strong></li>
</ol>

<h3>Restricted Kenyan Banks</h3>

<p>
  For the avoidance of doubt, the following Kenyan banks are
  <strong>NOT ELIGIBLE FOR WITHDRAWALS through GWENO Hub</strong>:
</p>

<ul>
  <li><strong>Co-operative Bank of Kenya — NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
  <li><strong>Equity Bank — NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
  <li><strong>Absa Bank Kenya — NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
  <li><strong>Family Bank of Kenya — NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
</ul>

<p>
  Users must not submit withdrawal details for any of the restricted Kenyan
  banks listed above. GWENO Hub may reject, cancel, delay, or otherwise
  restrict a withdrawal request submitted using an account belonging to a
  restricted bank.
</p>

<h3>Restricted Ugandan Banks</h3>

<p>
  The following Ugandan banks are also
  <strong>NOT ELIGIBLE FOR WITHDRAWALS through GWENO Hub</strong>:
</p>

<ul>
  <li><strong>Stanbic Bank Uganda — NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
  <li><strong>Centenary Bank — NOT ELIGIBLE FOR WITHDRAWALS</strong></li>
</ul>

<p>
  Users must not submit withdrawal details for any of the restricted Ugandan
  banks listed above. GWENO Hub may reject, cancel, delay, or otherwise
  restrict a withdrawal request submitted using an account belonging to a
  restricted bank.
</p>

<h3>Restricted and Unsupported Withdrawal Accounts</h3>

<p>
  A withdrawal request submitted using a restricted or unsupported bank
  account will not be processed to that bank. The user is responsible for
  selecting an eligible and supported withdrawal method before confirming
  the withdrawal request.
</p>

<p>
  The restrictions apply whether the bank account belongs to the user or to
  another person. Use of another person's bank account does not bypass any
  restricted-bank rule.
</p>

<h3>Withdrawal Fee Conditions</h3>

<p>
  The USD amounts stated above represent the applicable withdrawal fee or
  published fee range associated with the relevant bank where that withdrawal
  option is available.
</p>

<p>
  Where a fee range is shown, the actual applicable fee may vary within that
  range depending on the transaction, payment method, processing
  requirements, currency conversion, financial institution, payment provider,
  verification status, or other applicable conditions.
</p>

<p>
  GWENO Hub may update supported banks, restricted banks, withdrawal fees,
  fee ranges, or withdrawal availability where reasonably necessary for
  operational, security, payment-processing, regulatory, or compliance
  purposes.
</p>

<h3>Withdrawal Requests Using Restricted Banks</h3>

<p>
  If a client initiates a withdrawal through a restricted or unsupported bank,
  GWENO Hub will not initiate the withdrawal to that restricted bank. The
  withdrawal request is initiated by the client through the GWENO Hub
  dashboard, and the client is responsible for selecting an authorized and
  supported bank or withdrawal option.
</p>

<p>
  Where a withdrawal cannot be processed because the client selected a
  restricted or unsupported bank, the amount the client attempted to withdraw
  may, where applicable, be returned to the client's GWENO Hub dashboard
  account balance. The client may then initiate a new withdrawal using an
  eligible and authorized withdrawal method.
</p>

<h3>Withdrawal Fee Return for Restricted or Unsupported Banks</h3>

<p>
  If the client has already paid a withdrawal fee for a withdrawal that cannot
  be processed because a restricted or unsupported bank was selected, only
  <strong>3% of the withdrawal fee paid</strong> will be deducted.
</p>

<p>
  The remaining <strong>97% of the withdrawal fee paid</strong> will be
  returned directly to the client's GWENO Hub dashboard account balance,
  subject to applicable verification, security, account, and processing
  requirements.
</p>

<p>
  For clarity, the 3% deduction applies only to the
  <strong>withdrawal fee that the client paid</strong>. It does not apply to
  the client's normal GWENO Hub account balance.
</p>

<p>
  The 3% deduction does not mean that 3% of the amount the client intended to
  withdraw will be deducted. The calculation is made only against the
  withdrawal fee previously paid for that withdrawal request.
</p>

<h3>Example of the Withdrawal Fee Return</h3>

<p>
  For example, if a client pays a USD 20 withdrawal fee and the withdrawal
  cannot be processed because a restricted or unsupported bank was selected,
  3% of the USD 20 fee would be USD 0.60.
</p>

<p>
  The USD 0.60 would be deducted from the withdrawal fee, while the remaining
  USD 19.40, representing 97% of the withdrawal fee paid, would be returned
  to the client's GWENO Hub dashboard account balance, subject to applicable
  requirements.
</p>

<p>
  This calculation is made against the withdrawal fee only. It is not
  calculated against the client's normal dashboard balance and is not
  calculated against the amount the client attempted to withdraw.
</p>

<h3>Withdrawals Using Another Person's Bank Account</h3>

<p>
  GWENO Hub may allow a client to use another person's bank account details
  when initiating a bank withdrawal, but this is permitted only where the
  GWENO Hub team has reviewed and accepted the use of those third-party bank
  details.
</p>

<p>
  A client must not use another person's bank account details for a withdrawal
  without the acceptance or authorization of the GWENO Hub team.
</p>

<p>
  Where GWENO Hub accepts the use of another person's bank details, the client
  must still use their own correct GWENO Hub account information and provide
  accurate withdrawal information.
</p>

<p>
  The use of another person's bank account details does not transfer ownership
  of the client's GWENO Hub account, earnings, or dashboard balance to that
  person. The GWENO Hub account remains associated with the registered client
  who initiated the withdrawal.
</p>

<p>
  Third-party bank withdrawals are permitted only through banks and withdrawal
  channels that are authorized and supported by GWENO Hub.
</p>

<p>
  A client must not use another person's bank details to bypass restricted-bank
  rules, account verification requirements, security controls, geographic
  restrictions, withdrawal requirements, or any other GWENO Hub policy.
</p>

<p>
  GWENO Hub may request additional verification, supporting information, or
  confirmation from the client before accepting a withdrawal involving
  another person's bank account details.
</p>

<p>
  GWENO Hub may reject, delay, cancel, or return a withdrawal involving
  third-party bank details where the transaction cannot be reasonably
  verified, where the bank is not an authorized withdrawal channel, or where
  the transaction presents a security, fraud, compliance, or account-integrity
  concern.
</p>

<p>
  By submitting a withdrawal request, the client confirms that the bank
  details provided are accurate and that, where third-party bank details are
  used, the client has obtained any necessary permission from the account
  holder and has received the required acceptance from GWENO Hub.
</p>

<h2>13. Fees and Account Services</h2>

<p>
  Certain GWENO Hub services may involve activation, account, processing,
  withdrawal, premium, administrative, or profile-update charges.
  Applicable charges will be communicated through the platform before the
  relevant transaction is completed.
</p>

<p>
  The current fee for a name update is <strong>KES 480 (Four Hundred and
  Eighty Kenyan Shillings)</strong>, unless GWENO Hub publishes a revised
  fee.
</p>

<p>
  Users should carefully review transaction details before confirming a
  payment or service request.
</p>

<h2>14. Name Change Policy</h2>

<p>
  A user may request a name change only once every one month, subject to the
  applicable verification and account requirements.
</p>

<p>
  The restriction is intended to protect account integrity, reduce
  unauthorized changes, and maintain accurate account records.
</p>

<p>
  If a user starts the name-change process and proceeds with the applicable
  service, the request may be treated as having been initiated even where
  the user does not successfully complete the final submission.
</p>

<p>
  Users should therefore verify the spelling and accuracy of the intended
  name before starting a name-update request.
</p>

<h2>15. Identity and Verification</h2>

<p>
  GWENO Hub may conduct account, identity, transaction, task, security, and
  fraud-prevention checks where reasonably necessary.
</p>

<p>
  Users may be asked to provide information or documentation through official
  channels where necessary to confirm account ownership, age, identity,
  investigate suspicious activity, protect platform security, process a
  withdrawal, or comply with applicable legal or regulatory requirements.
</p>

<p>
  You must not submit false, altered, forged, stolen, expired where current
  documentation is required, or third-party identification documents as your
  own.
</p>

<p>
  Failure to complete a legitimate verification process may result in
  temporary restrictions on certain account services, including withdrawals.
</p>

<h2>16. Telephone Numbers and Account Information</h2>

<p>
  Telephone numbers provided during registration are securely stored within
  the GWENO Hub system and associated with the relevant account.
</p>

<p>
  GWENO Hub personnel will not ask users to send their registered telephone
  number through unofficial WhatsApp conversations, direct messages, calls,
  or other unofficial channels for routine account maintenance.
</p>

<p>
  Users should never disclose passwords, PINs, OTP codes, or other security
  credentials to individuals claiming to represent GWENO Hub through
  unofficial channels.
</p>

<h2>17. Communications and Support</h2>

<p>
  GWENO Hub may communicate with users regarding account activity, task
  availability, platform updates, verification, withdrawals, security, and
  important service information.
</p>

<p>
  Users may contact support through the official channels provided by GWENO
  Hub.
</p>

<p>
  Email support:
  <a href="mailto:businesshub.comke@gmail.com">
    businesshub.comke@gmail.com
  </a>
</p>

<p>
  WhatsApp support:
  <a href="https://wa.me/254765772203"
     target="_blank"
     rel="noopener noreferrer">
    Contact GWENO Hub Support on WhatsApp
  </a>
</p>

<h2>18. Customer Conduct</h2>

<p>
  Users must communicate respectfully with customer care representatives and
  other GWENO Hub personnel. Threats, harassment, intimidation, abusive
  communication, deliberate disruption, impersonation, and repeated
  unreasonable contact are prohibited.
</p>

<p>
  Further information is available in the
  
    Customer Conduct & Suspension Policy
  .
</p>

<h2>19. Fraud, Abuse and Computer Misuse</h2>

<p>
  You must not access, interfere with, damage, disrupt, manipulate, or
  attempt to gain unauthorized access to GWENO Hub systems, accounts,
  databases, communications, payment processes, or security mechanisms.
</p>

<p>
  You must not introduce malicious software, attempt unauthorized testing,
  exploit vulnerabilities without authorization, intercept communications,
  manipulate data, or interfere with the availability or integrity of the
  platform.
</p>

<p>
  Conduct involving fraud, unauthorized access, identity misuse, computer
  misuse, payment manipulation, or other unlawful activity may result in
  account restrictions and may be reported to appropriate authorities where
  required or permitted.
</p>

<h2>20. Suspension and Termination</h2>

<p>
  GWENO Hub may restrict, suspend, investigate, or terminate an account where
  there is reasonable evidence of fraud, misuse, security concerns,
  prohibited conduct, false information, unauthorized activity, geographic
  ineligibility, duplicate accounts, or a violation of these Terms.
</p>

<p>
  Depending on the circumstances, an account may be temporarily restricted
  while an investigation or verification process is conducted.
</p>

<p>
  Where an account is terminated for serious fraud, abuse, security
  violations, manipulation, or other prohibited conduct, GWENO Hub may
  withhold or remove affected rewards that have not been validly earned,
  subject to applicable law.
</p>

<p>
  A person whose account has been terminated must not create another account
  to bypass the termination.
</p>

<p>
  Users may contact support regarding an account restriction through the
  official support channels.
</p>

<h2>21. Inactive Accounts</h2>

<p>
  GWENO Hub may classify an account as inactive where the user has not logged
  in or otherwise used the platform for an extended period.
</p>

<p>
  Where an account remains inactive for more than <strong>12 consecutive
  months</strong>, GWENO Hub may close or restrict the account in accordance
  with its operational and legal requirements.
</p>

<p>
  Before taking action on an inactive account, GWENO Hub may provide notice
  where reasonably practicable and legally appropriate.
</p>

<h2>22. Taxes and User Responsibilities</h2>

<p>
  Rewards, earnings, incentives, payments, or other compensation received
  through GWENO Hub may be subject to taxation or other governmental charges
  under the laws applicable to the user.
</p>

<p>
  GWENO Hub does not provide individual tax advice and does not guarantee
  any particular tax treatment of earnings.
</p>

<p>
  Users are responsible for determining their own tax obligations and for
  complying with applicable tax laws, filing requirements, reporting
  requirements, duties, levies, and governmental charges relating to their
  earnings.
</p>

<p>
  Where applicable law requires GWENO Hub to withhold, collect, report, or
  provide information relating to taxes, GWENO Hub may do so in accordance
  with the applicable requirements.
</p>

<h2>23. Intellectual Property</h2>

<p>
  Unless otherwise stated, the GWENO Hub name, branding, website design,
  software, text, graphics, interfaces, logos, and other platform materials
  are protected by applicable intellectual-property rights.
</p>

<p>
  You may not copy, reproduce, distribute, modify, sell, reverse engineer,
  lease, commercially exploit, or otherwise misuse platform materials without
  appropriate authorization.
</p>

<p>
  Where you submit content to GWENO Hub for the purpose of completing a task,
  verification, review, support request, or platform operation, you grant
  GWENO Hub the limited rights reasonably necessary to receive, process,
  review, verify, store, display, and use that content for the relevant
  platform purpose, subject to applicable law and the GWENO Hub Privacy
  Policy.
</p>

<h2>24. Third-Party Services</h2>

<p>
  GWENO Hub may use third-party providers for payment processing,
  communications, hosting, authentication, analytics, infrastructure, 
  identity verification, task delivery, or other operational functions.
</p>

<p>
  Third-party services may be subject to their own terms, privacy practices,
  technical requirements, eligibility rules, and processing policies.
</p>

<p>
  GWENO Hub is not responsible for decisions, delays, outages, rejections,
  or other actions taken independently by third-party service providers,
  except to the extent responsibility cannot lawfully be excluded.
</p>

<h2>25. Platform Availability</h2>

<p>
  GWENO Hub aims to maintain reliable services but does not guarantee that
  the website or every feature will always be available without interruption.
</p>

<p>
  Services may be temporarily unavailable because of maintenance, technical
  problems, security measures, infrastructure failures, third-party
  interruptions, network issues, cyber incidents, natural events, or other
  circumstances beyond reasonable control.
</p>

<h2>26. Disclaimer of Warranties</h2>

<p>
  To the maximum extent permitted by applicable law, GWENO Hub and its
  services are provided on an "as is" and "as available" basis.
</p>

<p>
  GWENO Hub does not guarantee that the platform will always operate without
  interruption, delay, errors, defects, or security incidents, or that every
  task, earning opportunity, payment method, or feature will always be
  available.
</p>

<p>
  Nothing in this section excludes any warranty, right, or protection that
  cannot lawfully be excluded under applicable law.
</p>

<h2>27. Limitation of Liability</h2>

<p>
  To the extent permitted by applicable law, GWENO Hub will not be
  responsible for indirect, incidental, special, consequential, or similar
  losses arising from use of or inability to use the platform.
</p>

<p>
  This may include loss of profits, opportunities, data, goodwill, or
  business opportunities where such limitation is permitted by law.
</p>

<p>
  Nothing in these Terms is intended to exclude or restrict liability that
  cannot lawfully be excluded or restricted under applicable law.
</p>

<h2>28. Indemnification</h2>

<p>
  To the extent permitted by applicable law, you agree to be responsible for
  claims, losses, liabilities, damages, costs, or reasonable expenses arising
  directly from your unlawful use of GWENO Hub, your fraud or misuse of the
  platform, your violation of these Terms, or your infringement of another
  person's rights.
</p>

<h2>29. Privacy and Data Protection</h2>

<p>
  Information collected through GWENO Hub is handled in accordance with the
  platform's Privacy Policy and applicable data-protection requirements.
</p>

<p>
  Please review the
  
    GWENO Hub Privacy Policy
  
  for information about the collection, use, protection, retention, and
  handling of personal information.
</p>

<h2>30. Data Deletion</h2>

<p>
  Subject to applicable law, users may request deletion of personal
  information or closure of their account through the official GWENO Hub
  support channels.
</p>

<p>
  GWENO Hub may need to retain certain information where required by law,
  necessary for legitimate security or fraud-prevention purposes, required
  to resolve disputes, or otherwise permitted by applicable law.
</p>

<p>
  Account deletion does not necessarily erase information that GWENO Hub is
  legally required or otherwise lawfully permitted to retain.
</p>

<h2>31. Applicable Kenyan Law and International Requirements</h2>

<p>
  GWENO Hub seeks to operate in accordance with the laws applicable to its
  operations and users. Where applicable, these Terms are interpreted
  consistently with the laws of Kenya, including relevant requirements
  relating to contracts, consumer protection, personal data, electronic
  transactions, intellectual property, payments, fraud, and computer
  security.
</p>

<p>
  Relevant Kenyan legislation may include, as applicable:
</p>

<ul>
  <li>
    <strong>Constitution of Kenya, 2010</strong>, including applicable
    protections relating to privacy and fundamental rights.
  </li>

  <li>
    <strong>Data Protection Act, 2019</strong>, together with applicable
    regulations and guidance concerning personal data.
  </li>

  <li>
    <strong>Computer Misuse and Cybercrimes Act, 2018</strong>, as applicable
    to unauthorized access, interference, cybercrime, and computer-related
    misconduct.
  </li>

  <li>
    <strong>Consumer Protection Act, 2012</strong>, where applicable to
    consumer transactions and protections.
  </li>

  <li>
    <strong>Law of Contract Act (Cap. 23)</strong>, where applicable to
    contractual matters.
  </li>

  <li>
    Other applicable Kenyan legislation, regulations, regulatory
    requirements, and lawful governmental directions relevant to the
    services provided by GWENO Hub.
  </li>
</ul>

<p>
  GWENO Hub also seeks to respect applicable international legal requirements
  and generally recognized international principles relating to privacy,
  cybersecurity, intellectual property, consumer protection, sanctions,
  lawful online conduct, and cross-border digital services where those
  requirements or principles apply to the platform or a particular
  transaction.
</p>

<p>
  Nothing in these Terms is intended to apply Australian legislation or
  Australian governing-law requirements to GWENO Hub merely because similar
  provisions may appear in another platform's terms.
</p>

<h2>32. Changes to Services</h2>

<p>
  GWENO Hub may introduce, modify, suspend, reject, restrict, or discontinue
  features, tasks, rewards, campaigns, payment methods, or other services
  when reasonably necessary for operational, security, technical, commercial,
  or legal reasons.
</p>

<p>
  Task providers, advertisers, survey providers, and other third parties may
  also change or discontinue activities independently of GWENO Hub.
</p>

<p>
  Where a change materially affects users, information may be provided
  through the platform or another appropriate communication channel where
  reasonably practicable.
</p>

<h2>33. Severability</h2>

<p>
  If any provision of these Terms is determined by a competent authority to
  be invalid, unlawful, or unenforceable, that provision will be interpreted
  or limited to the minimum extent necessary, and the remaining provisions
  will continue to apply to the extent permitted by law.
</p>

<h2>34. No Waiver</h2>

<p>
  A failure or delay by GWENO Hub to enforce any provision of these Terms
  does not constitute a waiver of the right to enforce that provision or any
  other provision in the future.
</p>

<h2>35. Contact and Acceptance</h2>

<p>
  If you have questions about these Terms, contact GWENO Hub through the
  official support channels.
</p>

<p>
  Email:
  <a href="mailto:businesshub.comke@gmail.com">
    businesshub.comke@gmail.com
  </a>
</p>

<p>
  WhatsApp:
  <a href="https://wa.me/254765772203"
     target="_blank"
     rel="noopener noreferrer">
    GWENO Hub WhatsApp Support
  </a>
</p>

<div class="notice">
  <strong>Important:</strong> By creating an account, accessing the platform,
  accepting tasks, submitting work, requesting a withdrawal, or continuing
  to use GWENO Hub, you acknowledge that you have read, understood, and
  agreed to these Terms and Conditions.
</div>

<p>
  If you do not agree to these Terms, you must not create an account or use
  GWENO Hub.
</p>


  </div>

</main>

<footer>
  <p>© 2026 GWENO Hub. All rights reserved.</p>

  <p class="footer-legal-links">
    <a href="/terms">Terms &amp; Conditions</a>
    &nbsp;·&nbsp;
    <a href="/privacy">Privacy Policy</a>
    &nbsp;·&nbsp;
    <a href="/conduct">Conduct Policy</a>
  </p>

  <ul class="footer-links">
    <li><a href="/manual">Help Center</a></li>
    <li><a href="/terms">Terms of Service</a></li>
    <li><a href="/conduct">Conduct and Policies</a></li>
    <li><a href="/privacy">Privacy Policy</a></li>
    <li><a href="mailto:businesshub.comke@gmail.com">businesshub.comke@gmail.com</a></li>
  </ul>

  <p>
    Support:
    <a href="mailto:businesshub.comke@gmail.com">businesshub.comke@gmail.com</a>
  </p>
</footer>`;

export default function Terms() {
  useEffect(() => {
    const searchInput = document.getElementById("termsSearch");
    const clearButton = document.getElementById("clearSearch");
    const searchStatus = document.getElementById("searchStatus");
    const termsContent = document.getElementById("termsContent");

    if (!searchInput || !clearButton || !searchStatus || !termsContent) return;

    const searchableElements = Array.from(
      termsContent.querySelectorAll("h2, h3, p, li, .notice")
    );
    const originalHTML = new Map();
    searchableElements.forEach((element) => {
      originalHTML.set(element, element.innerHTML);
    });

    function escapeRegExp(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function clearHighlights() {
      searchableElements.forEach((element) => {
        element.innerHTML = originalHTML.get(element);
        element.classList.remove("search-hidden");
      });
    }

    function highlightText(element, query) {
      const original = originalHTML.get(element);
      const temp = document.createElement("div");
      temp.innerHTML = original;
      const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT, null);
      const textNodes = [];
      let node;

      while ((node = walker.nextNode())) {
        if (node.parentElement && node.parentElement.closest("script, style")) continue;
        textNodes.push(node);
      }

      const regex = new RegExp(escapeRegExp(query), "gi");
      textNodes.forEach((textNode) => {
        const text = textNode.nodeValue;
        if (!regex.test(text)) {
          regex.lastIndex = 0;
          return;
        }
        regex.lastIndex = 0;
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          const mark = document.createElement("mark");
          mark.className = "search-highlight";
          mark.textContent = match[0];
          fragment.appendChild(mark);
          lastIndex = match.index + match[0].length;
        }
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        textNode.parentNode.replaceChild(fragment, textNode);
      });
      element.innerHTML = temp.innerHTML;
    }

    function performSearch() {
      const query = searchInput.value.trim();
      clearHighlights();

      if (!query) {
        clearButton.style.display = "none";
        searchStatus.textContent = "";
        searchStatus.className = "search-status";
        return;
      }

      clearButton.style.display = "flex";
      let matchCount = 0;
      let firstMatch = null;

      searchableElements.forEach((element) => {
        const text = element.textContent || "";
        if (text.toLowerCase().includes(query.toLowerCase())) {
          matchCount++;
          if (!firstMatch) firstMatch = element;
          highlightText(element, query);
        } else {
          element.classList.add("search-hidden");
        }
      });

      if (matchCount === 0) {
        searchStatus.textContent = `No matching content found for "${query}".`;
        searchStatus.className = "search-status no-results";
        return;
      }

      searchStatus.textContent = `${matchCount}${matchCount === 1 ? " matching section found." : " matching sections found."}`;
      searchStatus.className = "search-status results";

      setTimeout(() => {
        if (firstMatch) firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }

    function clearSearch() {
      searchInput.value = "";
      clearHighlights();
      clearButton.style.display = "none";
      searchStatus.textContent = "";
      searchStatus.className = "search-status";
      searchInput.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") clearSearch();
    };

    searchInput.addEventListener("input", performSearch);
    clearButton.addEventListener("click", clearSearch);
    searchInput.addEventListener("keydown", handleKeyDown);

    return () => {
      searchInput.removeEventListener("input", performSearch);
      clearButton.removeEventListener("click", clearSearch);
      searchInput.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Terms & Conditions | GWENO HUB</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="terms-page" dangerouslySetInnerHTML={{ __html: TERMS_HTML }} />

      <style jsx global>{`:root {
      --text: #202124;
      --secondary: #5f6368;
      --border: #dadce0;
      --link: #1a73e8;
      --background: #ffffff;
      --search-background: #f8f9fa;
      --highlight: #fff2a8;
      --success: #188038;
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
      color: var(--text);
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

    .updated {
      color: var(--secondary);
      font-size: 14px;
      margin-bottom: 28px;
    }

    /* SEARCH */
    .terms-search {
      position: relative;
      margin: 0 0 42px;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 52px;
      border: 1px solid var(--border);
      border-radius: 28px;
      background: var(--search-background);
      transition: border-color 0.2s ease, box-shadow 0.2s ease,
        background 0.2s ease;
    }

    .search-box:focus-within {
      background: #ffffff;
      border-color: var(--link);
      box-shadow: 0 1px 4px rgba(60, 64, 67, 0.18);
    }

    .search-icon {
      width: 22px;
      height: 22px;
      margin-left: 17px;
      flex-shrink: 0;
      color: var(--secondary);
    }

    #termsSearch {
      width: 100%;
      height: 50px;
      border: 0;
      outline: none;
      background: transparent;
      padding: 0 46px 0 12px;
      color: var(--text);
      font-family: "Roboto", Arial, sans-serif;
      font-size: 16px;
    }

    #termsSearch::placeholder {
      color: var(--secondary);
    }

    .clear-search {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary);
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 22px;
      line-height: 1;
    }

    .clear-search:hover {
      background: #e8eaed;
      color: var(--text);
    }

    .search-status {
      min-height: 24px;
      margin-top: 9px;
      padding-left: 17px;
      color: var(--secondary);
      font-size: 13px;
    }

    .search-status.no-results {
      color: #b3261e;
      font-weight: 500;
    }

    .search-status.results {
      color: var(--success);
    }

    mark.search-highlight {
      background: var(--highlight);
      color: inherit;
      padding: 1px 2px;
      border-radius: 3px;
    }

    .search-hidden {
      display: none !important;
    }

    h2 {
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 22px;
      font-weight: 500;
      line-height: 1.35;
      margin: 42px 0 16px;
      scroll-margin-top: 30px;
    }

    h3 {
      font-family: "Google Sans", Arial, sans-serif;
      font-size: 18px;
      font-weight: 500;
      margin: 28px 0 12px;
    }

    p {
      margin: 0 0 18px;
    }

    ul,
    ol {
      margin: 0 0 20px;
      padding-left: 24px;
    }

    li {
      margin-bottom: 8px;
    }

    a {
      color: var(--link);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
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

    .notice {
      border-left: 3px solid var(--border);
      padding: 14px 18px;
      margin: 24px 0;
      color: var(--secondary);
      background: #fafafa;
    }

    .restricted-banks {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px 22px;
      margin: 24px 0 28px;
      background: #fafafa;
    }

    .restricted-banks strong {
      font-family: "Google Sans", Arial, sans-serif;
    }

    .restricted-banks h3 {
      margin-top: 18px;
    }

    .restricted-banks h3:first-child {
      margin-top: 0;
    }

    footer {
      max-width: 760px;
      margin: 0 auto;
      padding: 32px 24px 48px;
      border-top: 1px solid var(--border);
      color: var(--secondary);
      font-size: 14px;
    }

    footer p {
      margin-bottom: 8px;
    }

    .footer-links {
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 18px;
      margin: 14px 0;
      padding: 0;
    }

    .footer-links li {
      margin: 0;
    }

    /* Mobile */
    @media (max-width: 600px) {
      header {
        padding: 16px 20px;
      }

      main {
        padding: 48px 20px 60px;
      }

      h1 {
        font-size: 32px;
      }

      h2 {
        font-size: 20px;
        margin-top: 36px;
      }

      body {
        font-size: 15px;
      }

      .legal-nav {
        padding: 12px 20px;
      }

      .legal-nav-inner {
        gap: 12px 16px;
      }

      #termsSearch {
        font-size: 15px;
      }

      .restricted-banks {
        padding: 18px;
      }
    }
      `}</style>
    </>
  );
}
