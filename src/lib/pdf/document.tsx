import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";

import type { ResumeData, TemplateRecord } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  pageContent: {
    padding: 32,
  },
  header: {
    padding: 24,
    marginBottom: 18,
  },
  headerBannerSoft: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 32,
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    color: "#ffffff",
  },
  nameDark: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
  },
  headline: {
    marginTop: 4,
    fontSize: 11,
    color: "#e2e8f0",
  },
  headlineDark: {
    marginTop: 4,
    fontSize: 11,
    color: "#475569",
  },
  contact: {
    marginTop: 8,
    fontSize: 9,
    color: "#cbd5e1",
  },
  contactDark: {
    marginTop: 8,
    fontSize: 9,
    color: "#64748b",
  },
  bodySplit: {
    flexDirection: "row",
  },
  main: {
    flex: 1.2,
    paddingRight: 16,
  },
  side: {
    flex: 0.8,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },
  sidebarDark: {
    width: "30%",
    padding: 24,
    color: "#ffffff",
  },
  mainContent: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 9.5,
    lineHeight: 1.6,
    color: "#334155",
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
  },
  itemMeta: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 6,
  },
  bullet: {
    marginLeft: 10,
    marginBottom: 3,
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#334155",
  },
  skillItem: {
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  skillDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginRight: 6,
  },
  skillLabel: {
    fontSize: 9.5,
    color: "#334155",
  },
  gridSkill: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: "4 8",
    borderRadius: 6,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  icon: {
    width: 48,
    height: 48,
    opacity: 0.2,
  },
  sidebarIcon: {
    width: 40,
    height: 40,
    marginBottom: 20,
    opacity: 0.4,
  }
});

function Section({ title, children, accent, layout }: { title: string; children: React.ReactNode; accent: string; layout?: string }) {
  const isCard = layout === "modular-card";
  return (
    <View style={isCard ? styles.sectionCard : styles.section}>
      <Text style={{ ...styles.sectionTitle, color: accent }}>{title}</Text>
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
      { backgroundColor: isDarkHeader ? "transparent" : headerBackground }
    ]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View>
          <Text style={isDarkHeader ? styles.nameDark : styles.name}>{fullName}</Text>
          <Text style={isDarkHeader ? styles.headlineDark : styles.headline}>
            {resume.personal.headline || resume.ats.targetRole || "Professional Headline"}
          </Text>
          <Text style={isDarkHeader ? styles.contactDark : styles.contact}>
            {[resume.personal.location, resume.personal.phone, resume.personal.email].filter(Boolean).join(" | ")}
          </Text>
        </View>
        {template.icon && !isDarkHeader && (
          <Image src={template.icon} style={styles.icon} />
        )}
      </View>
    </View>
  );

  const renderSkills = (isDarkBg = false) => (
    <Section title="Skills" accent={isDarkBg ? "#ffffff" : accent} layout={layout}>
      <View style={layout === "grid-labels" ? { flexDirection: "row", flexWrap: "wrap" } : {}}>
        {resume.skills.map((skill) => (
          <View key={skill} style={layout === "grid-labels" ? styles.gridSkill : styles.skillItem}>
            {layout !== "grid-labels" && <View style={[styles.skillDot, { backgroundColor: isDarkBg ? "#ffffff" : accent }]} />}
            <Text style={[styles.skillLabel, isDarkBg ? { color: "#ffffff" } : {}]}>{skill}</Text>
          </View>
        ))}
      </View>
    </Section>
  );

  return (
    <Document title={fullName}>
      <Page size="A4" style={styles.page}>
        {layout === "sidebar-dark" ? (
          <View style={{ flexDirection: "row", minHeight: "100%" }}>
            <View style={[styles.sidebarDark, { backgroundColor: template.config_json.sidebarTint || accent }]}>
              {template.icon && <Image src={template.icon} style={styles.sidebarIcon} />}
              {renderSkills(true)}
              <Section title="Education" accent="#ffffff">
                {resume.education.map((item) => (
                  <View key={item.id} style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: 700, color: "#ffffff" }}>{item.degree}</Text>
                    <Text style={{ fontSize: 9, color: "#ffffff", opacity: 0.8 }}>{item.school}</Text>
                  </View>
                ))}
              </Section>
            </View>
            <View style={styles.mainContent}>
              {renderPersonal(true)}
              <Section title="Professional Summary" accent={accent} layout={layout}>
                <Text style={styles.paragraph}>{resume.summary}</Text>
              </Section>
              <Section title="Experience" accent={accent} layout={layout}>
                {resume.experience.map((item) => (
                  <View key={item.id} style={{ marginBottom: 12 }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>{[item.company, item.location].filter(Boolean).join(" | ")}</Text>
                    {item.highlights.filter(Boolean).map((highlight, index) => (
                      <Text key={index} style={styles.bullet}>• {highlight}</Text>
                    ))}
                  </View>
                ))}
              </Section>
            </View>
          </View>
        ) : (
          <View>
            {renderPersonal()}
            <View style={[styles.pageContent, isSplit ? styles.bodySplit : {}]}>
              <View style={isSplit ? styles.main : {}}>
                <Section title="Professional Summary" accent={accent} layout={layout}>
                  <Text style={styles.paragraph}>{resume.summary}</Text>
                </Section>
                <Section title="Experience" accent={accent} layout={layout}>
                  {resume.experience.map((item) => (
                    <View key={item.id} style={{ marginBottom: 12, position: "relative" }}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemMeta}>{[item.company, item.location].filter(Boolean).join(" | ")}</Text>
                      {item.highlights.filter(Boolean).map((highlight, index) => (
                        <Text key={index} style={styles.bullet}>• {highlight}</Text>
                      ))}
                    </View>
                  ))}
                </Section>
                {resume.projects.some((item) => item.name) && (
                  <Section title="Projects" accent={accent} layout={layout}>
                    {resume.projects.map((item) => (
                      <View key={item.id} style={{ marginBottom: 10 }}>
                        <Text style={styles.itemTitle}>{item.name}</Text>
                        {item.highlights.filter(Boolean).map((highlight, index) => (
                          <Text key={index} style={styles.bullet}>• {highlight}</Text>
                        ))}
                      </View>
                    ))}
                  </Section>
                )}
              </View>

              {isSplit && (
                <View style={styles.side}>
                  {renderSkills()}
                  <Section title="Education" accent={accent} layout={layout}>
                    {resume.education.map((item) => (
                      <View key={item.id} style={{ marginBottom: 10 }}>
                        <Text style={styles.itemTitle}>{item.degree}</Text>
                        <Text style={styles.itemMeta}>{item.school}</Text>
                      </View>
                    ))}
                  </Section>
                  {resume.certifications.some((item) => item.name) && (
                    <Section title="Certifications" accent={accent} layout={layout}>
                      {resume.certifications.map((item) => (
                        <Text key={item.id} style={styles.bullet}>
                          • {[item.name, item.issuer].filter(Boolean).join(" — ")}
                        </Text>
                      ))}
                    </Section>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
