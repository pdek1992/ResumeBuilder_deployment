import { addHours } from "date-fns";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PaymentType } from "@/lib/types";

export async function createPaymentRecord({
  userId,
  orderId,
  amount,
  paymentType,
}: {
  userId: string;
  orderId: string;
  amount: number;
  paymentType: PaymentType;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      order_id: orderId,
      amount,
      payment_type: paymentType,
      status: "created",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
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
  const { data: current } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (!current) {
    throw new Error("Payment record not found");
  }

  const expiresAt =
    current.payment_type === "resume_download" || current.payment_type === "cover_letter"
      ? addHours(new Date(), 24).toISOString()
      : null;

  const { data, error } = await supabase
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
    .eq("order_id", orderId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function markPaymentFailed(orderId: string, reason: string) {
  const supabase = getSupabaseAdminClient();
  await supabase
    .from("payments")
    .update({
      status: "failed",
      metadata_json: {
        failure_reason: reason,
      },
    })
    .eq("order_id", orderId);
}

export async function getActiveResumePass(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .eq("payment_type", "resume_download")
    .eq("status", "paid")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
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
