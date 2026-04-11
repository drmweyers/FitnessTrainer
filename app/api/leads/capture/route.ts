import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, source = "trainer.evofit.io", productTag = "evofit-trainer-interest" } = body;

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "A valid email address is required." }, { status: 400 });
    }

    const apiUrl = process.env.SMARTSOCIAL_API_URL;
    const apiKey = process.env.SMARTSOCIAL_API_KEY;

    if (!apiUrl || !apiKey) {
      console.warn("[leads/capture] SMARTSOCIAL env vars not set. Lead not forwarded:", { email, firstName, source, productTag });
      return NextResponse.json({ success: true });
    }

    const response = await fetch(`${apiUrl}/api/v1/email-crm/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({ email, firstName, source, productTag }),
    });

    if (!response.ok) {
      console.error("[leads/capture] SmartSocial error:", response.status, await response.text());
      return NextResponse.json({ success: false, error: "Failed to subscribe. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[leads/capture] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred." }, { status: 500 });
  }
}
