# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scripts\codex-e2e-resume-flow.spec.ts >> sign in, import resume, choose template, and reach payment checkout
- Location: scripts\codex-e2e-resume-flow.spec.ts:10:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('iframe[src*=\'checkout.razorpay.com\']').or(getByText('Razorpay'))
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('iframe[src*=\'checkout.razorpay.com\']').or(getByText('Razorpay'))

```

```yaml
- alert
- main:
  - paragraph: VigilSiddhi AI Chat
  - paragraph: Ask me to add a role, rewrite your summary, or tweak your skills.
  - paragraph: ✨
  - paragraph: "\"Add a new role as Senior Product Manager at Google from 2022 to 2024\""
  - textbox "Type an instruction..."
  - button "→" [disabled]
  - paragraph: Powered by Gemini 1.5 Pro
  - link "VigilSiddhi Logo VigilSiddhiAI":
    - /url: /dashboard
    - img "VigilSiddhi Logo"
    - text: VigilSiddhiAI
  - link "Switch Style":
    - /url: /builder/templates?resumeId=94e99910-78e4-4dc7-b875-9e76d1560af8
  - button "✨ AI Chat"
  - button "Duplicate"
  - button "Lock"
  - button "AI Tailor"
  - button "Download PDF"
  - link "Exit":
    - /url: /dashboard
  - link "Contact support":
    - /url: https://wa.me/9823340379?text=Resume%20Builder%20Support%20Request%0AUser%3A%20Prashant%20Kadam%0AEmail%3A%20pdek4ai%40gmail.com%0AResume%20ID%3A%2094e99910-78e4-4dc7-b875-9e76d1560af8%0ACurrent%20Section%3A%20personal%0ATemplate%3A%20ATS%20Minimal
    - text: 🎧
  - button "personal"
  - button "experience"
  - button "education"
  - button "skills"
  - button "projects"
  - button "certifications"
  - button "more"
  - text: Theme ATS Minimal
  - button "📷"
  - paragraph: Profile Photo
  - paragraph: "Recommended: 400x400px (1:1 Square Ratio)"
  - text: Full Name (Locked to Account)
  - link "Change via Support":
    - /url: https://wa.me/9823340379?text=Resume%20Builder%20Support%20Request%0AUser%3A%20Prashant%20Kadam%0AEmail%3A%20pdek4ai%40gmail.com%0AResume%20ID%3A%2094e99910-78e4-4dc7-b875-9e76d1560af8%0ACurrent%20Section%3A%20personal%0ATemplate%3A%20ATS%20Minimal
  - textbox: Prashant Kadam
  - text: Email Address
  - textbox: pdek1991@gmail.com
  - text: Phone Number
  - textbox "985012XXXX": (+91) 9823340379
  - text: Location
  - textbox: Mumbai, INDIA
  - text: LinkedIn
  - textbox
  - text: GitHub
  - textbox
  - text: Portfolio / Website
  - textbox
  - text: Total Experience
  - textbox: 11 Years 11 Months
  - paragraph: Professional Summary
  - paragraph: This appears prominently in the preview and final PDF.
  - button "AI Improve"
  - textbox "Summarize your profile. Press Enter to start a bulleted list.": Certified Kubernetes Administrator (CKA) with 11+ years in the TV broadcast industry, specializing in Kubernetes, Docker, OpenShift, and system health monitoring using Grafana, Kibana, and Prometheus. I excel in building scalable, high-availability infrastructures and automating workflows with tools like Jenkins and GitHub. Proficient in Python and Bash scripting, I’ve automated routine tasks, improved system reliability, and created real-time monitoring dashboards to enhance service delivery and minimize downtime.
  - text: Accent
  - button
  - button
  - button
  - button
  - button
  - button
  - textbox: "#3b82f6"
  - text: Typography
  - combobox:
    - option "Modern Sans" [selected]
    - option "Editorial Serif"
    - option "Technical Mono"
  - text: "💡 Style Tip: Professional & Clean Changes Secure and Synced ATS Score 95%"
  - paragraph: Unexpected error
  - paragraph: Live Preview
  - text: Page-by-Page View
  - heading "PRASHANT D KADAM" [level=1]
  - paragraph: Duty Engineer
  - paragraph: Mumbai, INDIA | (+91) 9823340379 | pdek1991@gmail.com
  - heading "Professional Summary" [level=3]
  - paragraph: Certified Kubernetes Administrator (CKA) with 11+ years in the TV broadcast industry, specializing in Kubernetes, Docker, OpenShift, and system health monitoring using Grafana, Kibana, and Prometheus. I excel in building scalable, high-availability infrastructures and automating workflows with tools like Jenkins and GitHub. Proficient in Python and Bash scripting, I’ve automated routine tasks, improved system reliability, and created real-time monitoring dashboards to enhance service delivery and minimize downtime.
  - heading "Experience" [level=3]
  - paragraph: Duty Engineer
  - paragraph: Sony Pictures Networks
  - list:
    - listitem: Leveraging DevOps practices to streamline operations and enhance system reliability.
    - listitem: Managing live events (e.g., Australian Open, WWE, UFC, and Hockey), running playout systems for 50+ channels, and handling media asset management using DIVA, GBLabs, and AWS S3 Deep Glacier.
    - listitem: Automating repetitive tasks using BASH and Python.
    - listitem: Delivering efficient, scalable, and resilient infrastructure solutions.
    - listitem: Working on Synamedia compression and VGCAS system.
  - paragraph: Deputy Manager Broadcast, CAS
  - paragraph: Jio
  - list:
    - listitem: Managing more than 14000 service configuration for 25+ Headends.
    - listitem: Working on Verimatrix CAS for 3m + customer base.
    - listitem: Automation using BASH scripting.
    - listitem: Managing multiple Linux servers and CAS components.
    - listitem: Managing OpenShift cluster with autoscaling and HA, including cluster-wide backups.
    - listitem: Creating Grafana dashboards and performing log analysis using Kibana and Prometheus.
  - paragraph: Senior Systems Engineer
  - paragraph: Tata Play
  - list:
    - listitem: Installed and configured critical broadcast equipment (MUX, Modulators, Encoders, IRD).
    - listitem: Created Bash scripts to automate routine tasks.
    - listitem: Designed Grafana dashboards for system health and KPI monitoring.
    - listitem: Utilized Kibana to create monitoring dashboards for tracking critical KPIs.
    - listitem: Led RCA (Root Cause Analysis) for errors, minimizing downtime.
  - paragraph: Senior Broadcast Engineer
  - paragraph: Reliance Communications / Independent TV
  - list:
    - listitem: Installation and configuration of station equipment like MUX, Modulator, Encoders and IRD.
    - listitem: Bandwidth utilization and planning for satellite Transponders.
    - listitem: Root cause analysis to ensure minimization of errors.
    - listitem: Handling XMS and XMU for system monitoring.
    - listitem: Software Release Testing & OTA testing with STB Team.
  - paragraph: Broadcast Engineer
  - paragraph: Prime Focus Technologies (PFT)
  - list:
    - listitem: Configured Appear TV Encoders, Demodulators, and managed multicast IPs for 400+ channels.
    - listitem: Administered SML servers for ERP data storage and installed C-band antennas.
    - listitem: Performed technical fault analysis, system upgrades, and testing of new equipment.
    - listitem: Handled audio watermarking using WMM for secure content distribution.
  - paragraph: Headend Engineer
  - paragraph: IndusInd Media and Communication Ltd
  - list:
    - listitem: Configuration of QAM Modulator, PSI-SI Server, MPEG 2, Encoders.
    - listitem: Preventive Maintenance of equipment.
    - listitem: Installation of new equipment, service swapping, and EPG program handling.
    - listitem: Fault finding in network.
  - heading "Projects" [level=3]
  - paragraph: Multichannel Landslide monitoring using Image Compression Technique
  - paragraph: Image Compression using MATLAB.
  - paragraph: Basic CAS System
  - paragraph: Simulated CAS functionality using a microservices architecture deployed on Kubernetes with Helm.
  - paragraph: Achieved build and deployment times under 10 minutes using Jenkins pipelines.
  - paragraph: Integrated monitoring using the ELK stack, Grafana, and Telegram alerts.
  - paragraph: Developed a Telegram bot integrated with Grafana and AlertManager for real-time notifications.
  - paragraph: Self-Care Portal for CAS
  - paragraph: Designed and developed a desktop application integrating with the existing CAS system.
  - paragraph: Enabled seamless authorization and authentication via Enterprise LDAP.
  - paragraph: Streamlined workflows for testing teams, saving significant engineering hours and reducing delivery timelines by 25%.
  - heading "Skills" [level=3]
  - list:
    - listitem: Kubernetes Orchestration (CKA Certified)
    - listitem: OpenShift Administration
    - listitem: CI/CD Pipeline Management (Jenkins)
    - listitem: Monitoring and Alerting (Grafana Kibana Prometheus ELK Stack)
    - listitem: Configuration Management and Version Control (Git)
    - listitem: Linux Administration (Ubuntu Red Hat CentOS)
    - listitem: Database Management (MySQL)
    - listitem: Root Cause Analysis (RCA) and Incident Management
    - listitem: API Testing (Postman JMeter Custom Scripts)
    - listitem: Process Documentation and Operational Guides
    - listitem: Strategic Planning and Execution
    - listitem: Python
    - listitem: Bash scripting
  - heading "Education" [level=3]
  - paragraph: B.Tech/B.E.
  - paragraph: Pune University
  - heading "Certifications" [level=3]
  - paragraph: Certified Kubernetes Administrator (CKA) Program
  - paragraph: DO280 Redhat Openshift Administration 2 Training
  - paragraph: "DO180 Red Hat OpenShift I: Containers & Kubernetes Training"
  - paragraph: DO380 Redhat Openshift Administrator 3 Training
  - text: Preview Page 1 Ready for Export ATS Optimized Structure
  - paragraph: Advanced AI Tools
  - paragraph: New secure features are tucked below the original editor flow so the UI stays familiar.
  - text: ATS 95%
  - button "Unlock Cover Letter ₹49"
  - button "Unlock Interview"
  - paragraph: Support
  - paragraph: Name changes, export issues, payment questions, and support escalation now include secure backend context automatically.
  - link "WhatsApp Support":
    - /url: https://wa.me/9823340379?text=Resume%20Builder%20Support%20Request%0AUser%3A%20Prashant%20Kadam%0AEmail%3A%20pdek4ai%40gmail.com%0AResume%20ID%3A%2094e99910-78e4-4dc7-b875-9e76d1560af8%0ACurrent%20Section%3A%20personal%0ATemplate%3A%20ATS%20Minimal
```

# Test source

```ts
  1  | import { expect, test } from "C:/Users/DELL/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/@playwright/test/index.mjs";
  2  | 
  3  | const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3015";
  4  | const email = process.env.E2E_EMAIL;
  5  | const password = process.env.E2E_PASSWORD;
  6  | const resumeFile = process.env.E2E_RESUME_FILE;
  7  | 
  8  | test.use({ channel: "chrome" });
  9  | 
  10 | test("sign in, import resume, choose template, and reach payment checkout", async ({ page }) => {
  11 |   if (!email || !password || !resumeFile) {
  12 |     throw new Error("E2E_EMAIL, E2E_PASSWORD, and E2E_RESUME_FILE are required");
  13 |   }
  14 | 
  15 |   await page.goto(`${baseUrl}/sign-in?next=%2Fbuilder%2Fimport`);
  16 |   await page.getByLabel("Email Address").fill(email);
  17 |   await page.getByLabel("Password").fill(password);
  18 |   await page.getByRole("button", { name: "Sign In" }).click();
  19 | 
  20 |   await page.waitForURL((url) => url.pathname === "/builder/import" || url.pathname === "/settings", {
  21 |     timeout: 30000,
  22 |   });
  23 |   if (page.url().includes("/settings")) {
  24 |     const accept = page.getByRole("button", { name: "Accept and Continue" });
  25 |     if (await accept.isVisible()) {
  26 |       await accept.click();
  27 |     }
  28 |   }
  29 | 
  30 |   await page.waitForURL(/\/builder\/import/, { timeout: 30000 });
  31 |   await page.locator("input[type='file']").setInputFiles(resumeFile);
  32 |   await page.getByRole("button", { name: "Structure with AI" }).click();
  33 | 
  34 |   await page.waitForURL(/\/builder\/templates\?resumeId=/, { timeout: 180000 });
  35 |   await page.getByRole("button").filter({ hasText: "ATS Minimal" }).click();
  36 | 
  37 |   await page.waitForURL(/\/builder\/[^/]+$/, { timeout: 30000 });
  38 |   await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible({ timeout: 30000 });
  39 |   await page.getByRole("button", { name: "Download PDF" }).click();
  40 | 
> 41 |   await expect(page.locator("iframe[src*='checkout.razorpay.com']").or(page.getByText("Razorpay"))).toBeVisible({
     |                                                                                                     ^ Error: expect(locator).toBeVisible() failed
  42 |     timeout: 30000,
  43 |   });
  44 | });
  45 | 
```