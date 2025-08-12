import { createClient } from "@supabase/supabase-js";
import type { Pack, Rule, Target } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

// Anonymous client: RLS policies below allow demo rows (user_id IS NULL).
// When we add auth, we'll pass the user's Bearer token from the client.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getPack(packId: string): Promise<Pack | undefined> {
  const { data, error } = await supabase
    .from("packs")
    .select("id,name")
    .eq("id", packId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return { id: data.id, name: data.name, rules: [] } as Pack; // rules filled via getRulesForPack
}

export async function getTarget(targetId: string): Promise<Target | undefined> {
  const { data, error } = await supabase
    .from("targets")
    .select("id,name,type,method,base_url,headers,body_template,capabilities")
    .eq("id", targetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return {
    id: data.id,
    name: data.name,
    type: (data.type as Target["type"]) || "http",
    method: data.method,
    baseUrl: data.base_url,
    headers: data.headers ?? undefined,
    bodyTemplate: data.body_template ?? undefined,
    capabilities: data.capabilities ?? undefined
  };
}

export async function getRulesForPack(pack: Pack): Promise<Rule[]> {
  const { data: prs, error: e1 } = await supabase
    .from("pack_rules")
    .select("rule_id,freq,threshold")
    .eq("pack_id", pack.id);
  if (e1) throw new Error(e1.message);
  const ruleIds = (prs ?? []).map(r => r.rule_id);
  if (ruleIds.length === 0) return [];
  const { data: rules, error: e2 } = await supabase
    .from("rules")
    .select("id,name,category,scoring,prompt_template,expected,io")
    .in("id", ruleIds);
  if (e2) throw new Error(e2.message);
  return (rules ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    scoring: r.scoring,
    promptTemplate: r.prompt_template,
    expected: r.expected,
    io: r.io
  }));
}