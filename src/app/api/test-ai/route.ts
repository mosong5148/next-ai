import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google"; // 🚀 Next-Gen ultra-lightweight Google Gemini provider
import { streamText } from "ai"; // Core streamlined real-time streaming parser wrapper

// High-Performance Full-Stack Homogeneous Sandbox Route
export async function GET(req: NextRequest) {
  try {
    // 1. Intercept search queries out of the relative url parameters safely
    const { searchParams } = new URL(req.url);
    const clientKeyword =
      searchParams.get("echo") ||
      "Write a one-sentence greeting to an elite fullstack web developer.";

    // 2. Trigger the Vercel AI SDK Core Engine to target 'gemini-3.5-flash-lite'
    const responseStream = streamText({
      model: google("gemini-3.5-flash-lite"),
      prompt: clientKeyword,
      temperature: 0.7,
    });

    // 3. Transmit native text streams back to host origins
    return responseStream.toTextStreamResponse();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected core system failure occurred.";
    console.error("Critical Exception caught inside test route:", errorMessage);
    return NextResponse.json(
      { error: `Infrastructure Tunnel Fault: ${errorMessage}` },
      { status: 500 },
    );
  }
}
