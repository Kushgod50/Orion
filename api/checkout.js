const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  basic_monthly: "price_1TQenbDBdG6Whx36lQnVQnUX",
  basic_yearly: "price_1TQeodDBdG6Whx36wcAdNXun",
  premium_monthly: "price_1TQepBDBdG6Whx36I40ePaWW",
  premium_yearly: "price_1TQeqODBdG6Whx36eoCmBK33",
};

module.exports = async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { plan, billing, email } = req.body || {};

  const key = `${plan}_${billing}`;
  const priceId = PRICES[key];

  if (!priceId) {
    return res.status(400).json({ error: "Invalid plan or billing period" });
  }

  const baseUrl = process.env.APP_URL || "https://your-app.vercel.app";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing.html`,
      metadata: { plan, billing },
      subscription_data: {
        metadata: { plan, billing },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: err.message });
  }
};
