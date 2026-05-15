"use client";

import type { ChangeEvent, ComponentPropsWithoutRef, ReactNode } from "react";
import Script from "next/script";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/client-api";
import { buildWhatsappSupportLink } from "@/lib/whatsapp";
import { calculateAtsScore } from "@/lib/resume/defaults";
import type { MockInterviewItem, ResumeData, TemplateRecord, UserProfile } from "@/lib/types";
import { LogoLockup } from "@/components/ui/logo-lockup";
import { ResumePreview } from "@/components/builder/resume-preview";
import { ResumeChatSidebar } from "./resume-chat-sidebar";

const sectionOrder = ["personal", "experience", "education", "skills", "projects", "certifications", "volunteer", "more"] as const;
const accentOptions = ["#3067ea", "#0f6c7c", "#92400e", "#7c3aed", "#be123c", "#334155"];
const fieldClassName =
  "mt-3 w-full rounded-[1.9rem] border-2 border-transparent bg-slate-50 px-6 py-5 text-[17px] font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white";
const labelClassName = "ml-2 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400";

type ResumeEditorProps = {
  resumeId: string;
  initialTitle: string;
  initialData: ResumeData;
  initialTemplateId: string;
  initialIsLocked: boolean;
  templates: TemplateRecord[];
  profile: UserProfile;
  hasActiveResumePass: boolean;
  hasMockInterviewCredit: boolean;
};

type PaymentIntent = "resume_download" | "mock_interview" | "cover_letter";

type EditorCardProps = ComponentPropsWithoutRef<"section">;

function EditorCard({ children, className = "", ...props }: EditorCardProps) {
  return (
    <section
      {...props}
      className={`rounded-[3rem] border border-white/70 bg-white/82 px-6 py-7 shadow-[0_30px_80px_rgba(37,99,235,0.12)] backdrop-blur md:px-8 ${className}`}
    >
      {children}
    </section>
  );
}

function TopPillButton({
  children,
  primary,
  onClick,
  href,
  disabled,
}: {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const className = `inline-flex items-center justify-center rounded-[1.65rem] border px-6 py-4 text-[12px] font-black uppercase tracking-[0.26em] transition ${
    primary
      ? "border-primary bg-primary text-white shadow-[0_18px_40px_rgba(48,103,234,0.2)]"
      : "border-slate-200 bg-white text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.05)] hover:bg-slate-50"
  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

export function ResumeEditor({
  resumeId,
  initialTitle,
  initialData,
  initialTemplateId,
  initialIsLocked,
  templates,
  profile,
  hasActiveResumePass,
  hasMockInterviewCredit,
}: ResumeEditorProps) {
  const router = useRouter();
  const [resume, setResume] = useState<ResumeData>({
    ...initialData,
    ats: {
      ...initialData.ats,
      score: initialData.ats.score ?? calculateAtsScore(initialData),
    },
  });
  const [isLocked, setIsLocked] = useState(initialIsLocked);
  const [title] = useState(initialTitle);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [activeSection, setActiveSection] = useState<(typeof sectionOrder)[number]>("personal");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLetterCopied, setCoverLetterCopied] = useState(false);
  const [interviewItems, setInterviewItems] = useState<MockInterviewItem[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? templates[0],
    [selectedTemplateId, templates],
  );

  useEffect(() => {
    if (isLocked) return;
    
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      setSaveError("");

      try {
        await apiFetch("/api/resumes/save", {
          method: "POST",
          body: JSON.stringify({
            resumeId,
            title,
            templateId: selectedTemplateId,
            data: {
              ...resume,
              ats: {
                ...resume.ats,
                score: calculateAtsScore(resume),
              },
            },
            currentDraftState: {
              activeSection,
              templateId: selectedTemplateId,
            },
          }),
        });
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Autosave failed");
      } finally {
        setSaving(false);
      }
    }, 900);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [activeSection, isLocked, resume, resumeId, selectedTemplateId, title]);

  const atsScore = calculateAtsScore(resume);

  const toggleLock = async () => {
    if (busyAction) return;
    setBusyAction("lock");
    try {
      await apiFetch("/api/resumes/lock", {
        method: "POST",
        body: JSON.stringify({ resumeId, lock: !isLocked }),
      });
      setIsLocked(!isLocked);
    } catch (e) {
      console.error(e);
    } finally {
      setBusyAction(null);
    }
  };

  const duplicateResume = async () => {
    if (busyAction) return;
    setBusyAction("duplicate");
    try {
      const { id } = await apiFetch<{ id: string }>("/api/resumes/duplicate", {
        method: "POST",
        body: JSON.stringify({ resumeId }),
      });
      router.push(`/builder/${id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setBusyAction(null);
    }
  };

  async function runAiAction(target: "summary" | "cover-letter" | "mock-interview") {
    setBusyAction(target);
    setSaveError("");

    try {
      if (target === "summary") {
        const payload = await apiFetch<{ content: string }>("/api/ai/generate", {
          method: "POST",
          body: JSON.stringify({
            mode: "RESUME_SECTION",
            purpose: "summary",
            resumeId,
            prompt: {
              targetRole: resume.ats.targetRole,
              targetCompany: resume.ats.targetCompany,
              jobDescription: resume.ats.targetJobDescription,
              summary: resume.summary,
              experience: resume.experience,
              skills: resume.skills,
            },
          }),
        });
        setResume((current) => ({ ...current, summary: payload.content }));
      }

      if (target === "cover-letter") {
        const payload = await apiFetch<{ content: string }>("/api/cover-letters", {
          method: "POST",
          body: JSON.stringify({
            resumeId,
            companyName: resume.ats.targetCompany,
            jd: resume.ats.targetJobDescription,
          }),
        });
        setCoverLetter(payload.content);
      }

      if (target === "mock-interview") {
        const payload = await apiFetch<{ items: MockInterviewItem[] }>("/api/mock-interviews", {
          method: "POST",
          body: JSON.stringify({
            resumeId,
            companyName: resume.ats.targetCompany,
            jd: resume.ats.targetJobDescription,
            experience: resume.personal.totalExperience,
          }),
        });
        setInterviewItems(payload.items);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "AI action failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function startPayment(paymentType: PaymentIntent) {
    setBusyAction(paymentType);
    setSaveError("");

    try {
      const payload = await apiFetch<{
        keyId: string;
        orderId: string;
        amount: number;
        currency: string;
      }>("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({
          paymentType,
          resumeId,
        }),
      });

      const razorpay = new window.Razorpay({
        key: payload.keyId,
        amount: payload.amount,
        currency: payload.currency,
        name: "VigilSiddhiAI Resume Builder",
        description:
          paymentType === "resume_download"
            ? "24-hour resume export access"
            : paymentType === "cover_letter"
              ? "Cover letter generation & download"
              : "Mock interview generation",
        order_id: payload.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          await apiFetch("/api/payments/verify", {
            method: "POST",
            body: JSON.stringify({
              paymentType,
              resumeId,
              ...response,
            }),
          });

          window.location.reload();
        },
        prefill: {
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          email: profile.email,
          contact: profile.mobile ?? resume.personal.phone,
        },
        theme: {
          color: "#3067ea",
        },
      });

      razorpay.open();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to start payment");
    } finally {
      setBusyAction(null);
    }
  }

  async function download(format: "pdf" | "docx") {
    setBusyAction(format);
    setSaveError("");

    try {
      const payload = await apiFetch<{ url: string }>("/api/downloads/token", {
        method: "POST",
        body: JSON.stringify({
          resumeId,
          format,
        }),
      });

      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Download failed");
    } finally {
      setBusyAction(null);
    }
  }

  /** Download the generated cover letter text as a .txt file */
  function downloadCoverLetter() {
    if (!coverLetter) return;
    const company = (resume.ats.targetCompany || "company").replace(/[^a-zA-Z0-9]/g, "-");
    const date = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
    const blob = new Blob([coverLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${company}-${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Copy the generated cover letter text to clipboard */
  async function copyCoverLetter() {
    if (!coverLetter) return;
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCoverLetterCopied(true);
      setTimeout(() => setCoverLetterCopied(false), 2500);
    } catch {
      setSaveError("Clipboard access denied. Please select and copy manually.");
    }
  }

  function updatePersonal<K extends keyof ResumeData["personal"]>(key: K, value: ResumeData["personal"][K]) {
    setResume((current) => ({
      ...current,
      personal: {
        ...current.personal,
        [key]: value,
      },
    }));
  }

  function setExperienceField(id: string, key: keyof ResumeData["experience"][number], value: unknown) {
    setResume((current) => ({
      ...current,
      experience: current.experience.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  }

  function setEducationField(id: string, key: keyof ResumeData["education"][number], value: unknown) {
    setResume((current) => ({
      ...current,
      education: current.education.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  }

  function setProjectField(id: string, key: keyof ResumeData["projects"][number], value: unknown) {
    setResume((current) => ({
      ...current,
      projects: current.projects.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  }

  function setCertificationField(id: string, key: keyof ResumeData["certifications"][number], value: unknown) {
    setResume((current) => ({
      ...current,
      certifications: current.certifications.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  }

  function setVolunteerField(id: string, key: keyof ResumeData["volunteer"][number], value: unknown) {
    setResume((current) => ({
      ...current,
      volunteer: current.volunteer.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  }

  function handleProfilePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updatePersonal("profilePhotoUrl", String(reader.result ?? ""));
    };
    reader.readAsDataURL(file);
  }

  function supportLink() {
    return buildWhatsappSupportLink(
      [
        "Resume Builder Support Request",
        `User: ${profile.first_name} ${profile.last_name}`,
        `Email: ${profile.email}`,
        `Resume ID: ${resumeId}`,
        `Current Section: ${activeSection}`,
        `Template: ${selectedTemplate.template_name}`,
      ].join("\n"),
    );
  }

  if (!selectedTemplate) {
    return null;
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef3ff_100%)]">
        {/* Chat Sidebar Overlay */}
        <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] transform transition-transform duration-500 ease-out ${isChatOpen ? "translate-x-0" : "translate-x-full"}`}>
          <ResumeChatSidebar 
            resumeId={resumeId}
            currentData={resume}
            onUpdate={(newData) => setResume(newData)}
          />
          {/* Close button inside sidebar for mobile */}
          <button 
            onClick={() => setIsChatOpen(false)}
            className="absolute left-[-50px] top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-xl md:hidden"
          >
            ✕
          </button>
        </div>

        <div className={`mx-auto max-w-[1400px] px-4 py-6 transition-all duration-500 md:px-6 md:py-8 ${isChatOpen ? "mr-[420px]" : ""}`}>
          <div className="mb-6 rounded-[2.2rem] border border-white/80 bg-white/70 px-4 py-3 shadow-[0_20px_60px_rgba(37,99,235,0.12)] backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-3">
              <LogoLockup href="/dashboard" />
              <div className="flex flex-wrap items-center gap-3">
                <TopPillButton href={`/builder/templates?resumeId=${resumeId}`}>Switch Style</TopPillButton>
                <TopPillButton onClick={() => setIsChatOpen(!isChatOpen)}>
                  {isChatOpen ? "Close Chat" : "✨ AI Chat"}
                </TopPillButton>
                <TopPillButton onClick={duplicateResume} disabled={busyAction !== null}>
                  {busyAction === "duplicate" ? "Duplicating" : "Duplicate"}
                </TopPillButton>
                <TopPillButton onClick={toggleLock} disabled={busyAction !== null}>
                  {isLocked ? "Unlock" : "Lock"}
                </TopPillButton>
                <TopPillButton onClick={() => runAiAction("summary")} disabled={busyAction !== null || isLocked}>
                  {busyAction === "summary" ? "Tailoring" : "AI Tailor"}
                </TopPillButton>
                <TopPillButton
                  primary
                  onClick={() => {
                    if (hasActiveResumePass) {
                      void download("pdf");
                    } else {
                      void startPayment("resume_download");
                    }
                  }}
                  disabled={busyAction !== null}
                >
                  {busyAction === "pdf" || busyAction === "resume_download" ? "Preparing" : "Download PDF"}
                </TopPillButton>
                <TopPillButton href="/dashboard">Exit</TopPillButton>
                <a
                  href={supportLink()}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Contact support"
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:bg-slate-50"
                >
                  🎧
                </a>
              </div>
            </div>
          </div>
          
          {isLocked && (
            <div className="mb-8 rounded-[2.2rem] border border-amber-200 bg-amber-50 px-6 py-4 text-center shadow-sm">
              <p className="text-[12px] font-black uppercase tracking-[0.24em] text-amber-700">
                🔒 Resume Locked. Unlock to enable editing and AI tailoring.
              </p>
            </div>
          )}

          <div className="flex flex-col xl:flex-row gap-8 items-start">
            <div className="w-full xl:w-[58%] space-y-8">
            <EditorCard className="pb-0">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex flex-wrap gap-3">
                  {sectionOrder.map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => setActiveSection(section)}
                      className={`rounded-full px-6 py-3 text-[12px] font-black uppercase tracking-[0.26em] transition ${
                        activeSection === section
                          ? "bg-primary text-white shadow-[0_16px_36px_rgba(48,103,234,0.22)]"
                          : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 pb-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-300">Theme</span>
                  <span className="rounded-full border border-slate-200 bg-white px-5 py-3 text-[13px] font-black text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                    {selectedTemplate.template_name}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pb-8 pt-8">
                {activeSection === "personal" ? (
                  <div className="rounded-[2.6rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:px-8">
                    <div className="mx-auto max-w-[210px] text-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mx-auto flex h-32 w-32 items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 text-4xl"
                      >
                        {resume.personal.profilePhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resume.personal.profilePhotoUrl} alt="Profile" className="h-full w-full rounded-[2rem] object-cover" />
                        ) : (
                          "📷"
                        )}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhoto} />
                      <p className="mt-6 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Profile Photo</p>
                      <p className="mt-4 text-[12px] leading-6 text-slate-400">Recommended: 400x400px<br />(1:1 Square Ratio)</p>
                    </div>

                    <div className="mt-10 grid gap-6">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className={labelClassName}>Full Name (Locked to Account)</label>
                          <a href={supportLink()} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">Change via Support</a>
                        </div>
                        <input
                          value={[profile.first_name, profile.last_name].filter(Boolean).join(" ")}
                          readOnly
                          className={`${fieldClassName} cursor-not-allowed opacity-60`}
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Email Address</label>
                        <input value={resume.personal.email} onChange={(event) => updatePersonal("email", event.target.value)} className={fieldClassName} />
                      </div>
                      <div>
                        <label className={labelClassName}>Phone Number</label>
                        <input
                          value={resume.personal.phone}
                          onChange={(event) => updatePersonal("phone", event.target.value)}
                          placeholder="985012XXXX"
                          className={fieldClassName}
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Location</label>
                        <input value={resume.personal.location} onChange={(event) => updatePersonal("location", event.target.value)} className={fieldClassName} />
                      </div>
                      <div>
                        <label className={labelClassName}>LinkedIn</label>
                        <input value={resume.personal.linkedIn} onChange={(event) => updatePersonal("linkedIn", event.target.value)} className={fieldClassName} />
                      </div>
                      <div>
                        <label className={labelClassName}>GitHub</label>
                        <input value={resume.personal.github} onChange={(event) => updatePersonal("github", event.target.value)} className={fieldClassName} />
                      </div>
                      <div>
                        <label className={labelClassName}>Portfolio / Website</label>
                        <input value={resume.personal.portfolio} onChange={(event) => updatePersonal("portfolio", event.target.value)} className={fieldClassName} />
                      </div>
                      <div>
                        <label className={labelClassName}>Total Experience</label>
                        <input
                          value={resume.personal.totalExperience}
                          onChange={(event) => updatePersonal("totalExperience", event.target.value)}
                          className={fieldClassName}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeSection === "experience" ? (
                  <div className="space-y-5">
                    {resume.experience.map((item, index) => (
                      <div key={item.id} className="rounded-[2.6rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:px-8">
                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className={labelClassName}>Role Title</label>
                            <input value={item.title} onChange={(event) => setExperienceField(item.id, "title", event.target.value)} className={fieldClassName} />
                          </div>
                          <div>
                            <label className={labelClassName}>Company</label>
                            <input value={item.company} onChange={(event) => setExperienceField(item.id, "company", event.target.value)} className={fieldClassName} />
                          </div>
                        </div>
                        <div className="mt-5">
                          <div className="flex items-center justify-between">
                            <label className={labelClassName}>Highlights</label>
                          </div>
                          <div className="mt-3 space-y-3">
                            {item.highlights.map((highlight, hIndex) => (
                              <div key={hIndex} className="flex items-start gap-2">
                                <textarea
                                  value={highlight}
                                  onChange={(e) => {
                                    const newHighlights = [...item.highlights];
                                    newHighlights[hIndex] = e.target.value;
                                    setExperienceField(item.id, "highlights", newHighlights);
                                  }}
                                  className={`${fieldClassName} mt-0 min-h-[80px] flex-1`}
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setBusyAction(`optimize-${item.id}-${hIndex}`);
                                    try {
                                      const res = await apiFetch<{ optimized: string }>("/api/ai/optimize-bullet", {
                                        method: "POST",
                                        body: JSON.stringify({ bullet: highlight, role: item.title, company: item.company }),
                                      });
                                      const newHighlights = [...item.highlights];
                                      newHighlights[hIndex] = res.optimized;
                                      setExperienceField(item.id, "highlights", newHighlights);
                                    } finally {
                                      setBusyAction(null);
                                    }
                                  }}
                                  disabled={busyAction !== null || isLocked}
                                  className="mt-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-primary transition hover:bg-slate-100"
                                  title="Optimize with AI"
                                >
                                  {busyAction === `optimize-${item.id}-${hIndex}` ? "⏳" : "✨"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newHighlights = item.highlights.filter((_, i) => i !== hIndex);
                                    setExperienceField(item.id, "highlights", newHighlights);
                                  }}
                                  disabled={isLocked}
                                  className="mt-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setExperienceField(item.id, "highlights", [...item.highlights, ""]);
                              }}
                              disabled={isLocked}
                              className="text-[11px] font-black uppercase tracking-widest text-primary hover:underline"
                            >
                              + Add Highlight
                            </button>
                          </div>
                        </div>
                        {index === resume.experience.length - 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setResume((current) => ({
                                ...current,
                                experience: [
                                  ...current.experience,
                                  { id: crypto.randomUUID(), title: "", company: "", location: "", startDate: "", endDate: "", current: false, highlights: [""] },
                                ],
                              }))
                            }
                            className="mt-6 rounded-full border border-slate-200 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-500"
                          >
                            Add Role
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {activeSection === "education" ? (
                  <div className="space-y-5">
                    {resume.education.map((item, index) => (
                      <div key={item.id} className="rounded-[2.6rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:px-8">
                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className={labelClassName}>Degree</label>
                            <input value={item.degree} onChange={(event) => setEducationField(item.id, "degree", event.target.value)} className={fieldClassName} />
                          </div>
                          <div>
                            <label className={labelClassName}>Institution</label>
                            <input value={item.school} onChange={(event) => setEducationField(item.id, "school", event.target.value)} className={fieldClassName} />
                          </div>
                        </div>
                        {index === resume.education.length - 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setResume((current) => ({
                                ...current,
                                education: [
                                  ...current.education,
                                  { id: crypto.randomUUID(), school: "", degree: "", field: "", startDate: "", endDate: "", grade: "", location: "" },
                                ],
                              }))
                            }
                            className="mt-6 rounded-full border border-slate-200 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-500"
                          >
                            Add Education
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {activeSection === "skills" ? (
                  <div className="rounded-[2.6rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:px-8">
                    <label className={labelClassName}>Skills</label>
                    <textarea
                      value={resume.skills.join(", ")}
                      onChange={(event) =>
                        setResume((current) => ({
                          ...current,
                          skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean),
                        }))
                      }
                      className={`${fieldClassName} min-h-[180px]`}
                      placeholder="Product Strategy, SQL, Stakeholder Management, Figma"
                    />
                  </div>
                ) : null}

                {activeSection === "projects" ? (
                  <div className="space-y-5">
                    {resume.projects.map((item, index) => (
                      <div key={item.id} className="rounded-[2.6rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:px-8">
                        <div>
                          <label className={labelClassName}>Project Name</label>
                          <input value={item.name} onChange={(event) => setProjectField(item.id, "name", event.target.value)} className={fieldClassName} />
                        </div>
                        <div className="mt-5">
                          <label className={labelClassName}>Highlights</label>
                          <textarea
                            value={item.highlights.join("\n")}
                            onChange={(event) => setProjectField(item.id, "highlights", event.target.value.split("\n").filter(Boolean))}
                            className={`${fieldClassName} min-h-[160px]`}
                          />
                        </div>
                        {index === resume.projects.length - 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setResume((current) => ({
                                ...current,
                                projects: [...current.projects, { id: crypto.randomUUID(), name: "", role: "", link: "", highlights: [""] }],
                              }))
                            }
                            className="mt-6 rounded-full border border-slate-200 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-500"
                          >
                            Add Project
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {activeSection === "certifications" ? (
                  <div className="space-y-5">
                    {resume.certifications.map((item, index) => (
                      <div key={item.id} className="rounded-[2.6rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:px-8">
                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className={labelClassName}>Certification Name</label>
                            <input value={item.name} onChange={(event) => setCertificationField(item.id, "name", event.target.value)} className={fieldClassName} />
                          </div>
                          <div>
                            <label className={labelClassName}>Issuer</label>
                            <input value={item.issuer} onChange={(event) => setCertificationField(item.id, "issuer", event.target.value)} className={fieldClassName} />
                          </div>
                        </div>
                        <div className="mt-5">
                          <label className={labelClassName}>Issued On</label>
                          <input value={item.issuedOn} onChange={(event) => setCertificationField(item.id, "issuedOn", event.target.value)} className={fieldClassName} placeholder="e.g. Jan 2024" />
                        </div>
                        {index === resume.certifications.length - 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setResume((current) => ({
                                ...current,
                                certifications: [
                                  ...current.certifications,
                                  { id: crypto.randomUUID(), name: "", issuer: "", issuedOn: "", credentialId: "", link: "" },
                                ],
                              }))
                            }
                            className="mt-6 rounded-full border border-slate-200 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-500"
                          >
                            Add Certification
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {activeSection === "volunteer" ? (
                  <div className="space-y-5">
                    {resume.volunteer?.map((item, index) => (
                      <div key={item.id} className="rounded-[2.6rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:px-8">
                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className={labelClassName}>Organization</label>
                            <input value={item.organization} onChange={(event) => setVolunteerField(item.id, "organization", event.target.value)} className={fieldClassName} />
                          </div>
                          <div>
                            <label className={labelClassName}>Role</label>
                            <input value={item.role} onChange={(event) => setVolunteerField(item.id, "role", event.target.value)} className={fieldClassName} />
                          </div>
                        </div>
                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                          <div>
                            <label className={labelClassName}>Start Date</label>
                            <input value={item.startDate} onChange={(event) => setVolunteerField(item.id, "startDate", event.target.value)} className={fieldClassName} placeholder="MMM YYYY" />
                          </div>
                          <div>
                            <label className={labelClassName}>End Date</label>
                            <input value={item.endDate} onChange={(event) => setVolunteerField(item.id, "endDate", event.target.value)} className={fieldClassName} placeholder="MMM YYYY or Present" />
                          </div>
                        </div>
                        <div className="mt-5">
                          <label className={labelClassName}>Highlights</label>
                          <textarea
                            value={item.highlights.join("\n")}
                            onChange={(event) => setVolunteerField(item.id, "highlights", event.target.value.split("\n").filter(Boolean))}
                            className={`${fieldClassName} min-h-[160px]`}
                          />
                        </div>
                        {index === (resume.volunteer?.length ?? 0) - 1 || !resume.volunteer?.length ? (
                          <button
                            type="button"
                            onClick={() =>
                              setResume((current) => ({
                                ...current,
                                volunteer: [
                                  ...(current.volunteer || []),
                                  { id: crypto.randomUUID(), organization: "", role: "", startDate: "", endDate: "", highlights: [""] },
                                ],
                              }))
                            }
                            className="mt-6 rounded-full border border-slate-200 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-500"
                          >
                            Add Volunteer Experience
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {(!resume.volunteer || resume.volunteer.length === 0) && (
                      <button
                        type="button"
                        onClick={() =>
                          setResume((current) => ({
                            ...current,
                            volunteer: [
                              { id: crypto.randomUUID(), organization: "", role: "", startDate: "", endDate: "", highlights: [""] },
                            ],
                          }))
                        }
                        className="rounded-full border border-slate-200 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-500"
                      >
                        Add Volunteer Experience
                      </button>
                    )}
                  </div>
                ) : null}

                {activeSection === "more" ? (
                  <div className="space-y-6">
                    <div className="rounded-[2.6rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:px-8">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary mb-6">Targeting & ATS Optimization</p>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className={labelClassName}>Target Role</label>
                          <input
                            value={resume.ats.targetRole}
                            onChange={(event) => setResume((current) => ({ ...current, ats: { ...current.ats, targetRole: event.target.value } }))}
                            className={fieldClassName}
                            placeholder="e.g. Senior Product Manager"
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>Target Company</label>
                          <input
                            value={resume.ats.targetCompany}
                            onChange={(event) => setResume((current) => ({ ...current, ats: { ...current.ats, targetCompany: event.target.value } }))}
                            className={fieldClassName}
                            placeholder="e.g. Google"
                          />
                        </div>
                      </div>
                      <div className="mt-6">
                        <label className={labelClassName}>Primary Job Description</label>
                        <textarea
                          value={resume.ats.targetJobDescription}
                          onChange={(event) =>
                            setResume((current) => ({ ...current, ats: { ...current.ats, targetJobDescription: event.target.value } }))
                          }
                          className={`${fieldClassName} min-h-[180px]`}
                          placeholder="Paste the JD to improve ATS matching and interview tailoring"
                        />
                      </div>
                      <div className="mt-8 flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-700">Real-time ATS Score</p>
                          <p className="text-xs text-slate-500 mt-1">Based on keyword density and achievement impact.</p>
                        </div>
                        <div className={`text-2xl font-black ${atsScore > 80 ? "text-emerald-500" : atsScore > 50 ? "text-amber-500" : "text-rose-500"}`}>
                          {atsScore}%
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[2.6rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:px-8 opacity-50 cursor-not-allowed">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400 mb-4">Multi-Job Batch Processing (Premium)</p>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Compare your resume against 3-5 similar jobs simultaneously to identify aggregate gaps.
                      </p>
                      <button disabled className="mt-6 rounded-full border border-slate-200 bg-white px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                        + Add Additional JD
                      </button>
                    </div>

                    <div className="space-y-5">
                      <p className="ml-4 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Additional Sections (Languages, Awards, etc.)</p>
                      {resume.more?.map((item) => (
                        <div key={item.id} className="rounded-[2.6rem] border border-slate-100 bg-white px-6 py-7 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:px-8">
                          <div className="grid gap-5 md:grid-cols-2">
                            <div>
                              <label className={labelClassName}>Section Name</label>
                              <input
                                value={item.label}
                                onChange={(event) =>
                                  setResume((current) => ({
                                    ...current,
                                    more: current.more.map((m) => (m.id === item.id ? { ...m, label: event.target.value } : m)),
                                  }))
                                }
                                className={fieldClassName}
                                placeholder="e.g. Languages"
                              />
                            </div>
                            <div>
                              <label className={labelClassName}>Value</label>
                              <input
                                value={item.value}
                                onChange={(event) =>
                                  setResume((current) => ({
                                    ...current,
                                    more: current.more.map((m) => (m.id === item.id ? { ...m, value: event.target.value } : m)),
                                  }))
                                }
                                className={fieldClassName}
                                placeholder="e.g. English (Native), Hindi (Fluent)"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setResume((current) => ({
                                ...current,
                                more: current.more.filter((m) => m.id !== item.id),
                              }))
                            }
                            className="mt-4 text-[10px] font-black uppercase tracking-widest text-rose-500"
                          >
                            Remove Section
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setResume((current) => ({
                            ...current,
                            more: [...current.more, { id: crypto.randomUUID(), label: "", value: "" }],
                          }))
                        }
                        className="rounded-full border border-slate-200 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-500"
                      >
                        + Add Custom Section
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </EditorCard>

            <EditorCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Professional Summary</p>
                  <p className="mt-4 text-[18px] leading-9 text-slate-500">This appears prominently in the preview and final PDF.</p>
                </div>
                <button
                  type="button"
                  onClick={() => runAiAction("summary")}
                  disabled={busyAction !== null}
                  className="rounded-full border border-slate-200 bg-white px-6 py-4 text-[12px] font-black uppercase tracking-[0.24em] text-primary shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
                >
                  {busyAction === "summary" ? "Improving" : "AI Improve"}
                </button>
              </div>
              <textarea
                value={resume.summary}
                onChange={(event) => setResume((current) => ({ ...current, summary: event.target.value }))}
                placeholder="Summarize your profile. Press Enter to start a bulleted list."
                className={`${fieldClassName} mt-6 min-h-[180px]`}
              />
            </EditorCard>

            <EditorCard>
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Accent</span>
                  {accentOptions.map((accent) => (
                    <button
                      key={accent}
                      type="button"
                      onClick={() => setResume((current) => ({ ...current, style: { ...current.style, accent } }))}
                      className="h-7 w-7 rounded-full"
                      style={{
                        backgroundColor: accent,
                        boxShadow: resume.style.accent === accent ? "0 0 0 4px rgba(15,23,42,0.12)" : "none",
                      }}
                    />
                  ))}
                  <input
                    value={resume.style.accent}
                    onChange={(event) => setResume((current) => ({ ...current, style: { ...current.style, accent: event.target.value } }))}
                    className="ml-2 w-[120px] rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Typography</span>
                  <select
                    value={resume.style.typography}
                    onChange={(event) =>
                      setResume((current) => ({
                        ...current,
                        style: { ...current.style, typography: event.target.value as ResumeData["style"]["typography"] },
                      }))
                    }
                    className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
                  >
                    <option value="modern-sans">Modern Sans</option>
                    <option value="editorial-serif">Editorial Serif</option>
                    <option value="technical-mono">Technical Mono</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-primary">
                💡 Style Tip: Professional & Clean
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-[11px] font-black uppercase tracking-[0.26em] text-slate-400">
                <span>{saving ? "Autosaving" : "Changes Secure and Synced"}</span>
                <span>ATS Score {atsScore}%</span>
              </div>
              {saveError ? <p className="mt-4 text-sm text-rose-600">{saveError}</p> : null}
            </EditorCard>

            <EditorCard className="space-y-5" data-print-block="true">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Advanced AI Tools</p>
                  <p className="mt-3 text-[16px] leading-8 text-slate-500">
                    New secure features are tucked below the original editor flow so the UI stays familiar.
                  </p>
                </div>
                <div className="rounded-full bg-emerald-50 px-5 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-emerald-600">
                  ATS {atsScore}%
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (hasActiveResumePass) {
                      void runAiAction("cover-letter");
                    } else {
                      void startPayment("cover_letter");
                    }
                  }}
                  disabled={busyAction !== null}
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-600 disabled:opacity-50"
                >
                  {busyAction === "cover-letter"
                    ? "Generating…"
                    : hasActiveResumePass
                      ? "Cover Letter"
                      : "Unlock Cover Letter ₹49"}
                </button>
                <button
                  type="button"
                  onClick={() => (hasMockInterviewCredit ? runAiAction("mock-interview") : startPayment("mock_interview"))}
                  disabled={busyAction !== null}
                  className="rounded-full bg-slate-950 px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-white disabled:opacity-60"
                >
                  {hasMockInterviewCredit ? "Mock Interview" : "Unlock Interview"}
                </button>
                {hasActiveResumePass ? (
                  <button
                    type="button"
                    onClick={() => download("docx")}
                    disabled={busyAction !== null}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-[12px] font-black uppercase tracking-[0.24em] text-slate-600 disabled:opacity-50"
                  >
                    Export DOC
                  </button>
                ) : null}
              </div>

              {coverLetter ? (
                <div className="rounded-[2.2rem] border border-slate-100 bg-slate-50 px-6 py-6">
                  {/* Header row with action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Cover Letter</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void copyCoverLetter()}
                        className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 shadow-sm transition hover:bg-slate-50"
                      >
                        {coverLetterCopied ? "✓ Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        onClick={downloadCoverLetter}
                        className="rounded-full bg-primary px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-[0_8px_20px_rgba(48,103,234,0.2)] transition hover:brightness-105"
                      >
                        Download .txt
                      </button>
                    </div>
                  </div>
                  {/* Letter body */}
                  <p className="mt-5 whitespace-pre-wrap text-sm leading-8 text-slate-600">{coverLetter}</p>
                  {/* Reminder */}
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                    Tip: review &amp; personalise before sending
                  </p>
                </div>
              ) : null}

              {interviewItems.length > 0 ? (
                <div className="space-y-4">
                  {interviewItems.slice(0, 5).map((item, index) => (
                    <div key={`${item.question}-${index}`} className="rounded-[2.2rem] border border-slate-100 bg-slate-50 px-6 py-6">
                      <p className="text-sm font-black text-slate-900">{item.question}</p>
                      <p className="mt-4 text-sm leading-8 text-slate-600">{item.answer}</p>
                      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.24em] text-primary">{item.tone_guidance}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </EditorCard>

            <EditorCard data-print-block="true">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Support</p>
                  <p className="mt-3 text-[16px] leading-8 text-slate-500">
                    Name changes, export issues, payment questions, and support escalation now include secure backend context automatically.
                  </p>
                </div>
                <a
                  href={supportLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 bg-white px-6 py-4 text-[12px] font-black uppercase tracking-[0.24em] text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
                >
                  WhatsApp Support
                </a>
              </div>
            </EditorCard>
            </div>
            <div className="w-full xl:w-[42%] xl:sticky xl:top-6">
              <ResumePreview
                resume={{
                  ...resume,
                  style: {
                    ...resume.style,
                    accent: resume.style.accent || selectedTemplate.config_json.accent,
                  },
                }}
                template={selectedTemplate}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
