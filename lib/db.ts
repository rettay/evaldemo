// Stage 1 scaffold: in-memory seed data so the API works immediately.
// Stage 2 will replace these with Postgres queries.
import type { Pack, Rule, Target } from "./types";

const SEED_RULES: Rule[] = [
  {
    id: "U2",
    name: "JSON Schema Compliance",
    category: "Usability",
    scoring: "json_schema",
    promptTemplate: "Return JSON for a contact: {name, email, tags[]}—no extra fields.",
    expected: {
      schema: {
        type: "object",
        required: ["name", "email", "tags"],
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    },
    io: { expects: "json", field: "$" }
  }
];

const SEED_PACKS: Pack[] = [
  {
    id: "pack_baseline",
    name: "Baseline Functional",
    rules: [
      { id: "U2", freq: "daily", threshold: 1 }
    ]
  }
];

const SEED_TARGETS: Target[] = [
  {
    id: "tgt_echo",
    name: "Echo Endpoint (demo)",
    type: "http",
    method: "POST",
    baseUrl: "https://httpbin.org/anything", // replace with your endpoint later
    headers: { "Content-Type": "application/json" },
    bodyTemplate: { prompt: "{{prompt}}" },
    capabilities: { returns_json: true }
  }
];

export async function getPack(packId: string): Promise<Pack | undefined> {
  return SEED_PACKS.find(p => p.id === packId);
}

export async function getTarget(targetId: string): Promise<Target | undefined> {
  return SEED_TARGETS.find(t => t.id === targetId);
}

export async function getRulesForPack(pack: Pack): Promise<Rule[]> {
  const byId = new Map(SEED_RULES.map(r => [r.id, r] as const));
  return pack.rules.map(r => byId.get(r.id)!).filter(Boolean);
}