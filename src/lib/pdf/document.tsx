import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import type { ResumeData, TemplateRecord } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a", backgroundColor: "#ffffff" },
  pageContent: { padding: 32 },
  header: { padding: 24, marginBottom: 18 },
  headerBannerSoft: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, padding: 32, marginBottom: 24 },
  name: { fontSize: 24, fontWeight: 700, color: "#ffffff" },
  nameDark: { fontSize: 24, fontWeight: 700, color: "#0f172a" },
  headline: { marginTop: 4, fontSize: 11, color: "#e2e8f0" },
  headlineDark: { marginTop: 4, fontSize: 11, color: "#475569" },
  contact: { marginTop: 8, fontSize: 9, color: "#cbd5e1" },
  contactDark: { marginTop: 8, fontSize: 9, color: "#64748b" },
  bodySplit: { flexDirection: "row" },
  main: { flex: 1.2, paddingRight: 16 },
  side: { flex: 0.8, paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: "#e2e8f0" },
  sidebarDark: { width: "30%", padding: 24, color: "#ffffff" },
  mainContent: { flex: 1, padding: 24 },
  section: { marginBottom: 16 },
  sectionCard: { marginBottom: 16, padding: 16, backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#f1f5f9" },
  sectionTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 },
  paragraph: { fontSize: 9.5, lineHeight: 1.6, color: "#334155" },
  itemTitle: { fontSize: 11, fontWeight: 700, color: "#0f172a" },
  itemMeta: { fontSize: 9, color: "#64748b", marginBottom: 6 },
  bullet: { marginLeft: 10, marginBottom: 3, fontSize: 9.5, lineHeight: 1.5, color: "#334155" },
  skillItem: { marginBottom: 4, flexDirection: "row", alignItems: "center" },
  skillDot: { width: 3, height: 3, borderRadius: 1.5, marginRight: 6 },
  skillLabel: { fontSize: 9.5, color: "#334155" },
  gridSkill: { backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "4 8", borderRadius: 6, marginRight: 4, marginBottom: 4, fontSize: 8, fontWeight: 700, textTransform: "uppercase" },
  icon: { width: 48, height: 48, opacity: 0.2 },
  sidebarIcon: { width: 40, height: 40, marginBottom: 20, opacity: 0.4 }
});

function Section({ title, children, accent, layout }: { title: string; children: React.ReactNode; accent: string; layout?: string }) {
  const isCard = layout === "modular-card";
  const isGridLabels = layout === "grid-labels";
  return (
    <View style={[isCard ? styles.sectionCard : styles.section, isGridLabels ? { backgroundColor: "#0f172a", padding: 16, borderRadius: 12 } : {}]}>
      <Text style={{ ...styles.sectionTitle, color: isGridLabels ? "#ffffff" : accent }}>{title}</Text>
      {children}
    </View>
  );
}

export function ResumePdfDocument({ resume, template }: { resume: ResumeData; template: TemplateRecord }) {
  const accent = resume.style.accent || template.config_json.accent;
  const layout = template.config_json.layout || "standard";
  const headerBackground = template.config_json.headerBackground || accent;
  const isSplit = template.config_json.columns === "split";
  const fullName = `${resume.personal.firstName} ${resume.personal.lastName}`.trim() || "Your Name";

  const renderPersonal = (isDarkHeader = false) => (
    <View style={[
      layout === "banner-soft" ? styles.headerBannerSoft : styles.header,
      { backgroundColor: (isDarkHeader || layout === "modular-card") ? "transparent" : headerBackground, marginBottom: (isDarkHeader || layout === "sidebar-dark") ? 0 : 24, padding: layout === "sidebar-dark" ? 0 : 32 }
    ]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={[isDarkHeader || layout === "modular-card" ? styles.nameDark : styles.name, { fontSize: 28 }]}>{fullName}</Text>
          <Text style={[isDarkHeader || layout === "modular-card" ? styles.headlineDark : styles.headline, { marginTop: 8, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }]}>
            {resume.personal.headline || resume.ats.targetRole || "Professional Headline"}
          </Text>
          <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDarkHeader || layout === "modular-card" ? "#f1f5f9" : "rgba(255,255,255,0.1)", flexDirection: "row", gap: 12 }}>
            <Text style={[isDarkHeader || layout === "modular-card" ? styles.contactDark : styles.contact, { fontSize: 9 }]}>
              {[resume.personal.location, resume.personal.phone, resume.personal.email].filter(Boolean).join("  •  ")}
            </Text>
          </View>
        </View>
        {template.icon && !isDarkHeader && layout !== "sidebar-dark" && (
          <View style={{ width: 70, height: 70, backgroundColor: layout === "modular-card" ? "#f8fafc" : "rgba(255,255,255,0.1)", borderRadius: 15, justifyContent: "center", alignItems: "center" }}>
            <Image src={template.icon} style={[styles.icon, { width: 40, height: 40, opacity: layout === "modular-card" ? 1 : 0.4 }]} />
          </View>
        )}
      </View>
    </View>
  );

  const renderSkills = (isDarkBg = false) => (
    <Section title="Skills" accent={isDarkBg ? "#ffffff" : accent} layout={layout}>
      <View style={layout === "grid-labels" ? { flexDirection: "row", flexWrap: "wrap", marginTop: 8 } : { marginTop: 8 }}>
        {resume.skills.map((skill) => (
          <View key={skill} style={layout === "grid-labels" ? styles.gridSkill : styles.skillItem}>
            {layout !== "grid-labels" && (
              <View style={[styles.skillDot, { backgroundColor: isDarkBg ? "#ffffff" : accent }, layout === "sidebar-circles" ? { width: 6, height: 6, borderRadius: 3 } : {}]} />
            )}
            <Text style={[styles.skillLabel, isDarkBg || layout === "grid-labels" ? { color: "#ffffff" } : {}]}>{skill}</Text>
          </View>
        ))}
      </View>
    </Section>
  );

  const renderExperience = (isDark = false) => resume.experience.map(item => (
    <View key={item.id} style={{ marginBottom: 12 }}>
      <Text style={isDark ? { fontSize: 11, fontWeight: 700, color: "#ffffff" } : styles.itemTitle}>{item.title}</Text>
      <Text style={isDark ? { fontSize: 9, color: "#ffffff", opacity: 0.8, marginBottom: 6 } : styles.itemMeta}>{[item.company, item.location].filter(Boolean).join(" | ")}</Text>
      {item.highlights.filter(Boolean).map((h, i) => <Text key={i} style={isDark ? { marginLeft: 10, marginBottom: 3, fontSize: 9.5, lineHeight: 1.5, color: "#e2e8f0" } : styles.bullet}>• {h}</Text>)}
    </View>
  ));

  const renderEducation = (isDark = false) => resume.education.map(item => (
    <View key={item.id} style={{ marginBottom: 10 }}>
      <Text style={isDark ? { fontSize: 11, fontWeight: 700, color: "#ffffff" } : styles.itemTitle}>{item.degree}</Text>
      <Text style={isDark ? { fontSize: 9, color: "#ffffff", opacity: 0.8, marginBottom: 6 } : styles.itemMeta}>{item.school}</Text>
    </View>
  ));

  const renderProjects = (isDark = false) => resume.projects.map(item => (
    <View key={item.id} style={{ marginBottom: 10 }}>
      <Text style={isDark ? { fontSize: 11, fontWeight: 700, color: "#ffffff" } : styles.itemTitle}>{item.name}</Text>
      {item.highlights.filter(Boolean).map((h, i) => <Text key={i} style={isDark ? { marginLeft: 10, marginBottom: 3, fontSize: 9.5, lineHeight: 1.5, color: "#e2e8f0" } : styles.bullet}>• {h}</Text>)}
    </View>
  ));


  const renderCertifications = (isDark = false) => resume.certifications.map(item => (
    <Text key={item.id} style={isDark ? { marginLeft: 10, marginBottom: 3, fontSize: 9.5, lineHeight: 1.5, color: "#e2e8f0" } : styles.bullet}>
      • {[item.name, item.issuer].filter(Boolean).join(" — ")}
    </Text>
  ));

  return (
    <Document title={fullName}>
      <Page size="A4" style={styles.page}>
        {layout === "sidebar-dark" ? (
          <View style={{ flexDirection: "row", minHeight: "100%" }}>
            <View style={[styles.sidebarDark, { backgroundColor: template.config_json.sidebarTint || accent }]}>
              {template.icon && <Image src={template.icon} style={styles.sidebarIcon} />}
              {renderSkills(true)}
              <Section title="Education" accent="#ffffff">{renderEducation(true)}</Section>
              {resume.certifications.some(c => c.name) && <Section title="Certifications" accent="#ffffff">{renderCertifications(true)}</Section>}
            </View>
            <View style={styles.mainContent}>
              {renderPersonal(true)}
              <Section title="Professional Summary" accent={accent} layout={layout}><Text style={styles.paragraph}>{resume.summary}</Text></Section>
              <Section title="Experience" accent={accent} layout={layout}>{renderExperience()}</Section>
              {resume.projects.some(p => p.name) && <Section title="Projects" accent={accent} layout={layout}>{renderProjects()}</Section>}
              {resume.more?.map(item => <Section key={item.id} title={item.label} accent={accent} layout={layout}><Text style={styles.paragraph}>{item.value}</Text></Section>)}
            </View>
          </View>
        ) : (
          <View>
            {renderPersonal()}
            <View style={[styles.pageContent, isSplit ? styles.bodySplit : {}]}>
              <View style={isSplit ? styles.main : {}}>
                <Section title="Professional Summary" accent={accent} layout={layout}><Text style={styles.paragraph}>{resume.summary}</Text></Section>
                <Section title="Experience" accent={accent} layout={layout}>{renderExperience()}</Section>
                {resume.projects.some(p => p.name) && <Section title="Projects" accent={accent} layout={layout}>{renderProjects()}</Section>}
                {!isSplit && (
                  <>
                    {renderSkills()}
                    <Section title="Education" accent={accent} layout={layout}>{renderEducation()}</Section>
                    {resume.certifications.some(c => c.name) && <Section title="Certifications" accent={accent} layout={layout}>{renderCertifications()}</Section>}
                  </>
                )}
              </View>

              {isSplit && (
                <View style={styles.side}>
                  {renderSkills()}
                  <Section title="Education" accent={accent} layout={layout}>{renderEducation()}</Section>
                  {resume.certifications.some(c => c.name) && <Section title="Certifications" accent={accent} layout={layout}>{renderCertifications()}</Section>}
                </View>
              )}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
