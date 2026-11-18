"use client";

import React, { useEffect, useRef } from "react";
import { MessageSquare, Bot, User } from "lucide-react";

interface DialoguePair {
  question: string;
  answer: string;
}

interface RenderQAProps {
  conversation: DialoguePair[];
  isAiLoading: boolean;
}

export default function RenderQA({ conversation, isAiLoading }: RenderQAProps) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // Automated viewport focus: glide smoothly to the latest bottom row
  // whenever a new stream fragment hits the conversation state.
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, isAiLoading]);

  return (
    <div className="w-full flex-1 overflow-y-auto space-y-4 pr-1 min-h-[250px] scroll-smooth select-none">
      {/* Loop through centralized conversation arrays elements */}
      {conversation.map((chat, idx) => (
        <div
          key={`chat-node-${idx}`}
          className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* 1. User Terminal Chat Bubble: Align Right with Deep Velvet Violet Gradient Flow */}
          <div className="flex items-start justify-end gap-2.5 pl-10">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs font-medium max-w-[85%] shadow-md shadow-purple-600/10 border border-purple-500/20">
              <p className="leading-relaxed break-words">{chat.question}</p>
            </div>
            <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 shrink-0 shadow-inner">
              <User className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* 2. AI Intelligence Chat Bubble: Align Left with Matte Cyber Dark Panel */}
          {chat.answer && (
            <div className="flex items-start justify-start gap-2.5 pr-10 animate-in fade-in duration-300">
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-md animate-pulse">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="bg-[#18181b]/80 border border-zinc-900 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs font-medium max-w-[85%] text-zinc-100 shadow-lg backdrop-blur-md">
                <p className="leading-relaxed break-words whitespace-pre-wrap">
                  {chat.answer}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 3. Asynchronous Inference Hydration State Shimmer Block */}
      {isAiLoading &&
        conversation.length > 0 &&
        !conversation[conversation.length - 1].answer && (
          <div className="flex items-start justify-start gap-2.5 pr-10 animate-in fade-in duration-150">
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 animate-spin text-xs">
              🌀
            </div>
            <div className="bg-[#18181b]/40 border border-dashed border-zinc-900/60 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs font-semibold text-zinc-500 flex items-center gap-2 animate-pulse bg-zinc-900/10">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
              <span>AI is interpreting custom reference metrics...</span>
            </div>
          </div>
        )}

      {/* Empty System Fallback Layout Canvas Block */}
      {conversation.length === 0 && !isAiLoading && (
        <div className="h-full flex flex-col items-center justify-center text-center py-20 text-zinc-600 font-bold animate-in fade-in duration-300 flex-grow">
          <MessageSquare className="h-8 w-8 text-zinc-800 mb-2 stroke-[1.5]" />
          <p className="text-xs">Conversational Pipeline Standby</p>
          <p className="text-[10px] text-zinc-700 font-normal max-w-xs mt-1 uppercase tracking-wider leading-relaxed">
            Trigger vocal toggle buttons or dispatch query parameters below to
            launch real-time semantic RAG synthesis.
          </p>
        </div>
      )}

      {/* Internal Anchor Object handling smooth programmatic viewport offsets */}
      <div ref={scrollAnchorRef} />
    </div>
  );
}
