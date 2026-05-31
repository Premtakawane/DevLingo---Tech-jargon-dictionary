export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { word } = req.body;
  if (!word) return res.status(400).json({ error: "Word is required" });

  const prompt = `You are DevLingo, a tech jargon dictionary for programmers.

The user searched for: "${word}"

You MUST respond with ONLY a raw JSON object. No markdown. No backticks. No explanation. Just the JSON.

{"word":"${word}","meaning":"2-3 sentences explaining this term in tech/programming world.","origin":"2-3 sentences about where this word came from and how developers adopted it.","techExample":"1-2 sentences of a real technical coding example.","realExample":"1-2 sentences of a real life non-technical analogy.","similarWords":["term1","term2","term3","term4"]}`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          max_tokens: 1000,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You are a JSON API. You only respond with raw valid JSON objects. Never use markdown or code blocks.",
            },
            { role: "user", content: prompt },
          ],
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: "Groq error", details: data });
    }

    const text = data.choices[0].message.content.trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "No JSON found", raw: text });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
