const Groq = require("groq-sdk");

const generateHotspotContent = async ({ label, userContext, niche }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not set in .env");
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const nicheContext = {
    "real-estate": "real estate listing targeting home buyers",
    architecture: "architectural portfolio showcasing design decisions",
    "interior-design": "interior design showcase for potential clients",
    "art-gallery": "art gallery exhibition guide for visitors",
    other: "general spatial presentation",
  }[niche] || "spatial tour";

  const prompt = `You are writing copy for a ${nicheContext}.
The hotspot is labeled: "${label}"
${userContext ? `Additional context: "${userContext}"` : ""}

Respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "description": "1-2 sentence factual description (max 60 words)",
  "accessibilityNotes": "1 sentence about accessibility (max 30 words)",
  "salesCopy": "1-2 sentence sales description highlighting value (max 50 words)"
}`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.7,
  });

  const text = response.choices[0]?.message?.content?.trim() || "";
  const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

  const parsed = JSON.parse(clean);

  if (!parsed.description || !parsed.accessibilityNotes || !parsed.salesCopy) {
    throw new Error("AI response missing required fields");
  }

  return parsed;
};

module.exports = { generateHotspotContent };