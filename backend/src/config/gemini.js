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
  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    const error = new Error(`Gemini response parse error: ${response.statusText}`);
    error.isRateLimit = response.status === 429;
    throw error;
  }

  if (data.error || !response.ok) {
    const errorMsg = data.error?.message || `Gemini request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    const message = errorMsg.toLowerCase();
    error.isRateLimit = response.status === 429 ||
      data.error?.code === 429 ||
      message.includes('quota') ||
      message.includes('rate') ||
      message.includes('resource_exhausted');
    throw error;
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

module.exports = { isGeminiConfigured, generateText };
