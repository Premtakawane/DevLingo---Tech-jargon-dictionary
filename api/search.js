export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  let word;
  try {
    word = req.body?.word || JSON.parse(req.body)?.word;
  } catch (e) {
    word = req.body?.word;
  }

  if (!word)
    return res.status(400).json({ error: "Word is required", body: req.body });

  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          max_tokens: 800,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You are a JSON API. Respond ONLY with a raw JSON object. No markdown, no backticks, no explanation.",
            },
            {
              role: "user",
              content: `Give me tech dictionary info for the word "${word}". Respond with this exact JSON structure:
{"word":"${word}","meaning":"explanation of this tech term in 2-3 sentences","origin":"where this word came from and how developers adopted it in 2-3 sentences","techExample":"one technical coding example sentence","realExample":"one real life non-technical analogy sentence","similarWords":["related1","related2","related3","related4"]}`,
            },
          ],
        }),
      },
    );

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(500).json({ error: "Groq API failed", details: data });
    }

    const text = data.choices[0].message.content.trim();
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return res
        .status(500)
        .json({ error: "Could not parse response", raw: text });
    }

    const result = JSON.parse(match[0]);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
