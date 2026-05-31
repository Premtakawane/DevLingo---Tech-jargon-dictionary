export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'Word is required' });

  const prompt = `You are DevLingo, a tech jargon dictionary for programmers and developers.

The user searched for: "${word}"

Respond ONLY with a valid JSON object in exactly this format (no markdown, no explanation, just raw JSON):
{
  "word": "${word}",
  "meaning": "Explain what this term means in the tech/programming world. Keep it clear and simple, 2-3 sentences.",
  "origin": "Explain where this word/term originally came from in the real world, and how developers or the tech industry adopted it. 2-3 sentences.",
  "techExample": "A real-world technical example showing how this term is used in coding or software development. 1-2 sentences.",
  "realExample": "A relatable everyday real-life analogy that explains this concept to a non-programmer. 1-2 sentences.",
  "similarWords": ["word1", "word2", "word3", "word4", "word5"]
}

The similarWords should be related tech terms in the same concept area as "${word}". Return exactly 4-6 words.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Groq API error', details: err });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
