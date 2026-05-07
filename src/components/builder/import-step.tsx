"use client";

import { ArrowLeft, FolderUp, PenSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function ImportStep() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const csrf = useMemo(() => {
    if (typeof document === "undefined") {
      return "";
    }

    return decodeURIComponent(
      document.cookie
        .split("; ")
        .find((entry) => entry.startsWith("vrb_csrf="))
        ?.split("=")[1] ?? "",
    );
  }, []);

  async function handleManualStart() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/resumes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf,
      },
      body: JSON.stringify({
        mode: "blank",
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "Unable to start a resume draft");
      return;
    }

    router.push(`/builder/templates?resumeId=${payload.resume.id}`);
    router.refresh();
  }

  async function handleImport() {
    setLoading(true);
    setError("");

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    if (text.trim()) {
      formData.append("text", text);
    }

    const response = await fetch("/api/resumes/import", {
      method: "POST",
      headers: {
        "x-csrf-token": csrf,
      },
      body: formData,
    });

    const payload = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "Unable to import resume content");
      return;
    }

    router.push(`/builder/templates?resumeId=${payload.resume.id}`);
    router.refresh();
  }

  return (
    <section className="rounded-[3rem] border border-white/70 bg-white/82 px-6 py-8 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur md:px-10 md:py-10">
      <p className="text-[12px] font-black uppercase tracking-[0.32em] text-primary">Step 2: Content</p>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mt-6 inline-flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.22em] text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <h1 className="mt-5 font-display text-[3rem] font-black leading-none tracking-tight text-slate-950 md:text-[4.3rem]">
        Import Your History
      </h1>
      <p className="mt-5 max-w-3xl text-[18px] leading-9 text-slate-500">
        Import an existing file to save time, or paste your career summary below. Our AI will structure it perfectly.
      </p>

      <div className="mt-10 rounded-[2.6rem] border-2 border-dashed border-slate-200 px-6 py-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <FolderUp className="h-10 w-10 text-slate-700" />
        </div>
        <p className="mt-6 text-[2rem] font-black tracking-tight text-slate-950">Upload File</p>
        <p className="mt-2 text-[12px] font-black uppercase tracking-[0.28em] text-slate-400">PDF or DOCX</p>
        <input
          id="resumeFile"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mx-auto mt-6 block max-w-[260px] text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:font-semibold file:text-primary"
        />
      </div>

      <div className="mt-10 rounded-[2.6rem] bg-[#06091c] px-6 py-9 text-center text-white shadow-[0_30px_60px_rgba(6,9,28,0.24)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white/10">
          <PenSquare className="h-8 w-8" />
        </div>
        <p className="mt-6 text-[2rem] font-black tracking-tight">Quick Start</p>
        <button
          type="button"
          onClick={handleManualStart}
          disabled={loading}
          className="mt-6 rounded-full bg-white px-8 py-3 text-[13px] font-black uppercase tracking-[0.22em] text-slate-950 transition hover:brightness-95 disabled:opacity-60"
        >
          Skip to Manual
        </button>
      </div>

      <div className="mt-10">
        <label htmlFor="careerText" className="ml-2 text-[11px] font-black uppercase tracking-[0.32em] text-slate-400">
          Or Paste Career Text
        </label>
        <textarea
          id="careerText"
          placeholder="Paste your current resume content or professional bio here..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="mt-4 min-h-[180px] w-full rounded-[2rem] border-2 border-transparent bg-slate-50 px-6 py-5 text-[18px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
        />
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <button
        type="button"
        onClick={handleImport}
        disabled={loading || (!text.trim() && !file)}
        className="mt-8 w-full rounded-[2rem] bg-primary/55 py-5 text-[15px] font-black uppercase tracking-[0.28em] text-white shadow-[0_22px_54px_rgba(48,103,234,0.18)] transition enabled:bg-primary enabled:hover:brightness-105 disabled:cursor-not-allowed"
      >
        {loading ? "Structuring with AI" : "Structure with AI"}
      </button>
    </section>
  );
}
