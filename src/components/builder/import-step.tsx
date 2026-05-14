"use client";

import { ArrowLeft, FolderUp, PenSquare } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

async function getCsrfToken() {
  const existing =
    typeof document === "undefined"
      ? ""
      : decodeURIComponent(
          document.cookie
            .split("; ")
            .find((entry) => entry.startsWith("vrb_csrf="))
            ?.split("=")[1] ?? "",
        );

  if (existing) {
    return existing;
  }

  const response = await fetch("/api/csrf", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not prepare a secure request token");
  }

  const payload = (await response.json()) as { token?: string };
  return payload.token ?? "";
}

export function ImportStep() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleManualStart() {
    setLoading(true);
    setError("");

    let csrf = "";
    try {
      csrf = await getCsrfToken();
    } catch (error) {
      setLoading(false);
      setError(error instanceof Error ? error.message : "Could not prepare a secure request token");
      return;
    }

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

    let csrf = "";
    try {
      csrf = await getCsrfToken();
    } catch (error) {
      setLoading(false);
      setError(error instanceof Error ? error.message : "Could not prepare a secure request token");
      return;
    }

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
    <section className="rounded-[2.5rem] bg-white p-6 shadow-sm md:p-12 lg:p-16 h-full flex flex-col justify-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6">Step 2: Content</p>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="inline-flex max-w-fit items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition hover:text-gray-600 mb-8"
      >
        <ArrowLeft className="h-3 w-3" />
        Back
      </button>
      <h1 className="font-display text-[3rem] md:text-[4rem] font-black leading-[1.05] tracking-tight text-gray-900">
        Import Your History
      </h1>
      <p className="mt-8 max-w-2xl text-[16px] leading-relaxed text-gray-500 font-medium">
        Import an existing file to save time, or paste your career summary below. Our AI will structure it perfectly.
      </p>

      <div className="mt-10 rounded-[2rem] border-2 border-dashed border-gray-200 px-6 py-8 text-center bg-gray-50/50">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
          <FolderUp className="h-8 w-8 text-blue-600" />
        </div>
        <p className="mt-6 text-[1.5rem] font-black tracking-tight text-gray-900">Upload File</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">PDF or DOCX</p>
        <input
          id="resumeFile"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mx-auto mt-6 block max-w-[260px] text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-600"
        />
      </div>

      <div className="mt-8 rounded-[2rem] bg-gray-900 px-6 py-8 text-center text-white shadow-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white/10">
          <PenSquare className="h-6 w-6" />
        </div>
        <p className="mt-4 text-[1.5rem] font-black tracking-tight">Quick Start</p>
        <button
          type="button"
          onClick={handleManualStart}
          disabled={loading}
          className="mt-6 rounded-full bg-white px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-900 transition hover:bg-gray-100 disabled:opacity-60"
        >
          Skip to Manual
        </button>
      </div>

      <div className="mt-10">
        <label htmlFor="careerText" className="ml-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
          Or Paste Career Text
        </label>
        <textarea
          id="careerText"
          placeholder="Paste your current resume content or professional bio here..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="mt-3 min-h-[180px] w-full rounded-3xl border-0 bg-gray-50/80 px-8 py-5 text-[16px] font-medium text-gray-800 outline-none transition placeholder:text-gray-300 focus:bg-gray-100 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-red-600 ml-4">{error}</p> : null}

      <button
        type="button"
        onClick={handleImport}
        disabled={loading || (!text.trim() && !file)}
        className="mt-10 w-full rounded-full bg-blue-600 py-5 text-[13px] font-black uppercase tracking-widest text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:bg-blue-300 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {loading ? "Structuring with AI..." : "Structure with AI"}
      </button>
    </section>
  );
}
