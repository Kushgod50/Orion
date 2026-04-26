const Anthropic = require("@anthropic-ai/sdk");

module.exports = async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { type, niche, subtopic, goal, platform, qty, topic, imageBase64 } = req.body || {};
  const count = parseInt(qty) || 1;
  const plat = platform || "YouTube";

  try {
    let messages;

    if (type === "ideas") {
      messages = [{
        role: "user",
        content: "Generate exactly " + count + " viral " + plat + " video ideas for niche: \"" + niche + "\"" +
          (subtopic ? " angle: \"" + subtopic + "\"" : "") +
          (goal ? " goal: " + goal : "") +
          ". Reply with ONLY this JSON and nothing else: {\"ideas\":[{\"title\":\"t\",\"hook\":\"h\",\"type\":\"Tutorial\",\"difficulty\":\"Easy\",\"potential\":\"High\"}]}"
      }];
    } else if (type === "seo") {
      messages = [{
        role: "user",
        content: "You are a " + plat + " SEO expert. Topic: \"" + topic + "\", niche: \"" + (niche || "general") + "\". Generate " + count + " title option(s). Reply with ONLY this JSON and nothing else: {\"titles\":[\"title here\"],\"description\":\"seo description 150-200 words keywords in first 2 lines\",\"tags\":[\"tag1\",\"tag2\"],\"insight\":\"one seo tip\"}"
      }];
    } else if (type === "thumbnail") {
      messages = [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
          { type: "text", text: "Analyze this YouTube thumbnail for a " + (niche || "YouTube") + " creator. Reply with ONLY this JSON and nothing else: {\"score\":80,\"summary\":\"summary here\",\"textReadability\":75,\"visualContrast\":80,\"emotionalImpact\":70,\"mobileClarity\":75,\"strengths\":[{\"point\":\"p\",\"impact\":\"i\"}],\"improvements\":[{\"issue\":\"i\",\"fix\":\"f\",\"priority\":\"High\"}]}" }
        ]
      }];
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: messages
    });

    const raw = response.content.map(function (c) { return c.text || ""; }).join("");
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(clean);
    return res.status(200).json({ success: true, data: data });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
