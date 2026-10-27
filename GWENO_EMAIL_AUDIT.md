# GWENO Email Audit (source-code review)

Reviewed source files in this ZIP, excluding compiled `.next` output. This report describes code paths, not live provider delivery: this ZIP does not contain Vercel environment values or Resend delivery logs.

## Email delivery configuration
- The shared `lib/emailTransport.js` sends through the Resend API only.
- Required runtime settings: `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; `RESEND_FROM_EMAIL` must be a valid sender verified in Resend. `EMAIL_FROM_NAME`, `RESEND_REPLY_TO_EMAIL`, `NOTIFY_EMAIL`, and `ADMIN_EMAIL` control display/reply/admin routing.
- `.env.example` contains blank API-key placeholders and `onboarding@resend.dev`; this example is not proof that production is configured. Resend acceptance also does not prove inbox delivery.
- No source code can confirm the live Vercel values or provider delivery logs from this ZIP.

## Email inventory

| # | Email / subject purpose | When it is sent | Code status in this ZIP | Delivery / caveat |
|---:|---|---|---|---|
| 1 | New client registration welcome | Immediately after a new client account is created | **Added in this update** (`pages/api/db.js`, `registerUser`) | Best-effort; registration still succeeds if email fails. Requires working Resend settings. |
| 2 | Agent referral: client joined | After registration where the direct referrer resolves to an active agent | Existing (`pages/api/db.js`, `registerUser`) | Conditional on a valid direct agent referral and active agent status; not sent to an inactive/non-agent referrer. |
| 3 | Account activation confirmation | When the server-side activation paths activate an account | Existing in two activation paths (`pages/api/db.js`) | Wired but best-effort; the two paths use similar subjects and should be monitored for duplicate triggers. |
| 4 | Premium subscription active | When Premium is activated through applicable server-side payment/balance flows | Existing in multiple paths (`pages/api/db.js`) | Wired but best-effort; depends on the path being used and Resend configuration. |
| 5 | Premium renewal confirmation | Built by `lib/subscriptionEmail.js` when called with `type: 'premium'` and `wasPremium: true` | Template exists | Conditional on caller passing renewal flags; live delivery not verified. |
| 6 | Password reset link | After a valid password-reset request generates a reset URL | Existing (`lib/resetEmail.js`, `pages/api/db.js`) | Wired; token/reset URL must be valid and Resend configured. |
| 7 | Payment confirmation (M-Pesa) | Intended after a successful, verified M-Pesa payment | Helper exists (`lib/paymentEmail.js`) | **Not wired to any caller in source**; `sendPaymentConfirmationEmail` is defined but no source file invokes it. Do not assume these emails are sent. |
| 8 | Withdrawal request received — admin | When a standard client withdrawal request is created | Existing (`pages/api/db.js`) | Wired; sends to configured admin notification address. |
| 9 | Withdrawal request received — client | After the standard withdrawal request is created | Existing (`pages/api/db.js`) | Wired; best-effort. |
| 10 | Withdrawal status update / approval | When admin changes withdrawal status; approved normal withdrawals include the Premium-upgrade notice | Existing (`pages/api/db.js`) | Wired for status changes; email text differs for approval vs other statuses. |
| 11 | Withdrawal marked paid | When admin marks a withdrawal as paid | Existing (`pages/api/db.js`) | Wired; best-effort. |
| 12 | Withdrawal-fee payment verified | When an admin manually verifies a withdrawal-fee payment | Existing (`pages/api/db.js`) | Conditional on payment purpose being a withdrawal fee. |
| 13 | New task application alert — admin | Whenever a new task proposal is saved successfully | **Added in this update** (`pages/api/db.js`, `createApplication`) | Best-effort to `NOTIFY_EMAIL`, then `ADMIN_EMAIL`, then fallback Gmail. |
| 14 | Task application approved / correction requested / declined — client | After an admin changes an application to a non-pending status | Existing (`pages/api/db.js`, `adminUpdateApplication`) | Wired for non-pending decisions; email failure does not undo the status update. |
| 15 | Task submission sent — admin | When a client uploads a task submission | Existing (`pages/api/submit-task.js`) | Includes the uploaded work as an attachment; relies on Resend attachment support and admin recipient settings. |
| 16 | Task submission received — client | After task submission upload is processed | Existing (`pages/api/submit-task.js`) | Best-effort confirmation. |
| 17 | Task verified and approved / rejected / corrections required — client | When a creator/admin reviews a task submission | Existing (`pages/api/db.js`, submission-review paths) | Wired; approval email includes the credited amount/balance when approved. |
| 18 | Task Approved & Earnings Credited — resend | When an admin presses the resend-approval action | Existing (`lib/approvalEmail.js`, admin action) | Manual resend path exists; same email can be resent. |
| 19 | Task returned for corrections — client | When admin manually sends a correction message | Existing (`pages/api/correction-email.js`, admin UI) | Manual, not automatic for every correction action. |
| 20 | Contact/support message — admin | When a client sends a support/contact request | Existing (`pages/api/notify.js`) | Sends details to configured admin inbox. |
| 21 | Contact/support acknowledgment — client | After the support request is received | Existing (`pages/api/notify.js`) | Best-effort automatic reply. |
| 22 | Agent invitation — client | When admin invites a selected client to apply as an agent | Existing (`pages/api/db.js`) | Conditional on the admin invitation action. |
| 23 | Agent application with CV — admin | When an agent application form is submitted | Existing (`pages/api/db.js`) | Includes uploaded CV attachment; best-effort. |
| 24 | Agent application approved / declined — applicant | When admin reviews an agent application | Existing (`pages/api/db.js`) | Conditional on admin decision. |
| 25 | Agent weekly performance reminder | When the corresponding agent reminder action is invoked | Existing (`pages/api/db.js`) | Code path exists; this ZIP does not establish an automatic scheduler. |
| 26 | Agent reward earned | When reward processing adds a reward at the configured qualified-client threshold | Existing (`pages/api/db.js`) | Conditional on reward balance actually being added. |
| 27 | Agent commission earned | When an approved client withdrawal qualifies the referral chain for commission | Existing (`pages/api/db.js`) | Conditional on the referral/qualification logic and agent having an email. |
| 28 | Agent commission withdrawal request — admin | When an agent requests a commission payout | Existing (`pages/api/db.js`) | Best-effort admin alert. |
| 29 | Agent commission withdrawal request received — agent | After an agent commission payout request is created | Existing (`pages/api/db.js`) | Best-effort client/agent confirmation. |
| 30 | Agent account hold notice | When the admin bulk-hold action places a client account on hold | Existing (`pages/api/admin/bulk-hold.js`) | Conditional on that admin action. |
| 31 | Profile updated | When a supported profile field is updated | Existing (`pages/api/db.js`) | Some profile-update paths send this email; some updates may use different actions. |
| 32 | Profile picture updated | When a client profile picture is updated | Existing (`pages/api/db.js`) | Best-effort. |
| 33 | Optional registration CV received — admin | When a registrant uses the optional CV upload endpoint | Existing (`pages/api/apply-cv.js`, called by `pages/register.js`) | Conditional on CV upload; response can succeed while `emailSent` is false. |
| 34 | Admin one-to-one email | When admin manually sends an email from the admin panel | Existing (`pages/api/admin/send-email.js`) | Manual action; provider acceptance does not guarantee delivery. |
| 35 | Admin broadcast / promotional email | When admin sends a broadcast to selected recipient groups | Existing (`pages/api/broadcast.js`) | Manual action; respects unsubscribe flags and recipient group filters. |
| 36 | Standalone activation/Premium email endpoint | If `/api/send-activation-email` is called directly | Endpoint exists (`pages/api/send-activation-email.js`) | **No caller found in the source files in this ZIP**; likely unused unless invoked externally. |

## Important findings
1. The agent referral notification already exists, but it is only sent when the registration request resolves to an **active direct agent**. Check that the link carries the agent code (`?ref=...`) and that the agent is approved/active.
2. Before this update, the source did not send a welcome email to the newly registered client and did not alert admin when a task proposal was first submitted. Both paths have now been added.
3. `lib/paymentEmail.js` defines a payment-confirmation helper, but it is not called anywhere in the source. It will not automatically send payment confirmations until wired into the successful payment-completion flow.
4. The standalone `/api/send-activation-email` endpoint is not referenced by any source caller in this ZIP.
5. A code path marked “wired” means the application attempts to send the email. Actual inbox delivery remains **unverified** until the deployed Vercel environment variables and Resend logs are checked.
