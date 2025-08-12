import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { executeRun } from "../lib/executor";

const BodySchema = z.object({
  packId: z.string().min(1),
  targetId: z.string().min(1),
  variables: z.record(z.string()).optional()
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const parsed = BodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    }

    const { packId, targetId, variables = {} } = parsed.data;

    // Execute the run (currently scaffolded with mock data)
    const result = await executeRun({ packId, targetId, variables });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("/api/run-pack error", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}