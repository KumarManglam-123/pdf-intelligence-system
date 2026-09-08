import Groq from 'groq-sdk';

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('GROQ_API_KEY is not configured in environment variables.');
  }
  return new Groq({ apiKey: apiKey || 'dummy-key-for-build' });
}

export const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Generate a 3-5 sentence document summary grounded in extracted text.
 */
export async function generatePdfSummary(extractedText: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return 'AI Summary unavailable (GROQ_API_KEY not configured). Please set GROQ_API_KEY in environment variables.';
  }

  try {
    const groq = getGroqClient();
    
    // Truncate text if extremely long to stay within context window
    const truncatedText = extractedText.slice(0, 15000);

    const response = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert document summarizer. Generate a concise 3 to 5 sentence summary strictly grounded in the provided text. Do not include generic boilerplate phrasing like "This document covers..." or "In conclusion...". State the main facts, purpose, and findings clearly and directly.',
        },
        {
          role: 'user',
          content: `Please summarize the following document text in 3-5 grounded sentences:\n\n${truncatedText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content?.trim() || 'Summary could not be generated.';
  } catch (error: any) {
    console.error('Error generating summary from Groq:', error);
    return `Failed to generate summary: ${error.message || 'Unknown error'}`;
  }
}
