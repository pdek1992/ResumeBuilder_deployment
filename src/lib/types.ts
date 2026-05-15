export type AuthProvider = "password" | "google";

export type AiOutputMode =
  | "RAW_TEXT"
  | "JSON"
  | "HTML"
  | "RESUME_SECTION"
  | "COVER_LETTER"
  | "MOCK_INTERVIEW";

export type PaymentType =
  | "resume_download"
  | "mock_interview"
  | "cover_letter";

export type PaymentStatus =
  | "created"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

export type AccessActionType =
  | "signup"
  | "login"
  | "logout"
  | "payment_success"
  | "payment_failure"
  | "resume_create"
  | "resume_edit"
  | "template_change"
  | "pdf_download"
  | "docx_download"
  | "ai_generation"
  | "support_request"
  | "account_deletion"
  | "suspicious_activity"
  | "resume_import"
  | "cover_letter_generate"
  | "mock_interview_generate";

export type ResumeSectionKey =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "more";

export type TypographyStyle = "modern-sans" | "editorial-serif" | "technical-mono";

export type ResumeThemeConfig = {
  accent: string;
  headerBackground: string;
  pageBackground: string;
  sidebarTint?: string;
  density: "compact" | "balanced" | "airy";
  previewClassName?: string;
  typography: TypographyStyle;
  columns: "single" | "split";
  layout?: 
    | "standard"
    | "modular-card"
    | "sidebar-circles"
    | "banner-soft"
    | "grid-labels"
    | "sidebar-dark"
    | "sleek-dark"
    | "modern-columns"
    | "executive-serif"
    | "luxury-gold"
    | "corporate-minimal"
    | "deep-charcoal"
    | "infographic-split"
    | "startup-metrics"
    | "academic-classic"
    | "ultra-clean"
    | "creative-bold"
    | "pastel-soft"
    | "vibrant-accent"
    | "impactful-bold"
    | "hybrid-pro"
    | "creative-designer-split"
    | "bold-header-accent";
};

export type PersonalInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  github: string;
  portfolio: string;
  totalExperience: string;
  headline: string;
  profilePhotoUrl: string;
};

export type ExperienceItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
};

export type EducationItem = {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade: string;
  location: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  role: string;
  link: string;
  highlights: string[];
};

export type CertificationItem = {
  id: string;
  name: string;
  issuer: string;
  issuedOn: string;
  credentialId: string;
  link: string;
};


export type AdditionalItem = {
  id: string;
  label: string;
  value: string;
};

export type ResumeData = {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  more: AdditionalItem[];
  style: {
    accent: string;
    typography: TypographyStyle;
  };
  ats: {
    targetRole: string;
    targetCompany: string;
    targetJobDescription: string;
    score: number | null;
  };
};

export type ResumeRecord = {
  id: string;
  user_id: string;
  template_id: string;
  title: string;
  raw_json_compressed: string;
  parsed_sections: Record<string, unknown> | null;
  current_draft_state: Record<string, unknown> | null;
  ats_score: number | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
};

export type TemplateRecord = {
  id: string;
  template_name: string;
  preview_image: string;
  config_json: ResumeThemeConfig;
  description: string;
  tags: string[];
  active: boolean;
  icon?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  mobile: string | null;
  password_hash?: string | null;
  auth_provider: AuthProvider;
  full_name_locked: boolean;
  first_name: string;
  last_name: string;
  consent_given: boolean;
  consent_timestamp: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  deleted_at: string | null;
  ai_config: Record<string, any>;
};

export type AccessLogPayload = {
  userId: string;
  email?: string;
  actionType: AccessActionType;
  metadata?: Record<string, unknown>;
};

export type ResumeImportPayload = {
  extractedText: string;
  mappedResume: ResumeData;
  aliases: Record<string, string[]>;
};

export type MockInterviewItem = {
  question: string;
  answer: string;
  tone_guidance: string;
};

export type SupportContext = {
  user: Pick<UserProfile, "email" | "mobile" | "first_name" | "last_name">;
  currentAction: string;
  activePaymentType: PaymentType | null;
  lastErrors: string[];
  recentLogs: Array<Record<string, unknown>>;
};
