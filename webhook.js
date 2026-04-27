const Anthropic = require("@anthropic-ai/sdk");

module.exports = async function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  var body = req.body || {};
  var type = body.type;
  var niche = body.niche || "";
  var subtopic = body.subtopic || "";
  var goal = body.goal || "";
  var platform = body.platform || "YouTube";
  var qty = parseInt(body.qty) || 1;
  var topic = body.topic || "";
  var imageBase64 = body.imageBase64 || "";
  var imageMediaType = body.imageMediaType || "image/jpeg";
  var planType = body.planType || "week";
  var platforms = body.platforms || [];
  var followers = body.followers || "";
  var growthGoal = body.growthGoal || "";

  // Token limits per request type — year plan needs the most headroom
  var maxTokens = 1500;
  if (type === "plan") {
    if (planType === "week") maxTokens = 3000;
    else if (planType === "month") maxTokens = 5000;
    else if (planType === "year") maxTokens = 8000;
  }

  var messages = [];

  try {

    // ── IDEAS ──────────────────────────────────────────────────────────────
    if (type === "ideas") {
      var prompt = "Generate exactly " + qty + " viral " + platform + " video idea" + (qty > 1 ? "s" : "") + " for niche: \"" + niche + "\"";
      if (subtopic) prompt += ", angle: \"" + subtopic + "\"";
      if (goal) prompt += ", goal: " + goal;
      prompt += ". Return ONLY valid JSON, no markdown:\n{\"ideas\":[{\"title\":\"string\",\"hook\":\"one sentence\",\"type\":\"Tutorial|Listicle|Story|Challenge|Review|Vlog\",\"difficulty\":\"Easy|Medium|Hard\",\"potential\":\"High|Very High|Viral\"}]}\nExactly " + qty + " ideas. No extra text.";
      messages = [{ role: "user", content: prompt }];
    }

    // ── SEO ────────────────────────────────────────────────────────────────
    else if (type === "seo") {
      var seoPrompt = platform + " SEO expert. Topic: \"" + topic + "\", niche: \"" + (niche || "general") + "\". Generate " + qty + " title" + (qty > 1 ? "s" : "") + ".\nReturn ONLY valid JSON no markdown:\n{\"titles\":[\"under 70 chars each\"],\"description\":\"120-150 word SEO description, keywords in first 2 lines\",\"tags\":[\"15 tags\"],\"insight\":\"one SEO tip\"}\nNo extra text.";
      messages = [{ role: "user", content: seoPrompt }];
    }

    // ── THUMBNAIL ──────────────────────────────────────────────────────────
    else if (type === "thumbnail") {
      var detectedType = imageMediaType;
      try {
        var header = imageBase64.substring(0, 16);
        var bytes = Buffer.from(header, "base64");
        if (bytes[0] === 0x89 && bytes[1] === 0x50) detectedType = "image/png";
        else if (bytes[0] === 0xFF && bytes[1] === 0xD8) detectedType = "image/jpeg";
        else if (bytes[0] === 0x47 && bytes[1] === 0x49) detectedType = "image/gif";
        else if (bytes[0] === 0x52 && bytes[1] === 0x49) detectedType = "image/webp";
      } catch(e) { detectedType = "image/png"; }

      messages = [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: detectedType, data: imageBase64 } },
          { type: "text", text: "Analyze this YouTube thumbnail for a " + (niche || "YouTube") + " creator.\nReturn ONLY valid JSON no markdown:\n{\"score\":80,\"summary\":\"2 sentences\",\"textReadability\":75,\"visualContrast\":80,\"emotionalImpact\":70,\"mobileClarity\":75,\"strengths\":[{\"point\":\"s\",\"impact\":\"i\"}],\"improvements\":[{\"issue\":\"i\",\"fix\":\"f\",\"priority\":\"High|Medium|Low\"}]}\nNo extra text." }
        ]
      }];
    }

    // ── CONTENT PLAN ───────────────────────────────────────────────────────
    else if (type === "plan") {
      var platformList = platforms.length > 0 ? platforms.join(", ") : platform;
      var creatorProfile = "Niche: " + niche + (subtopic ? " (" + subtopic + ")" : "") + ". Platforms: " + platformList + ". Followers: " + (followers || "not specified") + ". Goal: " + (growthGoal || goal || "grow audience") + ".";

      if (planType === "week") {
        messages = [{ role: "user", content: "Elite social media growth strategist. " + creatorProfile + "\n\nCreate a 7-day content plan. Calculate ideal posting frequency to reach the goal.\n\nReturn ONLY valid JSON no markdown:\n{\"summary\":\"2 sentences\",\"weeklyGoal\":\"measurable goal\",\"weeklyTheme\":\"theme\",\"recommendedFrequency\":\"frequency + why it reaches goal\",\"days\":[{\"day\":\"Monday\",\"platform\":\"p\",\"contentType\":\"t\",\"title\":\"specific title\",\"hook\":\"hook sentence\",\"bestTime\":\"time\",\"tip\":\"production tip\"}],\"videoIdeas\":[{\"title\":\"t\",\"hook\":\"h\",\"priority\":\"High|Medium\"}],\"growthTips\":[\"tip1\",\"tip2\",\"tip3\"]}\nAll 7 days. No extra text." }];
      }

      else if (planType === "month") {
        messages = [{ role: "user", content: "Elite social media growth strategist. " + creatorProfile + "\n\nCreate a 30-day content plan with 4 weeks. Calculate ideal posting frequency.\n\nReturn ONLY valid JSON no markdown:\n{\"summary\":\"2 sentences\",\"monthlyGoal\":\"goal\",\"recommendedFrequency\":\"frequency + why\",\"weeks\":[{\"week\":1,\"theme\":\"t\",\"focus\":\"f\",\"posts\":[{\"platform\":\"p\",\"title\":\"title\",\"hook\":\"hook\",\"contentType\":\"t\",\"dayOfWeek\":\"day\"}],\"milestone\":\"m\",\"bonusIdeas\":[{\"title\":\"t\",\"hook\":\"h\"}]}],\"contentPillars\":[\"p1\",\"p2\",\"p3\"],\"growthTips\":[\"t1\",\"t2\",\"t3\",\"t4\"]}\nAll 4 weeks with 3-4 posts each and 2 bonus ideas per week. No extra text." }];
      }

      else if (planType === "year") {
        // Year plan split into leaner structure to avoid token overflow
        messages = [{ role: "user", content: "Elite social media growth strategist. " + creatorProfile + "\n\nCreate a 12-month content roadmap. Calculate ideal posting frequency to reach the goal. Provide Q1-Q4, each with 3 months. Each month gets 3 video ideas + 2 bonus ideas. Keep all text fields SHORT (under 15 words each).\n\nReturn ONLY valid JSON no markdown:\n{\"summary\":\"2 sentences\",\"yearlyGoal\":\"goal\",\"recommendedFrequency\":\"frequency + why\",\"quarters\":[{\"quarter\":\"Q1\",\"months\":\"Jan-Mar\",\"theme\":\"theme\",\"focus\":\"focus\",\"milestone\":\"milestone\",\"monthlyPlans\":[{\"month\":\"January\",\"theme\":\"theme\",\"videosToPost\":3,\"ideas\":[{\"title\":\"title\",\"hook\":\"hook\",\"contentType\":\"Tutorial\",\"priority\":\"High\"}],\"bonusIdeas\":[{\"title\":\"t\",\"hook\":\"h\"}]}]}],\"brandEvolution\":\"sentence\",\"monetizationPath\":\"sentence\",\"growthTips\":[\"t1\",\"t2\",\"t3\",\"t4\",\"t5\"]}\nAll 4 quarters, all 12 months, all 36+ video ideas. Keep fields short. No extra text." }];
      }
    }

    else {
      return res.status(400).json({ error: "Invalid type" });
    }

    var response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: messages
    });

    var raw = response.content.map(function (c) { return c.text || ""; }).join("");
    var clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    // Safety net: attempt to repair truncated JSON by closing open structures
    var data;
    try {
      data = JSON.parse(clean);
    } catch (parseErr) {
      // Try to repair by trimming to last valid complete object
      var repaired = repairJSON(clean);
      try {
        data = JSON.parse(repaired);
      } catch (e2) {
        return res.status(500).json({ error: "Response was cut off. Please try again — if this keeps happening, try a shorter goal description." });
      }
    }

    return res.status(200).json({ success: true, data: data });

  } catch (err) {
    console.error("Orion error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Attempt to close unclosed JSON structures from a truncated string
function repairJSON(str) {
  // Count open/close braces and brackets
  var opens = 0, depth = [];
  var inString = false, escaped = false;

  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inString) { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') depth.push('}');
    else if (c === '[') depth.push(']');
    else if (c === '}' || c === ']') depth.pop();
  }

  // Close any dangling string
  if (inString) str += '"';

  // Remove trailing comma if any
  str = str.replace(/,\s*$/, '');

  // Close all open structures in reverse
  while (depth.length > 0) {
    str += depth.pop();
  }

  return str;
}
