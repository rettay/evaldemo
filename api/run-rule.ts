import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { executeSingleRule } from "../lib/executor";

const BodySchema = z.object({
  ruleId: z.string().min(1),
  targetId: z.string().min(1),
  variables: z.record(z.string()).optional()
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const raw = (req as any).body ?? {};
    const body = typeof raw === "string" ? JSON.parse(raw) : raw;
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });

    const token = (req.headers["authorization"] as string | undefined)?.replace(/^Bearer\s+/i, "");
    const { ruleId, targetId, variables = {} } = parsed.data;

    const result = await executeSingleRule({ ruleId, targetId, variables }, token);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("/api/run-rule error", err);
    return res.status(500).json({ error: "Internal Server Error", message: String(err?.message || err) });
  }
}