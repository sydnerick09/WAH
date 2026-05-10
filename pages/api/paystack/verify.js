export default async function handler(req, res) {
  const { reference } = req.query;

  // check if reference exists
  if (!reference) {
    return res.status(400).json({
      status: false,
      message: 'Payment reference is required',
    });
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    // successful verification
    if (data.status) {
      return res.status(200).json(data);
    }

    // verification failed
    return res.status(400).json({
      status: false,
      message: data.message || 'Verification failed',
    });

  } catch (err) {
    console.error('Paystack Verify Error:', err);

    return res.status(500).json({
      status: false,
      message: 'Server error verifying payment',
      error: err.message,
    });
  }
}