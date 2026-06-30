// Best-effort transactional email.
//
// Sends via Resend when RESEND_API_KEY is configured; otherwise logs and
// returns { sent: false } so callers can fall back to a shareable link.
// No hard dependency — keeps the build working without an email provider.

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "ViralBeat <no-reply@viralbeat.io>";
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${to} ("${subject}")`);
    return { sent: false, error: "email provider not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text: text ?? undefined }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Resend failed (${res.status}): ${body}`);
      return { sent: false, error: `provider ${res.status}` };
    }
    return { sent: true };
  } catch (e: any) {
    console.error("[email] send error:", e?.message);
    return { sent: false, error: e?.message ?? "send error" };
  }
}

export function appBaseUrl(): string {
  return process.env.APP_URL || process.env.APP_BASE_URL || "https://viralbeat.io";
}
