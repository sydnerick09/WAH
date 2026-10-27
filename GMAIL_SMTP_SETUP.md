# GWENO Gmail SMTP setup

GWENO sends automated email through Gmail SMTP only. All outgoing mail uses `businesshub.comke@gmail.com` as the sender. Resend and domain mailboxes are not used by the shared email transport.

## Vercel environment variables

In Vercel, open the GWENO project → Settings → Environment Variables and set these for Production (and Preview/Development if needed):

- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `465`
- `SMTP_SECURE` = `true`
- `SMTP_USER` = `businesshub.comke@gmail.com`
- `SMTP_PASS` = the Google App Password created for that Gmail account (enter the 16 characters; spaces are removed by the app)
- `SMTP_FROM_EMAIL` = `businesshub.comke@gmail.com`
- `SMTP_REPLY_TO_EMAIL` = `businesshub.comke@gmail.com`
- `EMAIL_FROM_NAME` = `GWENO Hub`
- `NOTIFY_EMAIL` = `businesshub.comke@gmail.com`
- `ADMIN_EMAIL` = `businesshub.comke@gmail.com`

Do not put your normal Gmail password in `SMTP_PASS`. Never commit the app password to Git or include it in chat.

## Remove old Resend variables

Remove `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_REPLY_TO_EMAIL` from Vercel if present. The application no longer requires them.

## Redeploy and test

After saving variables, redeploy the latest production deployment. Test a password reset, one admin email, and one task/activation notification. Check Vercel Runtime Logs for any SMTP authentication or delivery errors. A successful SMTP response means Gmail accepted the message, not that it necessarily reached the inbox; also check Spam.

## Common Gmail errors

- `535 5.7.8 Authentication failed`: confirm `SMTP_USER` is exactly `businesshub.comke@gmail.com` and `SMTP_PASS` is the current Google App Password, not the normal password.
- `454 4.7.0 Too many login attempts`: wait before retrying, avoid repeated rapid tests, and do not trigger large broadcasts while testing.
- Timeout/connection error: keep port `465` with `SMTP_SECURE=true`; do not mix it with port `587`.
