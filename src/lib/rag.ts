import { pipeline } from '@xenova/transformers';

export interface TextChunk {
  chunkIndex: number;
  text: string;
}

export function chunkText(text: string, chunkSize = 1000, overlap = 200): TextChunk[] {
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  if (!cleanedText) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < cleanedText.length) {
    const end = Math.min(start + chunkSize, cleanedText.length);
    let chunkStr = cleanedText.slice(start, end);

    if (end < cleanedText.length) {
      const lastSpace = chunkStr.lastIndexOf(' ');
      if (lastSpace > chunkSize * 0.7) {
        chunkStr = chunkStr.slice(0, lastSpace);
      }
    }

    const trimmed = chunkStr.trim();
    if (trimmed.length > 0) {
      chunks.push({
        chunkIndex: index++,
        text: trimmed,
      });
    }

    const step = chunkStr.length - overlap;
    start += step > 0 ? step : chunkSize;
  }

  return chunks;
}

let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    try {
      extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    } catch (err) {
      console.warn('Failed to load @xenova/transformers pipeline, using fallback vectorizer', err);
      extractorPromise = null;
    }
  }
  return extractorPromise;
}

function fallbackEmbed(text: string, dim = 384): number[] {
  const vec = new Array(dim).fill(0);
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    const idx = (charCode * 31 + i * 17) % dim;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const extractor = await getExtractor();
    if (extractor) {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    }
  } catch (err) {
    console.warn('Error in @xenova/transformers embedding generation, fallback vectorizer used:', err);
  }
  return fallbackEmbed(text);
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findTopKChunks(
  query: string,
  chunks: { id: string; text: string; embedding: string }[],
  k = 3
): Promise<{ text: string; score: number }[]> {
  if (chunks.length === 0) return [];

  const queryVec = await generateEmbedding(query);

  const scored = chunks.map((chunk) => {
    let chunkVec: number[] = [];
    try {
      chunkVec = JSON.parse(chunk.embedding);
    } catch {
      chunkVec = fallbackEmbed(chunk.text);
    }
    const score = cosineSimilarity(queryVec, chunkVec);
    return { text: chunk.text, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
