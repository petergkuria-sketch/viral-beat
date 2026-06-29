import { getDb } from "../../../db";
import { aiUsageLog } from "../../../../drizzle/schema";

export interface UsageEvent {
  provider: string;
  model?: string | null;
  taskType?: string | null;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  status: "success" | "failure";
  errorMessage?: string | null;
  userId?: string | null;
}

/**
 * Records one AI telemetry row. Best-effort and non-blocking: any failure is
 * swallowed so observability can never break or slow an AI request. Call
 * without awaiting (fire-and-forget).
 */
export async function recordUsage(event: UsageEvent): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(aiUsageLog).values({
      provider: event.provider,
      model: event.model ?? null,
      taskType: event.taskType ?? null,
      tokensIn: event.tokensIn,
      tokensOut: event.tokensOut,
      costUsd: event.costUsd.toFixed(6),
      latencyMs: event.latencyMs,
      status: event.status,
      errorMessage: event.errorMessage ? event.errorMessage.slice(0, 500) : null,
      userId: event.userId ?? null,
    });
  } catch (err) {
    console.warn("[ai-telemetry] failed to record usage:", (err as any)?.message ?? err);
  }
}
