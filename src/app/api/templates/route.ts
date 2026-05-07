import { ok, fail } from "@/lib/api-response";
import { listTemplates } from "@/lib/resume/repository";

export async function GET() {
  try {
    return ok({ templates: await listTemplates() });
  } catch (error) {
    return fail(error, 500);
  }
}
