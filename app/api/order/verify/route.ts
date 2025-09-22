import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const key_secret = process.env.RAZORPAY_SECRET_ID;

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing payment details" },
        { status: 400 }
      );
    }

    if (!key_secret) {
      return NextResponse.json(
        { success: false, message: "Missing Razorpay secret" },
        { status: 500 }
      );
    }

    // Generate expected signature
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Payment verified successfully
    return NextResponse.json({ success: true, message: "Payment verified" });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || "Verification error",
      },
      { status: 500 }
    );
  }
}
