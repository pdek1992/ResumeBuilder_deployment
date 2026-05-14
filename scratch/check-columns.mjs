import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const columns = ["ats_score", "parsed_sections", "current_draft_state", "is_locked"];
  console.log("Checking resumes table columns...");
  
  for (const col of columns) {
    const { error } = await supabase.from("resumes").select(col).limit(1);
    if (error) {
      console.log(`Column '${col}' is MISSING: ${error.message}`);
    } else {
      console.log(`Column '${col}' exists.`);
    }
  }
}

check().catch(console.error);
