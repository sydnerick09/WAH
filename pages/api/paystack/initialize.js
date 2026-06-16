
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, amount, phone, plan } = req.body;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://onlinejob-pi.vercel.app';
  // Always route through /payment-success so verification happens server-side
  const callbackUrl = `${baseUrl}/payment-success?plan=${encodeURIComponent(plan || 'activation')}`;

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // convert to lowest denomination
        channels: ["card", "mobile_money"],
        metadata: {
          phone,
          plan: plan || 'activation',
          custom_fields: [
            { display_name: "Phone Number", variable_name: "phone", value: phone },
          ],
        },
        callback_url: callbackUrl,
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
