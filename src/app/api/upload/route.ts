import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { indexDocument } from "@/lib/rag";

// PDF text lives in compressed streams, so reading the file as plain text in the
// browser only returns binary noise. The browser sends the raw file here instead,
// and unpdf pulls the real text out on the server.
export async function POST(req: NextRequest) {
  try {
    // 1. Extract the uploaded PDF file from the multipart form payload
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Payload Missing: no PDF file was received." },
        { status: 400 },
      );
    }

    // 2. Parse the PDF and merge every page into one text block
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { totalPages, text } = await extractText(pdf, { mergePages: true });

    if (!text.trim()) {
      return NextResponse.json(
        {
          error:
            "No readable text found. Scanned (image-only) PDFs are not supported.",
        },
        { status: 422 },
      );
    }

    // 3. RAG indexing: split into chunks, embed them, and keep them in the vector store
    const { docId, chunkCount } = await indexDocument(text, file.name);

    // 4. Return the document id the chat route uses to look up its chunks
    return NextResponse.json(
      {
        message:
          "Knowledge node successfully stabilized and hydrated into virtual storage.",
        docId,
        chunkCount,
        text,
        fileName: file.name,
        totalPages,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected core document parsing failure occurred.";
    console.error(
      "Critical Exception caught inside Next.js Upload Router:",
      errorMessage,
    );
    return NextResponse.json(
      { error: `Internal Engine Fault: ${errorMessage}` },
      { status: 500 },
    );
  }
}
