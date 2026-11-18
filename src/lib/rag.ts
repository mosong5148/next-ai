import { google } from "@ai-sdk/google";
import { cosineSimilarity, embed, embedMany } from "ai";
import { randomUUID } from "node:crypto";

// Retrieval-augmented generation (RAG) helpers:
// 1. split the document into overlapping chunks
// 2. turn every chunk into an embedding vector (a list of numbers that captures its meaning)
// 3. for each question, embed the question and pick the chunks whose vectors are closest

const embeddingModel = google.embedding("gemini-embedding-2");

// 400 characters keeps each chunk close to one topic. With 800, chunks mixed several
// handbook sections and the right one ranked outside the top 4 for 1 of 12 test questions.
const CHUNK_SIZE = 400; // characters per chunk
const CHUNK_OVERLAP = 80; // characters shared with the previous chunk, so facts are not cut in half
export const TOP_K = 4; // how many chunks are sent to Gemini per question

interface StoredChunk {
  text: string;
  embedding: number[];
}

interface StoredDocument {
  fileName: string;
  chunks: StoredChunk[];
}

// In-memory vector store. It lives as long as the server process; a restart clears it.
// globalThis keeps it alive across hot reloads in `next dev`.
const globalStore = globalThis as unknown as {
  ragDocuments?: Map<string, StoredDocument>;
};
const documents = (globalStore.ragDocuments ??= new Map<
  string,
  StoredDocument
>());

// Split text into chunks of about CHUNK_SIZE characters, preferring to break at
// paragraph or sentence boundaries, with CHUNK_OVERLAP characters of overlap.
export function chunkText(text: string): string[] {
  const clean = text.replace(/\s+\n/g, "\n").trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + CHUNK_SIZE, clean.length);
    if (end < clean.length) {
      const window = clean.slice(start, end);
      const breakAt = Math.max(
        window.lastIndexOf("\n"),
        window.lastIndexOf(". "),
      );
      // Only use the boundary if it does not make the chunk too small
      if (breakAt > CHUNK_SIZE / 2) end = start + breakAt + 1;
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

// Chunk and embed a document, store it, and return its id
export async function indexDocument(
  text: string,
  fileName: string,
): Promise<{ docId: string; chunkCount: number }> {
  const chunks = chunkText(text);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
    providerOptions: { google: { taskType: "RETRIEVAL_DOCUMENT" } },
  });

  const docId = randomUUID();
  documents.set(docId, {
    fileName,
    chunks: chunks.map((chunk, i) => ({ text: chunk, embedding: embeddings[i] })),
  });
  return { docId, chunkCount: chunks.length };
}

// Return the TOP_K chunks most similar to the question, or null if the document is unknown
export async function retrieveRelevantChunks(
  docId: string,
  question: string,
): Promise<string[] | null> {
  const doc = documents.get(docId);
  if (!doc) return null;

  const { embedding: questionEmbedding } = await embed({
    model: embeddingModel,
    value: question,
    providerOptions: { google: { taskType: "RETRIEVAL_QUERY" } },
  });

  return doc.chunks
    .map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(questionEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .map((chunk) => chunk.text);
}
