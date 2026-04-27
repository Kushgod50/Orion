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

  var messages = [];

  try {

    // ── IDEAS ──────────────────────────────────────────────────────────────
    if (type === "ideas") {
      var prompt = "Generate exactly " + qty + " viral " + platform + " video idea" + (qty > 1 ? "s" : "") + " for niche: \"" + niche + "\"";
      if (subtopic) prompt += ", angle: \"" + subtopic + "\"";
      if (goal) prompt += ", creator goal: " + goal;
      prompt += ". Return ONLY valid JSON no markdown: {\"ideas\":[{\"title\":\"string\",\"hook\":\"one compelling sentence\",\"type\":\"Tutorial|Listicle|Story|Challenge|Review|Vlog\",\"difficulty\":\"Easy|Medium|Hard\",\"potential\":\"High|Very High|Viral\"}]}. Exactly " + qty + " ideas.";
      messages = [{ role: "user", content: prompt }];
    }

    // ── SEO ────────────────────────────────────────────────────────────────
    else if (type === "seo") {
      var seoPrompt = "You are a world-class " + platform + " SEO expert. Topic: \"" + topic + "\", niche: \"" + (niche || "general") + "\". Generate " + qty + " optimized title" + (qty > 1 ? "s" : "") + ". Return ONLY valid JSON no markdown: {\"titles\":[\"title strings under 70 chars each\"],\"description\":\"150-200 word SEO description keywords in first 2 lines\",\"tags\":[\"15 search tags\"],\"insight\":\"one specific SEO tip\"}";
      messages = [{ role: "user", content: seoPrompt }];
    }

    // ── THUMBNAIL ──────────────────────────────────────────────────────────
    else if (type === "thumbnail") {
      // Auto-detect actual image type from base64 header bytes
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
          { type: "text", text: "You are an expert YouTube thumbnail analyst. Analyze this thumbnail for a " + (niche || "YouTube") + " creator. Return ONLY valid JSON no markdown: {\"score\":80,\"summary\":\"2 sentences\",\"textReadability\":75,\"visualContrast\":80,\"emotionalImpact\":70,\"mobileClarity\":75,\"strengths\":[{\"point\":\"string\",\"impact\":\"string\"}],\"improvements\":[{\"issue\":\"string\",\"fix\":\"string\",\"priority\":\"High|Medium|Low\"}]}" }
        ]
      }];
    }

    // ── CONTENT PLAN ───────────────────────────────────────────────────────
    else if (type === "plan") {
      var platformList = platforms.length > 0 ? platforms.join(", ") : platform;

      if (planType === "week") {
        var weekPrompt = "You are an elite social media growth strategist. Create a detailed 7-day content plan for a creator.\n\nCreator profile:\n- Niche: " + niche + (subtopic ? " (" + subtopic + ")" : "") + "\n- Platforms: " + platformList + "\n- Current followers: " + (followers || "not specified") + "\n- Growth goal: " + (growthGoal || goal || "grow audience") + "\n\nBased on the goal, calculate the ideal posting frequency to reach it. Include this in your response.\n\nReturn ONLY valid JSON no markdown:\n{\"summary\":\"2 sentence strategy overview\",\"weeklyGoal\":\"specific measurable weekly goal\",\"weeklyTheme\":\"unifying content theme\",\"recommendedFrequency\":\"e.g. 4 videos/week on YouTube + 1 Short/day — explain why this frequency helps reach their goal\",\"days\":[{\"day\":\"Monday\",\"platform\":\"platform name\",\"contentType\":\"content type\",\"title\":\"specific video or post title\",\"hook\":\"opening hook sentence\",\"bestTime\":\"best posting time\",\"tip\":\"one specific production or growth tip\"}],\"videoIdeas\":[{\"title\":\"bonus video idea title\",\"hook\":\"hook sentence\",\"priority\":\"High|Medium\"}],\"growthTips\":[\"3 specific growth tips\"]}";
        messages = [{ role: "user", content: weekPrompt }];
      }

      else if (planType === "month") {
        var monthPrompt = "You are an elite social media growth strategist. Create a detailed 30-day content plan.\n\nCreator profile:\n- Niche: " + niche + (subtopic ? " (" + subtopic + ")" : "") + "\n- Platforms: " + platformList + "\n- Current followers: " + (followers || "not specified") + "\n- Growth goal: " + (growthGoal || goal || "grow audience") + "\n\nBased on the goal, calculate and recommend the ideal posting frequency to reach it.\n\nReturn ONLY valid JSON no markdown:\n{\"summary\":\"2 sentence strategy overview\",\"monthlyGoal\":\"specific measurable monthly goal\",\"recommendedFrequency\":\"recommended posting frequency and why it matches their goal\",\"weeks\":[{\"week\":1,\"theme\":\"week theme\",\"focus\":\"strategic focus\",\"posts\":[{\"platform\":\"platform\",\"title\":\"specific post/video title\",\"hook\":\"hook sentence\",\"contentType\":\"type\",\"dayOfWeek\":\"best day\"}],\"milestone\":\"end of week milestone\",\"bonusIdeas\":[{\"title\":\"extra video idea\",\"hook\":\"hook\"}]}],\"contentPillars\":[\"3-4 content pillars\"],\"growthTips\":[\"4 growth strategies\"]}";
        messages = [{ role: "user", content: monthPrompt }];
      }

      else if (planType === "year") {
        var yearPrompt = "You are an elite social media growth strategist. Create a 12-month content roadmap.\n\nCreator profile:\n- Niche: " + niche + (subtopic ? " (" + subtopic + ")" : "") + "\n- Platforms: " + platformList + "\n- Current followers: " + (followers || "not specified") + "\n- Growth goal: " + (growthGoal || goal || "grow audience") + "\n\nBased on the goal, calculate the recommended posting frequency per platform to reach it. For each quarter, provide a month-by-month breakdown with specific video ideas.\n\nReturn ONLY valid JSON no markdown:\n{\"summary\":\"2 sentence year overview\",\"yearlyGoal\":\"specific yearly goal\",\"recommendedFrequency\":\"recommended posting schedule across all platforms and why this pace reaches their goal\",\"quarters\":[{\"quarter\":\"Q1\",\"months\":\"Jan-Mar\",\"theme\":\"quarter theme\",\"focus\":\"strategic focus\",\"milestone\":\"measurable end of quarter milestone\",\"platforms\":[\"platforms to focus on\"],\"monthlyPlans\":[{\"month\":\"January\",\"theme\":\"month theme\",\"videosToPost\":3,\"ideas\":[{\"title\":\"video idea title\",\"hook\":\"hook sentence\",\"contentType\":\"Tutorial|Listicle|Story|Challenge|Review\",\"priority\":\"High|Medium\"}],\"bonusIdeas\":[{\"title\":\"bonus idea title\",\"hook\":\"hook\"}]}]}],\"brandEvolution\":\"how the brand evolves over the year\",\"monetizationPath\":\"monetization milestones and path\",\"growthTips\":[\"5 yearly growth strategies\"]}";
        messages = [{ role: "user", content: yearPrompt }];
      }
    }

    else {
      return res.status(400).json({ error: "Invalid type" });
    }

    var response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: messages
    });

    var raw = response.content.map(function (c) { return c.text || ""; }).join("");
    var clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    var data = JSON.parse(clean);
    return res.status(200).json({ success: true, data: data });

  } catch (err) {
    console.error("Orion error:", err);
    return res.status(500).json({ error: err.message });
  }
};
