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
      messages = [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
          { type: "text", text: "Analyze this YouTube thumbnail for a " + (niche || "YouTube") + " creator. Return ONLY valid JSON no markdown: {\"score\":80,\"summary\":\"2 sentences\",\"textReadability\":75,\"visualContrast\":80,\"emotionalImpact\":70,\"mobileClarity\":75,\"strengths\":[{\"point\":\"string\",\"impact\":\"string\"}],\"improvements\":[{\"issue\":\"string\",\"fix\":\"string\",\"priority\":\"High|Medium|Low\"}]}" }
        ]
      }];
    }

    // ── CONTENT PLAN ───────────────────────────────────────────────────────
    else if (type === "plan") {
      var periodLabel = planType === "week" ? "7-day" : planType === "month" ? "30-day" : "12-month";
      var platformList = platforms.length > 0 ? platforms.join(", ") : platform;
      var planPrompt = "You are an elite social media growth strategist. Create a detailed " + periodLabel + " content plan for a creator in the \"" + niche + "\" niche.\n\nCreator profile:\n- Platforms: " + platformList + "\n- Current followers: " + (followers || "not specified") + "\n- Growth goal: " + (growthGoal || goal || "grow audience and engagement") + "\n- Sub-topic/angle: " + (subtopic || "general") + "\n\n";

      if (planType === "week") {
        planPrompt += "Create a 7-day posting plan. Return ONLY valid JSON no markdown:\n{\"summary\":\"2 sentence overview of the strategy\",\"weeklyGoal\":\"specific measurable goal for this week\",\"days\":[{\"day\":\"Monday\",\"platform\":\"platform name\",\"contentType\":\"type of content\",\"title\":\"specific video/post title\",\"hook\":\"opening hook\",\"bestTime\":\"best posting time\",\"tip\":\"one specific tip for this post\"}],\"growthTips\":[\"3 specific growth tips for this week\"],\"weeklyTheme\":\"unifying theme for the week\"}";
      } else if (planType === "month") {
        planPrompt += "Create a 4-week monthly content plan with weekly themes. Return ONLY valid JSON no markdown:\n{\"summary\":\"2 sentence overview of the month strategy\",\"monthlyGoal\":\"specific measurable goal\",\"weeks\":[{\"week\":1,\"theme\":\"week theme\",\"focus\":\"what to focus on\",\"posts\":[{\"platform\":\"platform\",\"title\":\"post title\",\"contentType\":\"type\",\"dayOfWeek\":\"best day to post\"}],\"milestone\":\"what to achieve by end of week\"}],\"growthTips\":[\"4 specific growth strategies for the month\"],\"contentPillars\":[\"3-4 core content pillars to build authority\"]}";
      } else {
        planPrompt += "Create a 12-month yearly content roadmap with quarterly phases. Return ONLY valid JSON no markdown:\n{\"summary\":\"2 sentence overview of the year strategy\",\"yearlyGoal\":\"specific measurable goal for the year\",\"quarters\":[{\"quarter\":\"Q1\",\"months\":\"Jan-Mar\",\"theme\":\"quarter theme\",\"focus\":\"main focus\",\"keyContent\":[\"3 key content types or series to launch\"],\"milestone\":\"measurable milestone\",\"platforms\":[\"platforms to focus on\"]}],\"brandEvolution\":\"how the brand should evolve over the year\",\"monetizationPath\":\"roadmap to monetization or growth milestones\",\"growthTips\":[\"5 yearly strategies for sustained growth\"]}";
      }

      messages = [{ role: "user", content: planPrompt }];
    }

    else {
      return res.status(400).json({ error: "Invalid type" });
    }

    var response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
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
