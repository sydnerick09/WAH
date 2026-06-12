// pages/api/paystack/verify.js

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ status: false, message: 'Missing reference' });
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
