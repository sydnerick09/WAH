
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, amount, phone } = req.body;

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100,  
       
        
        // kobo
        channels: ["card", "mobile_money"], // 👈 enables M-Pesa option
        metadata: {
          phone,
          custom_fields: [
            {
              display_name: "Phone Number",
              variable_name: "phone",
              value: phone,
            },
          ],
        },
        callback_url: 'https://onlinejob-pi.vercel.app/payment-success',
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}       




