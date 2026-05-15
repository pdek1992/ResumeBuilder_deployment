import { addHours } from "date-fns";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PaymentType } from "@/lib/types";

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

function isSchemaCompatibilityError(error: SupabaseErrorLike | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    error?.code === "23514" ||
    message.includes("could not find") ||
    message.includes("does not exist") ||
    message.includes("violates check constraint")
  );
}

async function getPaymentByOrderId(orderId: string) {
  const supabase = getSupabaseAdminClient();
  const canonical = await supabase.from("payments").select("*").eq("order_id", orderId).maybeSingle();

  if (!canonical.error) {
    return { data: canonical.data, orderColumn: "order_id" as const };
  }

  if (!isSchemaCompatibilityError(canonical.error)) {
    throw canonical.error;
  }

  const legacy = await supabase.from("payments").select("*").eq("razorpay_order_id", orderId).maybeSingle();

  if (legacy.error) {
    throw legacy.error;
  }

  return { data: legacy.data, orderColumn: "razorpay_order_id" as const };
}

export async function createPaymentRecord({
  userId,
  orderId,
  amount,
  paymentType,
  metadata = {},
}: {
  userId: string;
  orderId: string;
  amount: number;
  paymentType: PaymentType;
  metadata?: Record<string, any>;
}) {
  const supabase = getSupabaseAdminClient();
  const canonical = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      order_id: orderId,
      amount,
      payment_type: paymentType,
      status: "created",
      metadata_json: metadata,
    })
    .select("*")
    .single();

  if (!canonical.error) {
    return canonical.data;
  }

  if (!isSchemaCompatibilityError(canonical.error)) {
    throw canonical.error;
  }

  const legacy = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      razorpay_order_id: orderId,
      amount,
      payment_type: paymentType,
      status: "pending",
    })
    .select("*")
    .single();

  if (legacy.error) {
    throw legacy.error;
  }

  return legacy.data;
}

export async function markPaymentPaid({
  orderId,
  paymentId,
  method,
}: {
  orderId: string;
  paymentId: string;
  method?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data: current, orderColumn } = await getPaymentByOrderId(orderId);

  if (!current) {
    throw new Error("Payment record not found");
  }

  const expiresAt =
    current.payment_type === "resume_download" || current.payment_type === "cover_letter"
      ? addHours(new Date(), 24).toISOString()
      : null;

  const canonicalUpdate = await supabase
    .from("payments")
    .update({
      status: "paid",
      razorpay_payment_id: paymentId,
      method: method ?? null,
      expires_at: expiresAt,
      metadata_json: {
        ...(current.metadata_json ?? {}),
        consumed: false,
      },
    })
    .eq(orderColumn, orderId)
    .select("*")
    .single();

  if (!canonicalUpdate.error) {
    return canonicalUpdate.data;
  }

  if (!isSchemaCompatibilityError(canonicalUpdate.error)) {
    throw canonicalUpdate.error;
  }

  const legacyUpdate = await supabase
    .from("payments")
    .update({
      status: "paid",
      razorpay_payment_id: paymentId,
      expires_at: expiresAt,
    })
    .eq(orderColumn, orderId)
    .select("*")
    .single();

  if (legacyUpdate.error) {
    throw legacyUpdate.error;
  }

  return legacyUpdate.data;
}

export async function markPaymentFailed(orderId: string, reason: string) {
  const supabase = getSupabaseAdminClient();
  const { orderColumn } = await getPaymentByOrderId(orderId);
  const canonicalUpdate = await supabase
    .from("payments")
    .update({
      status: "failed",
      metadata_json: {
        failure_reason: reason,
      },
    })
    .eq(orderColumn, orderId);

  if (!canonicalUpdate.error || !isSchemaCompatibilityError(canonicalUpdate.error)) {
    if (canonicalUpdate.error) {
      throw canonicalUpdate.error;
    }
    return;
  }

  const legacyUpdate = await supabase.from("payments").update({ status: "failed" }).eq(orderColumn, orderId);

  if (legacyUpdate.error) {
    throw legacyUpdate.error;
  }
}

export async function getActiveResumePass(userId: string, resumeId?: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .eq("payment_type", "resume_download")
    .eq("status", "paid")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (!data || data.length === 0) return null;

  if (resumeId) {
    const exactMatch = data.find((p: any) => p.metadata_json?.resumeId === resumeId);
    if (exactMatch) return exactMatch;
    
    // Support legacy passes that didn't have resumeId
    const legacyMatch = data.find((p: any) => !p.metadata_json?.resumeId);
    if (legacyMatch) return legacyMatch;
    
    return null;
  }

  return data[0];
}

export async function hasCoverLetterAccess(userId: string) {
  const supabase = getSupabaseAdminClient();
  // Check for either a full resume pass OR a specific cover letter pass
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .in("payment_type", ["resume_download", "cover_letter"])
    .eq("status", "paid")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return !!data;
}

export async function consumeMockInterviewPayment(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .eq("payment_type", "mock_interview")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const consumed = Boolean(data.metadata_json?.consumed);

  if (consumed) {
    return null;
  }

  await supabase
    .from("payments")
    .update({
      metadata_json: {
        ...(data.metadata_json ?? {}),
        consumed: true,
        consumed_at: new Date().toISOString(),
      },
    })
    .eq("id", data.id);

  return data;
}

export async function getAvailableMockInterviewPayment(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .eq("payment_type", "mock_interview")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || data.metadata_json?.consumed) {
    return null;
  }

  return data;
}
