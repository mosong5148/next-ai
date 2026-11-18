import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google"; // 🚀 Next-Gen ultra-lightweight Google Gemini provider
import { streamText } from "ai"; // Core streamlined real-time streaming wrapper
import { retrieveRelevantChunks } from "@/lib/rag";

export async function POST(req: NextRequest) {
  try {
    // 1. Unpack the question plus either a document id (RAG) or raw context text
    const { question, docId, contextText } = await req.json();

    if (!question) {
      return NextResponse.json(
        {
          error:
            "Payload Exception: Required query parameter 'question' missing.",
        },
        { status: 400 },
      );
    }

    // 2. Retrieval: send Gemini only the chunks most relevant to the question.
    // Without a known docId, fall back to raw context text, then to a placeholder.
    const retrievedChunks = docId
      ? await retrieveRelevantChunks(docId, question)
      : null;
    const activeContext = retrievedChunks
      ? retrievedChunks.join("\n---\n")
      : contextText && contextText.trim() !== ""
        ? contextText
        : "No reference context document manual has been uploaded into memory yet. Inform the user to drag a PDF file above to activate RAG knowledge graphs.";

    // 3. Construct the Injected Knowledge System Prompt Template (The Open-Book Exam Shield)
    const promptTemplate = `
You are an advanced full-stack AI Corporate Knowledge Assistant running an industrial RAG data pipeline.
Use the following pieces of extracted document context to answer the user's question with absolute precision.
---------------------
EXTRACTED DOCUMENT CONTEXT BASE:
${activeContext}
---------------------
CRITICAL REGULATORY INSTRUCTIONS:
1. If the answer cannot be clearly deduced from the extracted context block above, politely tell the user that the required metrics cannot be found inside the active uploaded knowledge manual.
2. Do NOT try to invent, synthesize, or hallucinate fake facts outside the context boundaries.
3. Keep the answer concise, professional, and well-structured.

User Question: ${question}
Helpful Context-Derived Streaming Answer:`;

    // 4. Trigger the Vercel AI SDK Core Engine to target 'gemini-3.5-flash-lite'
    // (Flash-Lite has its own free-tier quota and is less congested)
    // Low temperature (0.2) locks model focus tightly onto injected source facts to prevent hallucinations
    const responseStream = streamText({
      model: google("gemini-3.5-flash-lite"),
      prompt: promptTemplate,
      temperature: 0.2,
    });

    // 5. Transmit native text streams back to host origins
    // The header reports how much document text was sent, so prompt size can be measured
    return responseStream.toTextStreamResponse({
      headers: { "X-Context-Chars": String(activeContext.length) },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected AI inference core system failure occurred.";
    console.error(
      "Critical Exception caught inside Next.js AI Core Router:",
      errorMessage,
    );
    return NextResponse.json(
      { error: `AI Gateway Timeout Pipeline Disrupted: ${errorMessage}` },
      { status: 500 },
    );
  }
}
