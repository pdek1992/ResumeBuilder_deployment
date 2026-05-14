"use client";

import { useState } from "react";
import { applyPatch, Operation } from "fast-json-patch";
import { ResumeData } from "@/lib/types";
import { apiFetch } from "@/lib/client-api";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function ResumeChatSidebar({
  resumeId,
  currentData,
  onUpdate,
}: {
  resumeId: string;
  currentData: ResumeData;
  onUpdate: (newData: ResumeData) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await apiFetch<{ message: string; patches: Operation[] }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          resumeId,
          prompt: userMsg,
          currentData,
        }),
      });

      if (res.patches && Array.isArray(res.patches) && res.patches.length > 0) {
        const cloned = JSON.parse(JSON.stringify(currentData));
        const result = applyPatch(cloned, res.patches, true, false);
        onUpdate(result.newDocument);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.message || "I've applied those changes for you!" },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I ran into an error while trying to update your resume." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white border-l border-slate-100 shadow-[-20px_0_60px_rgba(15,23,42,0.03)]">
      <div className="p-6 border-b border-slate-50">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">VigilSiddhi AI Chat</p>
        <p className="mt-2 text-[14px] text-slate-400 leading-relaxed">
          Ask me to add a role, rewrite your summary, or tweak your skills.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-4">✨</p>
            <p className="text-sm text-slate-400 px-8 leading-7">
              &quot;Add a new role as Senior Product Manager at Google from 2022 to 2024&quot;
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-[1.8rem] px-5 py-4 text-sm leading-relaxed ${
              msg.role === "user" 
                ? "bg-primary text-white" 
                : "bg-slate-50 text-slate-600 border border-slate-100"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-100 rounded-[1.8rem] px-5 py-4 text-sm text-slate-400 italic">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50/50">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type an instruction..."
            className="w-full rounded-full border border-slate-200 bg-white pl-6 pr-14 py-4 text-sm focus:border-primary focus:outline-none transition shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-50 transition"
          >
            →
          </button>
        </div>
        <p className="mt-4 text-[10px] text-center font-bold uppercase tracking-widest text-slate-300">
          Powered by Gemini 1.5 Pro
        </p>
      </div>
    </div>
  );
}
