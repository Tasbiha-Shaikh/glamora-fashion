const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

// Calls Gemini and returns the reply text.
// Throws an Error with `isRateLimit` set when the quota is exhausted.
const generateText = async ({ systemPrompt, contents }) => {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
    }),
  });
  const data = await response.json();

  if (data.error) {
    const error = new Error(data.error.message || 'Gemini request failed');
    const message = error.message.toLowerCase();
    error.isRateLimit = message.includes('quota') || message.includes('rate');
    throw error;
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

module.exports = { isGeminiConfigured, generateText };
