const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function (req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // req.body must be raw buffer for signature verification
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // ── Handle events ──────────────────────────────────────────────────────
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const email = session.customer_email;
      const plan = session.metadata?.plan;
      const billing = session.metadata?.billing;
      console.log(`✓ New subscriber: ${email} — ${plan} (${billing})`);
      // TODO: Save to your database (Supabase, etc.)
      // await db.upsertUser({ email, plan, billing, status: 'active' })
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const plan = sub.metadata?.plan;
      console.log(`↻ Subscription updated: ${sub.id} — ${plan} — ${sub.status}`);
      // TODO: Update user plan in database
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      console.log(`✗ Subscription cancelled: ${sub.id}`);
      // TODO: Downgrade user to free in database
      break;
    }

    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  return res.status(200).json({ received: true });
};

// Vercel needs raw body for Stripe webhook signature verification
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(Buffer.from(data)));
    req.on("error", reject);
  });
}
