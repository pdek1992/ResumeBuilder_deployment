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
  let score = 30; // Base score

  // Basic Contact Info (15 pts)
  if (resume.personal.firstName && resume.personal.lastName) score += 5;
  if (resume.personal.email && (resume.personal.phone || resume.personal.linkedIn)) score += 5;
  if (resume.personal.location) score += 5;

  // Professional Content (40 pts)
  if (resume.summary.trim().length > 150) score += 10;
  if (resume.experience.length >= 2) score += 10;
  else if (resume.experience.length === 1) score += 5;
  if (resume.education.length >= 1) score += 10;
  if (resume.skills.length >= 8) score += 10;
  else if (resume.skills.length >= 4) score += 5;

  // Targeting & Alignment (30 pts) - HEAVY WEIGHT
  if (resume.ats.targetRole) score += 10;
  if (resume.ats.targetCompany) score += 5;
  if (resume.ats.targetJobDescription && resume.ats.targetJobDescription.length > 100) score += 15;

  // Extras (5 pts)
  if (resume.projects.length >= 1 && resume.projects[0].name) score += 2;
  if (resume.certifications.length >= 1 && resume.certifications[0].name) score += 2;
  if (resume.more?.length >= 1 && resume.more[0].label) score += 1;

  return Math.min(score, 100);
}
