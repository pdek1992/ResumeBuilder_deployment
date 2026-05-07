import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { ResumeData, TemplateRecord } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 18,
  },
  name: {
    fontSize: 23,
    fontWeight: 700,
    color: "#ffffff",
  },
  headline: {
    marginTop: 4,
    fontSize: 11,
    color: "#e2e8f0",
  },
  contact: {
    marginTop: 8,
    fontSize: 9,
    color: "#cbd5e1",
  },
  bodySplit: {
    flexDirection: "row",
    gap: 16,
  },
  main: {
    flex: 1.2,
  },
  side: {
    flex: 0.8,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 9.5,
    lineHeight: 1.5,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 700,
  },
  itemMeta: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 4,
  },
  bullet: {
    marginLeft: 10,
    marginBottom: 2,
    fontSize: 9,
    lineHeight: 1.45,
  },
  skill: {
    marginBottom: 4,
    fontSize: 9,
  },
});

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: accent }}>{title}</Text>
      {children}
    </View>
  );
}

export function ResumePdfDocument({ resume, template }: { resume: ResumeData; template: TemplateRecord }) {
  const accent = resume.style.accent || template.config_json.accent;
  const headerBackground = template.config_json.headerBackground || accent;
  const split = template.config_json.columns === "split";
  const fullName = `${resume.personal.firstName} ${resume.personal.lastName}`.trim() || "Your Name";

  return (
    <Document title={fullName}>
      <Page size="A4" style={styles.page}>
        <View style={{ ...styles.header, backgroundColor: headerBackground }}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.headline}>{resume.personal.headline || "Professional Headline"}</Text>
          <Text style={styles.contact}>
            {[resume.personal.location, resume.personal.phone, resume.personal.email].filter(Boolean).join(" | ")}
          </Text>
        </View>

        <View style={split ? styles.bodySplit : undefined}>
          <View style={split ? styles.main : undefined}>
            <Section title="Professional Summary" accent={accent}>
              <Text style={styles.paragraph}>{resume.summary}</Text>
            </Section>

            <Section title="Experience" accent={accent}>
              {resume.experience.map((item) => (
                <View key={item.id} style={{ marginBottom: 10 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemMeta}>{[item.company, item.location].filter(Boolean).join(" | ")}</Text>
                  {item.highlights.filter(Boolean).map((highlight, index) => (
                    <Text key={`${item.id}-${index}`} style={styles.bullet}>
                      • {highlight}
                    </Text>
                  ))}
                </View>
              ))}
            </Section>

            {resume.projects.some((item) => item.name) ? (
              <Section title="Projects" accent={accent}>
                {resume.projects.map((item) => (
                  <View key={item.id} style={{ marginBottom: 8 }}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    {item.highlights.filter(Boolean).map((highlight, index) => (
                      <Text key={`${item.id}-${index}`} style={styles.bullet}>
                        • {highlight}
                      </Text>
                    ))}
                  </View>
                ))}
              </Section>
            ) : null}
          </View>

          <View style={split ? styles.side : undefined}>
            <Section title="Skills" accent={accent}>
              {resume.skills.map((skill) => (
                <Text key={skill} style={styles.skill}>
                  • {skill}
                </Text>
              ))}
            </Section>

            <Section title="Education" accent={accent}>
              {resume.education.map((item) => (
                <View key={item.id} style={{ marginBottom: 8 }}>
                  <Text style={styles.itemTitle}>{item.degree}</Text>
                  <Text style={styles.itemMeta}>{item.school}</Text>
                </View>
              ))}
            </Section>

            {resume.certifications.some((item) => item.name) ? (
              <Section title="Certifications" accent={accent}>
                {resume.certifications.map((item) => (
                  <Text key={item.id} style={styles.skill}>
                    • {[item.name, item.issuer].filter(Boolean).join(" — ")}
                  </Text>
                ))}
              </Section>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}
