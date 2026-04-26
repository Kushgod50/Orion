import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { type, niche, subtopic, goal, platform, qty, topic, imageBase64 } =
    req.body || {};

  if (!type) return res.status(400).json({ error: "Missing type" });

  try {
    let messages = [];

    // ── IDEAS ──────────────────────────────────────────────────────────
    if (type === "ideas") {
      if (!niche) return res.status(400).json({ error: "Missing niche" });
      const count = parseInt(qty) || 1;
      messages = [
        {
          role: "user",
          content: `Generate exactly ${count} viral ${platform || "YouTube"} video idea${count > 1 ? "s" : ""} for the "${niche}" niche${subtopic ? `, angle: "${subtopic}"` : ""}${goal ? `. Goal: ${goal}` : ""}.

Return ONLY valid JSON, no markdown, no explanation:
{"ideas":[{"title":"string","hook":"one compelling sentence","type":"Tutorial|Listicle|Story|Challenge|Review|Vlog","difficulty":"Easy|Medium|Hard","potential":"High|Very High|Viral"}]}

Exactly ${count} idea${count > 1 ? "s" : ""}. No extra text.`,
        },
      ];
    }

    // ── SEO ────────────────────────────────────────────────────────────
    else if (type === "seo") {
      if (!topic) return res.status(400).json({ error: "Missing topic" });
      const count = parseInt(qty) || 1;
      messages = [
        {
          role: "user",
          content: `You are a world-class ${platform || "YouTube"} SEO expert. Generate a full SEO package for the video topic: "${topic}" in the "${niche || "general"}" niche.

Return ONLY valid JSON, no markdown, no explanation:
{
  "titles": ["array of exactly ${count} optimized title string${count > 1 ? "s" : ""}, each under 70 characters, written for high CTR"],
  "description": "150-200 word SEO-optimized video description with keywords naturally in the first 2 lines",
  "tags": ["exactly 15 relevant search tags, mix of broad and specific"],
  "insight": "one specific actionable SEO tip for this exact topic"
}

No extra text outside the JSON.`,
        },
      ];
    }

    // ── THUMBNAIL ──────────────────────────────────────────────────────
    else if (type === "thumbnail") {
      if (!imageBase64)
        return res.status(400).json({ error: "Missing image" });
      messages = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `You are an expert YouTube thumbnail designer and CTR specialist. Analyze this thumbnail for a ${niche || "YouTube"} channel.

Return ONLY valid JSON, no markdown:
{
  "score": <integer 0-100>,
  "summary": "2-3 sentence overall assessment",
  "textReadability": <integer 0-100>,
  "visualContrast": <integer 0-100>,
  "emotionalImpact": <integer 0-100>,
  "mobileClarity": <integer 0-100>,
  "strengths": [{"point": "specific strength", "impact": "why it helps CTR"}],
  "improvements": [{"issue": "specific problem", "fix": "exact how to fix it", "priority": "High|Medium|Low"}]
}

No extra text outside the JSON.`,
            },
          ],
        },
      ];
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages,
    });

    const raw = response.content.map((c) => c.text || "").join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Orion API error:", err);
    return res.status(500).json({
      error: "AI request failed",
      detail: err.message,
    });
  }
}
