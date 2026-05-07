export const runtime = "nodejs";

import { ok, fail } from "@/lib/api-response";
import { logUserAction } from "@/lib/logging";
import { markPaymentFailed, markPaymentPaid } from "@/lib/payments/access";
import { verifyRazorpaySignature } from "@/lib/payments/razorpay";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
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

    const body = (await request.json()) as {
      paymentType: PaymentType;
      resumeId?: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    const verified = verifyRazorpaySignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });

    if (!verified) {
      await markPaymentFailed(body.razorpay_order_id, "signature_mismatch");
      await logUserAction({
        userId: user.id,
        actionType: "payment_failure",
        metadata: {
          orderId: body.razorpay_order_id,
          paymentType: body.paymentType,
        },
      });
      return fail("Payment verification failed", 400);
    }

    const payment = await markPaymentPaid({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
    });

    await logUserAction({
      userId: user.id,
      actionType: "payment_success",
      metadata: {
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        paymentType: payment.payment_type,
      },
    });

    return ok({ payment });
  } catch (error) {
    return fail(error, 400);
  }
}
