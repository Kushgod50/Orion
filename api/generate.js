const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var body = req.body || {};
  var type = body.type;
  var niche = body.niche;
  var subtopic = body.subtopic;
  var goal = body.goal;
  var platform = body.platform || "YouTube";
  var qty = parseInt(body.qty) || 1;
  var topic = body.topic;
  var imageBase64 = body.imageBase64;

  if (!type) return res.status(400).json({ error: "Missing type" });

  var messages = [];

  if (type === "ideas") {
    if (!niche) return res.status(400).json({ error: "Missing niche" });
    var prompt = "Generate exactly " + qty + " viral " + platform + " video idea" + (qty > 1 ? "s" : "") + " for the niche: " + niche;
    if (subtopic) prompt += ", angle: " + subtopic;
    if (goal) prompt += ". Goal: " + goal;
    prompt += ". Return ONLY valid JSON, no markdown, no extra text: {\"ideas\":[{\"title\":\"string\",\"hook\":\"one compelling sentence\",\"type\":\"Tutorial|Listicle|Story|Challenge|Review|Vlog\",\"difficulty\":\"Easy|Medium|Hard\",\"potential\":\"High|Very High|Viral\"}]}";
    messages = [{ role: "user", content: prompt }];
  }

  else if (type === "seo") {
    if (!topic) return res.status(400).json({ error: "Missing topic" });
    var seoPrompt = "You are a world-class " + platform + " SEO expert. Generate a full SEO package for the video topic: " + topic + " in the " + (niche || "general") + " niche. Return ONLY valid JSON, no markdown, no extra text: {\"titles\":[\"" + qty + " optimized title" + (qty > 1 ? "s" : "") + " under 70 chars\"],\"description\":\"150-200 word SEO description with keywords in first 2 lines\",\"tags\":[\"15 search tags\"],\"insight\":\"one specific SEO tip\"}";
    messages = [{ role: "user", content: seoPrompt }];
  }

  else if (type === "thumbnail") {
    if (!imageBase64) return res.status(400).json({ error: "Missing image" });
    var thumbPrompt = "You are an expert YouTube thumbnail analyst for a " + (niche || "YouTube") + " channel. Analyze this thumbnail. Return ONLY valid JSON, no markdown: {\"score\":75,\"summary\":\"2 sentences\",\"textReadability\":80,\"visualContrast\":70,\"emotionalImpact\":75,\"mobileClarity\":65,\"strengths\":[{\"point\":\"string\",\"impact\":\"string\"}],\"improvements\":[{\"issue\":\"string\",\"fix\":\"string\",\"priority\":\"High|Medium|Low\"}]}";
    messages = [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
        { type: "text", text: thumbPrompt }
      ]
    }];
  }

  else {
    return res.status(400).json({ error: "Invalid type" });
  }

  try {
    var response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: messages
    });

    var raw = response.content.map(function(c) { return c.text || ""; }).join("");
    var clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    var data = JSON.parse(clean);

    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    console.error("Orion error:", err);
    return res.status(500).json({ error: "AI request failed", detail: err.message });
  }
};
