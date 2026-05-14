export const runtime = "nodejs";

import { ok, fail } from "@/lib/api-response";
import { env } from "@/lib/env";
import { logUserAction } from "@/lib/logging";
import { createPaymentRecord } from "@/lib/payments/access";
import { getRazorpayClient } from "@/lib/payments/razorpay";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin, getRequestMetadata } from "@/lib/security/request";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PaymentType } from "@/lib/types";

export async function POST(request: Request) {
  try {
    await assertSafeOrigin();
    await assertCsrf();

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fail("Authentication required", 401);
    }

    const metadata = await getRequestMetadata();
    await assertRateLimit({
      actionType: "payment_failure",
      userId: user.id,
      ipAddress: metadata.ipAddress,
      max: 15,
      windowMinutes: 10,
    });

    const body = (await request.json()) as {
      paymentType: PaymentType;
      resumeId?: string;
    };

    const amountInRupees = body.paymentType === "mock_interview" ? env.mockInterviewPrice : env.resumeDownloadPrice;
    const client = getRazorpayClient();
    const order = await client.orders.create({
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt: `${body.paymentType}-${Date.now()}`,
      notes: {
        userId: user.id,
        resumeId: body.resumeId ?? "",
      },
    });

    await createPaymentRecord({
      userId: user.id,
      orderId: order.id,
      amount: amountInRupees,
      paymentType: body.paymentType,
    });

    await logUserAction({
      userId: user.id,
      actionType: "payment_failure",
      metadata: {
        stage: "order_created",
        orderId: order.id,
        paymentType: body.paymentType,
      },
    });

    return ok({
      keyId: env.razorpayKeyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("[Payments] Failed to create Razorpay order:", error);
    return fail(error, 400);
  }
}
