import crypto from "node:crypto";
import Razorpay from "razorpay";

import { env, assertServerEnv } from "@/lib/env";

let razorpayClient: Razorpay | undefined;

export function getRazorpayClient() {
  assertServerEnv(["razorpayKeyId", "razorpayKeySecret"]);

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
  }

  return razorpayClient;
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", env.razorpayKeySecret).update(body).digest("hex");
  return expected === signature;
}
