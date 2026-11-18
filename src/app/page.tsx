"use client";

import React, { useState } from "react";
import PdfUploader from "@/components/PdfUploader";
import RenderQA from "@/components/RenderQA";
import ChatComponent from "@/components/ChatComponent";
import { Bot, Sparkles } from "lucide-react";

interface DialoguePair {
  question: string;
  answer: string;
}

export default function AIKnowledgeAssistantPage() {
  // 1. Centralized Telemetry State Registries
  const [extractedText, setExtractedText] = useState<string>("");
  const [activeFileName, setActiveFileName] = useState<string>("");
  const [docId, setDocId] = useState<string>(""); // id of the indexed document on the server
  const [conversation, setConversation] = useState<DialoguePair[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // 2. Callback Listener: Synchronizes data records whenever a fresh file hits the dropzone
  const handleDocumentUploadSuccess = (
    text: string,
    fileName: string,
    newDocId: string,
  ) => {
    setExtractedText(text);
    setActiveFileName(fileName);
    setDocId(newDocId);
    setConversation([]); // Flush historical session logs to prevent cross-context confusion
  };

  // 3. Central dispatcher: sends the question plus the document text to the AI route
  const sendMessageToAi = async (userQuestion: string) => {
    if (!userQuestion.trim() || isAiLoading) return;

    setIsAiLoading(true);

    // Optimistically insert the user's question into local conversation arrays first
    setConversation((prev) => [
      ...prev,
      { question: userQuestion, answer: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          docId, // The server retrieves only the relevant chunks of this document
          contextText: extractedText, // Fallback if the server no longer has the document
        }),
      });

      if (!response.ok)
        throw new Error("AI engine gateway network rejection exception.");
      if (!response.body)
        throw new Error(
          "Server failed to return an accessible active streaming body.",
        );

      // 4. Read the text stream chunk by chunk
      const streamReader = response.body.getReader();
      const textDecoder = new TextDecoder();
      let accumulatedAiAnswer = "";

      while (true) {
        const { value, done } = await streamReader.read();
        if (done) break;

        const chunkText = textDecoder.decode(value, { stream: true });
        accumulatedAiAnswer += chunkText;

        // Typewriter effect: update the last answer as each chunk arrives
        setConversation((prev) => {
          const updatedConvo = [...prev];
          if (updatedConvo.length > 0) {
            updatedConvo[updatedConvo.length - 1] = {
              ...updatedConvo[updatedConvo.length - 1],
              answer: accumulatedAiAnswer,
            };
          }
          return updatedConvo;
        });
      }
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : "Dialogue connection timeout.";
      console.error("AI dispatch conduit disrupted:", errMsg);

      setConversation((prev) => {
        const updatedConvo = [...prev];
        if (updatedConvo.length > 0) {
          updatedConvo[updatedConvo.length - 1] = {
            ...updatedConvo[updatedConvo.length - 1],
            answer: `Communication Disrupted: ${errMsg}`,
          };
        }
        return updatedConvo;
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0e0e10] text-[#efeff1] font-sans antialiased">
      {/* Premium Dark Mode Fixed Navigation Header Block Bar */}
      <header className="flex h-16 w-full items-center justify-between border-b border-[#1f1f23] bg-[#18181b] px-6 shadow-md z-50 select-none shrink-0">
        <div className="flex items-center gap-2 font-black text-purple-500 text-lg tracking-tighter">
          <Bot className="h-5 w-5 text-purple-500 animate-pulse" />
          <span>
            NEXT<span className="text-white font-medium">.AI</span>
          </span>
        </div>

        {/* Dynamic Injected Status Indicator Capsule Row */}
        {activeFileName && (
          <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-xl animate-in fade-in duration-300">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[11px] font-black text-purple-400 tracking-wide truncate max-w-[200px]">
              Active Vault: {activeFileName}
            </span>
          </div>
        )}
      </header>

      {/* Primary Immersive Content Workspace Canvas Layout */}
      <div className="flex-1 w-full overflow-hidden p-6 md:p-8 flex flex-col justify-between max-w-4xl mx-auto min-h-0">
        {/* Upper Dashboard Region: Mounts the custom dragzone uploader matrix */}
        <div className="w-full shrink-0 mb-6">
          <PdfUploader onUploadSuccess={handleDocumentUploadSuccess} />
        </div>

        {/* Central Region Container: scrollable conversation threads */}
        <div className="flex-1 w-full rounded-2xl border border-zinc-900 bg-zinc-950/20 backdrop-blur-sm overflow-hidden p-4 flex flex-col min-h-0">
          <RenderQA conversation={conversation} isAiLoading={isAiLoading} />
        </div>

        {/* Bottom Control Box Region: capsule-shaped voice dock */}
        <div className="w-full shrink-0 mt-6">
          <ChatComponent
            onSendMessage={sendMessageToAi}
            isLoading={isAiLoading}
            conversation={conversation} // Passed down to drive the voice read-aloud loop
          />
        </div>
      </div>
    </div>
  );
}
