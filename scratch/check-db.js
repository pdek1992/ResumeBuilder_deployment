const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

// Load .env
dotenv.config();

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
    return;
  }
  
  console.log(`Found ${templates ? templates.length : 0} templates in DB.`);
  
  if (!templates || templates.length === 0) {
    console.log("Templates table is empty. Seeding minimal-ats...");
    const { error: sError } = await supabase.from("templates").upsert(defaultTemplates);
    
    if (sError) {
      console.error("Error seeding templates:", sError);
    } else {
      console.log("Successfully seeded default templates!");
    }
  } else {
    const hasMinimal = templates.some(t => t.id === "minimal-ats");
    if (!hasMinimal) {
      console.log("minimal-ats missing. Seeding...");
      await supabase.from("templates").upsert(defaultTemplates);
    } else {
      console.log("minimal-ats already exists.");
    }
  }
}

check().catch(console.error);
