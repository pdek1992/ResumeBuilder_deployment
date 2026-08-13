import type React from "react";
import type { ResumePreviewProps } from "../resume-preview-content";
import { SleekDarkTemplate } from "./SleekDarkTemplate";
import { ModernColumnsTemplate } from "./ModernColumnsTemplate";
import { ModularCardTemplate } from "./ModularCardTemplate";
import { SidebarDarkTemplate } from "./SidebarDarkTemplate";
import { SidebarCirclesTemplate } from "./SidebarCirclesTemplate";
import { BannerSoftTemplate } from "./BannerSoftTemplate";
import { GridLabelsTemplate } from "./GridLabelsTemplate";
import { CorporateMinimalTemplate } from "./CorporateMinimalTemplate";
import { ExecutiveSerifTemplate } from "./ExecutiveSerifTemplate";
import { UltraCleanTemplate } from "./UltraCleanTemplate";
import { VibrantAccentTemplate } from "./VibrantAccentTemplate";
import { PastelSoftTemplate } from "./PastelSoftTemplate";
import { HybridProTemplate } from "./HybridProTemplate";
import { LuxuryGoldTemplate } from "./LuxuryGoldTemplate";
import { ImpactfulBoldTemplate } from "./ImpactfulBoldTemplate";
import { InfographicSplitTemplate } from "./InfographicSplitTemplate";
import { StartupMetricsTemplate } from "./StartupMetricsTemplate";
import { AcademicClassicTemplate } from "./AcademicClassicTemplate";
import { CreativeDesignerSplitTemplate } from "./CreativeDesignerSplitTemplate";
import { BoldHeaderAccentTemplate } from "./BoldHeaderAccentTemplate";
import { CreativeBoldTemplate } from "./CreativeBoldTemplate";
import { DeepCharcoalTemplate } from "./DeepCharcoalTemplate";
import { StandardTemplate } from "./StandardTemplate";

export const TemplateRegistry: Record<string, React.FC<ResumePreviewProps>> = {
  "standard": StandardTemplate,
  "sleek-dark": SleekDarkTemplate,
  "modern-columns": ModernColumnsTemplate,
  "modular-card": ModularCardTemplate,
  "sidebar-dark": SidebarDarkTemplate,
  "sidebar-dark-right": SidebarDarkTemplate,
  "sidebar-circles": SidebarCirclesTemplate,
  "banner-soft": BannerSoftTemplate,
  "grid-labels": GridLabelsTemplate,
  "corporate-minimal": CorporateMinimalTemplate,
  "executive-serif": ExecutiveSerifTemplate,
  "ultra-clean": UltraCleanTemplate,
  "vibrant-accent": VibrantAccentTemplate,
  "pastel-soft": PastelSoftTemplate,
  "hybrid-pro": HybridProTemplate,
  "luxury-gold": LuxuryGoldTemplate,
  "impactful-bold": ImpactfulBoldTemplate,
  "infographic-split": InfographicSplitTemplate,
  "startup-metrics": StartupMetricsTemplate,
  "academic-classic": AcademicClassicTemplate,
  "creative-designer-split": CreativeDesignerSplitTemplate,
  "bold-header-accent": BoldHeaderAccentTemplate,
  "creative-bold": CreativeBoldTemplate,
  "deep-charcoal": DeepCharcoalTemplate,
};
