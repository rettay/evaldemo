import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Pack, Rule, Target } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

export function getDb(token?: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  });
}

export async function getPack(db: SupabaseClient, packId: string): Promise<Pack | undefined> {
  const { data, error } = await db.from("packs").select("id,name").eq("id", packId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return { id: data.id, name: data.name, rules: [] } as Pack;
}

export async function getTarget(db: SupabaseClient, targetId: string): Promise<Target | undefined> {
  const { data, error } = await db
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

export async function getRulesForPack(db: SupabaseClient, pack: Pack): Promise<Rule[]> {
  const { data: links, error: e1 } = await db
    .from("pack_rules")
    .select("rule_id,freq,threshold")
    .eq("pack_id", pack.id);
  if (e1) throw new Error(e1.message);
  const ruleIds = (links ?? []).map(r => r.rule_id);
  if (ruleIds.length === 0) return [];
  const { data: rules, error: e2 } = await db
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

export async function getRule(db: SupabaseClient, ruleId: string): Promise<Rule | undefined> {
  const { data, error } = await db
    .from("rules")
    .select("id,name,category,scoring,prompt_template,expected,io")
    .eq("id", ruleId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return {
    id: data.id,
    name: data.name,
    category: data.category,
    scoring: data.scoring,
    promptTemplate: data.prompt_template,
    expected: data.expected,
    io: data.io
  };
}