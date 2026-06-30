import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { sendEmail, appBaseUrl } from "../services/email";

/** Admin email diagnostics — confirm the provider is configured and send a test. */
export const emailRouter = router({
  /** Config status without sending anything. */
  status: adminProcedure.query(async () => {
    return {
      configured: !!process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "ViralBeat <no-reply@viralbeat.io>",
      appBaseUrl: appBaseUrl(),
    };
  }),

  /** Send a test email (defaults to the admin's own address). */
  sendTest: adminProcedure
    .input(z.object({ to: z.string().email().optional() }))
    .mutation(async ({ ctx, input }) => {
      const to = input.to || (ctx.user as any).email;
      if (!to) {
        return { sent: false, to: null, error: "No recipient — your account has no email; pass one explicitly." };
      }
      const res = await sendEmail({
        to,
        subject: "ViralBeat email test",
        html: `<p>This is a test email from ViralBeat.</p><p>If you received this, transactional email is configured and sending correctly.</p><p>— ViralBeat</p>`,
        text: "This is a test email from ViralBeat. If you received this, transactional email is configured and sending correctly.",
      });
      return { ...res, to };
    }),
});
