import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultTemplates = [
  {
    id: "minimal-ats",
    template_name: "ATS Minimal",
    preview_image: "/templates/minimal-ats.png",
    description: "Clean ATS-safe layout with a strong recruiter scan path.",
    tags: ["ATS", "Minimal", "Professional"],
    config_json: {
      accent: "#0f6c7c",
      headerBackground: "#0f6c7c",
      pageBackground: "#ffffff",
      sidebarTint: "#f8fafc",
      density: "balanced",
      typography: "modern-sans",
      columns: "split",
    },
    active: true
  }
];

async function check() {
  console.log("Checking templates table...");
  const { data: templates, error: tError } = await supabase.from("templates").select("id");
  
  if (tError) {
    console.error("Error fetching templates:", tError);
  } else {
    console.log(`Found ${templates ? templates.length : 0} templates in DB.`);
    if (!templates || templates.length === 0) {
      console.log("Templates table is empty. Seeding minimal-ats...");
      const { error: sError } = await supabase.from("templates").upsert(defaultTemplates);
      if (sError) console.error("Error seeding templates:", sError);
      else console.log("Successfully seeded default templates!");
    }
  }

  console.log("Checking resumes table for ats_score...");
  const { error: rError } = await supabase.from("resumes").select("ats_score").limit(1);
  if (rError) {
    console.error("Error checking resumes table:", rError.message);
    if (rError.message.includes("ats_score")) {
      console.log("CONFIRMED: ats_score column is missing in the database.");
    }
  } else {
    console.log("ats_score column exists.");
  }
}

check().catch(console.error);
