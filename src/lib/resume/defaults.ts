import type {
  AdditionalItem,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeData,
} from "@/lib/types";

function createExperienceItem(): ExperienceItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    highlights: [""],
  };
}

function createEducationItem(): EducationItem {
  return {
    id: crypto.randomUUID(),
    school: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    grade: "",
    location: "",
  };
}

function createProjectItem(): ProjectItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    role: "",
    link: "",
    highlights: [""],
  };
}

function createCertificationItem(): CertificationItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    issuer: "",
    issuedOn: "",
    credentialId: "",
    link: "",
  };
}

function createAdditionalItem(): AdditionalItem {
  return {
    id: crypto.randomUUID(),
    label: "",
    value: "",
  };
}

export function createDefaultResumeData(): ResumeData {
  return {
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      linkedIn: "",
      github: "",
      portfolio: "",
      totalExperience: "",
      headline: "",
      profilePhotoUrl: "",
    },
    summary: "",
    experience: [createExperienceItem()],
    education: [createEducationItem()],
    skills: [],
    projects: [createProjectItem()],
    certifications: [createCertificationItem()],
    more: [createAdditionalItem()],
    style: {
      accent: "#0f6c7c",
      typography: "modern-sans",
    },
    ats: {
      targetRole: "",
      targetCompany: "",
      targetJobDescription: "",
      score: null,
    },
  };
}

export const resumeSectionAliases: Record<string, string[]> = {
  summary: ["professional summary", "summary", "about me", "career objective", "profile"],
  experience: ["experience", "professional experience", "work history", "employment"],
  education: ["education", "academic background", "qualifications"],
  skills: ["skills", "core skills", "technical skills", "expertise"],
  projects: ["projects", "project experience", "key projects"],
  certifications: ["certifications", "licenses", "credentials"],
};

export function calculateAtsScore(resume: ResumeData) {
  let score = 45;

  if (resume.personal.firstName && resume.personal.lastName) score += 10;
  if (resume.summary.trim().length > 120) score += 10;
  if (resume.experience.some((item) => item.title && item.company)) score += 10;
  if (resume.education.some((item) => item.school && item.degree)) score += 7;
  if (resume.skills.length >= 5) score += 8;
  if (resume.ats.targetJobDescription.trim()) score += 5;
  if (resume.projects.some((item) => item.name)) score += 3;
  if (resume.certifications.some((item) => item.name)) score += 2;

  return Math.min(score, 99);
}
