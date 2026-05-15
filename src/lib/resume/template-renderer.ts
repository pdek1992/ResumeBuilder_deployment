import type { ResumeThemeConfig } from "@/lib/types";

export type SkillStyle =
  | "dot-list"      // • Skill  (default)
  | "pill-tags"     // [Skill] [Skill]
  | "boxed-grid"    // dark bg pill grid
  | "progress-dot"  // ●●●○○  (sidebar circles style)
  | "plain-list"    // plain text, comma separated
  | "numbered-bar"  // progress bar percentage
  | "inline-tags";  // soft rounded badge inline

export type HeaderStyle =
  | "centered-dark-bg"   // sleek-dark / minimal-ats
  | "centered-light-bg"  // banner-soft
  | "left-standard"      // default (tinted block)
  | "left-border-rule"   // deep underline rule
  | "left-serif-elegant" // serif, oversized name
  | "left-compact"       // compact dense header
  | "grid-two-col";      // grid-labels header variant

export type ExperienceStyle =
  | "timeline-dot"   // dot on left + content
  | "card-block"     // modular-card style
  | "plain-rows"     // minimal rows
  | "border-left"    // left accent border
  | "bold-row";      // title + meta + bullets

export type DividerStyle =
  | "none"
  | "thin-rule"
  | "thick-accent"
  | "full-bg-band"
  | "dotted";

export type SectionHeadingStyle =
  | "uppercase-accent"    // default
  | "dark-bg-band"        // sleek-dark
  | "serif-underline"     // academic / executive
  | "left-border"         // deep-charcoal / impactful
  | "boxed-label"         // grid-labels sidebar
  | "light-pill"          // pastel / soft-minimal
  | "bold-oversized";     // impactful-bold

export interface TemplateRenderConfig {
  /** Resolved layout key from template config */
  layout: string;

  // ── HEADER ──────────────────────────────────────────
  headerStyle: HeaderStyle;
  headerBgOpacity: number;         // 0–100 tint %
  showProfilePhotoInHeader: boolean;
  profilePhotoShape: "circle" | "rounded" | "square";
  profilePhotoSizeClass: string;   // Tailwind h-/w- classes
  showTemplateIconInHeader: boolean;
  contactRow: "inline" | "stacked" | "centered";
  showLinkedInGithub: boolean;

  // ── SIDEBAR ─────────────────────────────────────────
  hasSidebar: boolean;
  sidebarSide: "left" | "right";
  sidebarWidthClass: string;       // w-[32%] etc.
  sidebarBg: string;               // CSS colour or "dark"
  sidebarTextColor: string;
  sidebarSections: string[];       // which sections go sidebar

  // ── BODY / SECTION ORDER ─────────────────────────────
  mainSections: string[];          // sections in render order

  // ── SECTION HEADINGS ─────────────────────────────────
  sectionHeadingStyle: SectionHeadingStyle;
  dividerStyle: DividerStyle;
  sectionSpacingClass: string;     // space-y-*

  // ── SKILLS ───────────────────────────────────────────
  skillStyle: SkillStyle;

  // ── EXPERIENCE ───────────────────────────────────────
  experienceStyle: ExperienceStyle;
  showDateBadge: boolean;

  // ── TYPOGRAPHY ───────────────────────────────────────
  nameSizeClass: string;           // text-[Xpx]
  headlineSizeClass: string;
  bodyTextClass: string;

  // ── MISC ─────────────────────────────────────────────
  useGridLayout: boolean;          // grid-labels style
  gridLabelWidth: string;          // e.g. "160px"
  pageBackground: string;
}

/** Returns the full render config for a given template layout + config_json */
export function getTemplateRenderConfig(
  layout: string,
  config: ResumeThemeConfig,
  accent: string,
): TemplateRenderConfig {
  const base: TemplateRenderConfig = {
    layout,
    headerStyle: "left-standard",
    headerBgOpacity: 8,
    showProfilePhotoInHeader: true,
    profilePhotoShape: "rounded",
    profilePhotoSizeClass: "h-24 w-24",
    showTemplateIconInHeader: false,
    contactRow: "inline",
    showLinkedInGithub: false,
    hasSidebar: false,
    sidebarSide: "left",
    sidebarWidthClass: "w-[32%]",
    sidebarBg: "#f8fafc",
    sidebarTextColor: "#0f172a",
    sidebarSections: ["skills", "education"],
    mainSections: ["summary", "experience", "projects"],
    sectionHeadingStyle: "uppercase-accent",
    dividerStyle: "thin-rule",
    sectionSpacingClass: "space-y-8",
    skillStyle: "dot-list",
    experienceStyle: "plain-rows",
    showDateBadge: true,
    nameSizeClass: "text-[28px] md:text-[34px]",
    headlineSizeClass: "text-[12px]",
    bodyTextClass: "text-[11.5px]",
    useGridLayout: false,
    gridLabelWidth: "160px",
    pageBackground: "#ffffff",
  };

  switch (layout) {
    // ── Sidebar layouts ──────────────────────────────────────────────────
    case "sidebar-dark":
    case "sidebar-dark-right":
      return {
        ...base,
        hasSidebar: true,
        sidebarSide: layout === "sidebar-dark-right" ? "right" : "left",
        sidebarBg: config.sidebarTint || accent,
        sidebarTextColor: "#ffffff",
        sidebarSections: ["skills", "education", "certifications"],
        mainSections: ["summary", "experience", "projects"],
        sectionHeadingStyle: "uppercase-accent",
        headerStyle: "left-standard",
        headerBgOpacity: 0,
        skillStyle: "dot-list",
        experienceStyle: "border-left",
        nameSizeClass: "text-[38px]",
        headlineSizeClass: "text-[13px]",
        showLinkedInGithub: true,
        showProfilePhotoInHeader: false,
        profilePhotoShape: "rounded",
        profilePhotoSizeClass: "h-36 w-36",
      };

    case "sidebar-circles":
      return {
        ...base,
        hasSidebar: true,
        sidebarBg: `${accent}08`,
        sidebarTextColor: "#0f172a",
        sidebarSections: ["skills", "education", "certifications"],
        mainSections: ["summary", "experience", "projects"],
        sectionHeadingStyle: "uppercase-accent",
        skillStyle: "progress-dot",
        experienceStyle: "timeline-dot",
        showProfilePhotoInHeader: false,
        profilePhotoShape: "circle",
        profilePhotoSizeClass: "h-32 w-32",
        nameSizeClass: "text-[28px]",
      };

    // ── Special header layouts ────────────────────────────────────────────
    case "sleek-dark":
      return {
        ...base,
        headerStyle: "centered-dark-bg",
        headerBgOpacity: 100,
        showProfilePhotoInHeader: true,
        profilePhotoShape: "circle",
        profilePhotoSizeClass: "h-32 w-32",
        sectionHeadingStyle: "dark-bg-band",
        skillStyle: "pill-tags",
        experienceStyle: "plain-rows",
        mainSections: ["summary", "experience", "skills", "education", "projects"],
        nameSizeClass: "text-[36px]",
        showLinkedInGithub: true,
        sectionSpacingClass: "space-y-6",
      };

    case "banner-soft":
      return {
        ...base,
        headerStyle: "centered-light-bg",
        headerBgOpacity: 12,
        showProfilePhotoInHeader: true,
        profilePhotoShape: "rounded",
        profilePhotoSizeClass: "h-28 w-28",
        contactRow: "centered",
        showLinkedInGithub: true,
        hasSidebar: false,
        sectionHeadingStyle: "uppercase-accent",
        skillStyle: "pill-tags",
        experienceStyle: "plain-rows",
        mainSections: ["summary", "experience", "skills", "education", "projects"],
        nameSizeClass: "text-[36px]",
        sectionSpacingClass: "space-y-8",
      };

    // ── Grid labels ───────────────────────────────────────────────────────
    case "grid-labels":
      return {
        ...base,
        useGridLayout: true,
        gridLabelWidth: "160px",
        sectionHeadingStyle: "boxed-label",
        skillStyle: "boxed-grid",
        experienceStyle: "plain-rows",
        headerStyle: "left-standard",
        headerBgOpacity: 0,
        mainSections: ["summary", "experience", "projects", "skills", "education"],
        nameSizeClass: "text-[32px]",
        sectionSpacingClass: "space-y-6",
        dividerStyle: "none",
      };

    // ── Modern columns ────────────────────────────────────────────────────
    case "modern-columns":
      return {
        ...base,
        headerStyle: "centered-light-bg",
        headerBgOpacity: 0,
        showProfilePhotoInHeader: true,
        profilePhotoShape: "circle",
        profilePhotoSizeClass: "h-32 w-32",
        contactRow: "centered",
        showLinkedInGithub: true,
        hasSidebar: false,
        skillStyle: "pill-tags",
        sectionHeadingStyle: "uppercase-accent",
        mainSections: ["experience", "education", "projects"],
        sectionSpacingClass: "space-y-6",
        nameSizeClass: "text-[34px]",
      };

    // ── Modular card ──────────────────────────────────────────────────────
    case "modular-card":
      return {
        ...base,
        headerStyle: "left-standard",
        headerBgOpacity: 0,
        skillStyle: "pill-tags",
        experienceStyle: "card-block",
        sectionHeadingStyle: "uppercase-accent",
        mainSections: ["summary", "experience", "projects", "skills", "education"],
        sectionSpacingClass: "space-y-6",
        nameSizeClass: "text-[30px] md:text-[36px]",
      };

    // ── Executive / serif layouts ─────────────────────────────────────────
    case "executive-serif":
      return {
        ...base,
        headerStyle: "left-serif-elegant",
        headerBgOpacity: 10,
        sectionHeadingStyle: "serif-underline",
        dividerStyle: "thick-accent",
        skillStyle: "plain-list",
        experienceStyle: "plain-rows",
        showDateBadge: true,
        mainSections: ["summary", "experience", "projects", "education", "skills"],
        nameSizeClass: "text-[40px]",
        headlineSizeClass: "text-[13px]",
        sectionSpacingClass: "space-y-10",
        showLinkedInGithub: true,
      };

    // ── Luxury gold ───────────────────────────────────────────────────────
    case "luxury-gold":
      return {
        ...base,
        headerStyle: "left-serif-elegant",
        headerBgOpacity: 8,
        sectionHeadingStyle: "serif-underline",
        dividerStyle: "thick-accent",
        skillStyle: "plain-list",
        experienceStyle: "plain-rows",
        mainSections: ["summary", "experience", "projects", "education", "skills"],
        nameSizeClass: "text-[38px]",
        sectionSpacingClass: "space-y-10",
        showLinkedInGithub: true,
      };

    // ── Corporate minimal ─────────────────────────────────────────────────
    case "corporate-minimal":
      return {
        ...base,
        headerStyle: "left-compact",
        headerBgOpacity: 5,
        sectionHeadingStyle: "left-border",
        dividerStyle: "thin-rule",
        skillStyle: "pill-tags",
        experienceStyle: "plain-rows",
        mainSections: ["summary", "experience", "education", "skills", "projects"],
        nameSizeClass: "text-[28px]",
        sectionSpacingClass: "space-y-7",
      };

    // ── Deep charcoal ─────────────────────────────────────────────────────
    case "deep-charcoal":
      return {
        ...base,
        headerStyle: "left-border-rule",
        headerBgOpacity: 12,
        sectionHeadingStyle: "left-border",
        dividerStyle: "thin-rule",
        skillStyle: "pill-tags",
        experienceStyle: "border-left",
        mainSections: ["summary", "experience", "education", "skills", "projects"],
        nameSizeClass: "text-[30px]",
        sectionSpacingClass: "space-y-8",
      };

    // ── Infographic split ─────────────────────────────────────────────────
    case "infographic-split":
      return {
        ...base,
        hasSidebar: true,
        sidebarBg: `${accent}10`,
        sidebarTextColor: "#0f172a",
        sidebarSections: ["skills", "education", "certifications"],
        mainSections: ["summary", "experience", "projects"],
        sectionHeadingStyle: "uppercase-accent",
        skillStyle: "progress-dot",
        experienceStyle: "timeline-dot",
        showProfilePhotoInHeader: false,
        profilePhotoShape: "rounded",
        profilePhotoSizeClass: "h-28 w-28",
        nameSizeClass: "text-[30px]",
        sectionSpacingClass: "space-y-6",
      };

    // ── Startup metrics ───────────────────────────────────────────────────
    case "startup-metrics":
      return {
        ...base,
        hasSidebar: true,
        sidebarBg: `${accent}08`,
        sidebarTextColor: "#0f172a",
        sidebarSections: ["skills", "education"],
        mainSections: ["summary", "experience", "projects"],
        sectionHeadingStyle: "uppercase-accent",
        skillStyle: "pill-tags",
        experienceStyle: "plain-rows",
        showProfilePhotoInHeader: false,
        nameSizeClass: "text-[28px]",
        sectionSpacingClass: "space-y-6",
      };

    // ── Academic classic ──────────────────────────────────────────────────
    case "academic-classic":
      return {
        ...base,
        headerStyle: "left-serif-elegant",
        headerBgOpacity: 8,
        sectionHeadingStyle: "serif-underline",
        dividerStyle: "thin-rule",
        skillStyle: "plain-list",
        experienceStyle: "plain-rows",
        mainSections: ["summary", "education", "experience", "projects", "skills", "certifications"],
        nameSizeClass: "text-[34px]",
        sectionSpacingClass: "space-y-8",
        showLinkedInGithub: true,
      };

    // ── Ultra clean ───────────────────────────────────────────────────────
    case "ultra-clean":
      return {
        ...base,
        headerStyle: "left-compact",
        headerBgOpacity: 0,
        sectionHeadingStyle: "uppercase-accent",
        dividerStyle: "thin-rule",
        skillStyle: "plain-list",
        experienceStyle: "plain-rows",
        mainSections: ["summary", "experience", "education", "skills", "projects"],
        nameSizeClass: "text-[28px]",
        sectionSpacingClass: "space-y-7",
        showDateBadge: false,
      };

    // ── Creative bold (sidebar + expressive) ──────────────────────────────
    case "creative-bold":
      return {
        ...base,
        hasSidebar: true,
        sidebarBg: `${accent}10`,
        sidebarTextColor: "#0f172a",
        sidebarSections: ["skills", "education"],
        mainSections: ["summary", "experience", "projects"],
        sectionHeadingStyle: "bold-oversized",
        skillStyle: "pill-tags",
        experienceStyle: "timeline-dot",
        showProfilePhotoInHeader: false,
        profilePhotoShape: "circle",
        profilePhotoSizeClass: "h-28 w-28",
        nameSizeClass: "text-[32px]",
        sectionSpacingClass: "space-y-6",
        showLinkedInGithub: true,
      };

    // ── Pastel soft ───────────────────────────────────────────────────────
    case "pastel-soft":
      return {
        ...base,
        headerStyle: "left-standard",
        headerBgOpacity: 10,
        sectionHeadingStyle: "light-pill",
        dividerStyle: "dotted",
        skillStyle: "pill-tags",
        experienceStyle: "plain-rows",
        mainSections: ["summary", "experience", "education", "skills", "projects"],
        nameSizeClass: "text-[30px]",
        sectionSpacingClass: "space-y-7",
        showLinkedInGithub: false,
      };

    // ── Vibrant accent (split sidebar) ────────────────────────────────────
    case "vibrant-accent":
      return {
        ...base,
        hasSidebar: true,
        sidebarBg: `${accent}12`,
        sidebarTextColor: "#0f172a",
        sidebarSections: ["skills", "education", "certifications"],
        mainSections: ["summary", "experience", "projects"],
        sectionHeadingStyle: "uppercase-accent",
        skillStyle: "pill-tags",
        experienceStyle: "timeline-dot",
        showProfilePhotoInHeader: false,
        profilePhotoShape: "rounded",
        profilePhotoSizeClass: "h-28 w-28",
        nameSizeClass: "text-[30px]",
        sectionSpacingClass: "space-y-6",
        showLinkedInGithub: true,
      };

    // ── Impactful bold ────────────────────────────────────────────────────
    case "impactful-bold":
      return {
        ...base,
        headerStyle: "left-border-rule",
        headerBgOpacity: 8,
        sectionHeadingStyle: "left-border",
        dividerStyle: "thick-accent",
        skillStyle: "pill-tags",
        experienceStyle: "bold-row",
        mainSections: ["summary", "experience", "projects", "education", "skills"],
        nameSizeClass: "text-[34px]",
        sectionSpacingClass: "space-y-7",
      };

    // ── Hybrid pro (split, balanced) ──────────────────────────────────────
    case "hybrid-pro":
      return {
        ...base,
        hasSidebar: true,
        sidebarBg: `${accent}06`,
        sidebarTextColor: "#0f172a",
        sidebarSections: ["skills", "education", "certifications"],
        mainSections: ["summary", "experience", "projects"],
        sectionHeadingStyle: "uppercase-accent",
        skillStyle: "dot-list",
        experienceStyle: "plain-rows",
        showProfilePhotoInHeader: false,
        profilePhotoShape: "rounded",
        profilePhotoSizeClass: "h-28 w-28",
        nameSizeClass: "text-[28px]",
        sectionSpacingClass: "space-y-6",
      };

    // ── Creative designer split ────────────────────────────────────────────
    case "creative-designer-split":
      return {
        ...base,
        hasSidebar: true,
        sidebarBg: `${accent}10`,
        sidebarTextColor: "#0f172a",
        sidebarSections: ["skills", "education", "certifications"],
        mainSections: ["summary", "experience", "projects"],
        sectionHeadingStyle: "bold-oversized",
        skillStyle: "pill-tags",
        experienceStyle: "timeline-dot",
        showProfilePhotoInHeader: false,
        profilePhotoShape: "circle",
        profilePhotoSizeClass: "h-32 w-32",
        nameSizeClass: "text-[30px]",
        sectionSpacingClass: "space-y-6",
        showLinkedInGithub: true,
      };

    // ── Bold header accent ────────────────────────────────────────────────
    case "bold-header-accent":
      return {
        ...base,
        headerStyle: "left-standard",
        headerBgOpacity: 15,
        sectionHeadingStyle: "left-border",
        dividerStyle: "thick-accent",
        skillStyle: "pill-tags",
        experienceStyle: "plain-rows",
        mainSections: ["summary", "experience", "education", "skills", "projects"],
        nameSizeClass: "text-[36px]",
        sectionSpacingClass: "space-y-7",
        showLinkedInGithub: true,
      };

    // ── Standard fallback ─────────────────────────────────────────────────
    default:
      return {
        ...base,
        hasSidebar: config.columns === "split",
        sidebarBg: config.sidebarTint || `${accent}08`,
        mainSections: ["summary", "experience", "projects", "education", "skills"],
        sectionSpacingClass: "space-y-8",
      };
  }
}
