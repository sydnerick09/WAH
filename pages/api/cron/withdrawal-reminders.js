/**
 * Automatic withdrawal reminder emails have been disabled.
 * This endpoint is intentionally inactive; no CRON_SECRET or scheduler is required.
 */
export default function handler(req, res) {
  res.setHeader('Allow', 'GET, POST');
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }
  return res.status(410).json({
    success: false,
    disabled: true,
    message: 'Automatic withdrawal reminder emails are disabled.'
  });
}
