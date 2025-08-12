import Mustache from "mustache";
import { getPack, getRulesForPack, getTarget, getRule } from "./db";
import type { ExecuteRunInput, ExecuteRunOutput, RunResult, Rule, Target, ExecuteSingleRuleInput, ExecuteSingleRuleOutput } from "./types";
import { scoreJsonSchema } from "./scorers/jsonSchema";
import { scoreRegex } from "./scorers/regex";

function renderTemplateDeep(obj: any, ctx: Record<string, string>) {
  if (obj == null) return obj;
  if (typeof obj === "string") return Mustache.render(obj, ctx);
  if (Array.isArray(obj)) return obj.map(x => renderTemplateDeep(x, ctx));
  if (typeof obj === "object") { const out: any = {}; for (const [k, v] of Object.entries(obj)) out[k] = renderTemplateDeep(v, ctx); return out; }
  return obj;
}

async function callHttpTarget(target: Target, prompt: string, ctx: Record<string,string>) {
  const body = renderTemplateDeep(target.bodyTemplate ?? { prompt: "{{prompt}}" }, { ...ctx, prompt });
  const headers = renderTemplateDeep(target.headers ?? { "Content-Type": "application/json" }, ctx);
  const resp = await fetch(target.baseUrl, { method: target.method || "POST", headers: headers as any, body: JSON.stringify(body) });
  const contentType = resp.headers.get("content-type") || "";
  const output = contentType.includes("application/json") ? await resp.json() : await resp.text();
  return { output };
}

function extractField(io: Rule["io"], output: any) {
  if (io.expects === "json") return output; // TODO: JSONPath support
  return typeof output === "string" ? output : JSON.stringify(output);
}

function score(rule: Rule, actual: any): RunResult {
  switch (rule.scoring) {
    case "json_schema": { const r = scoreJsonSchema(rule.expected, actual); return { ruleId: rule.id, status: r.passed ? "pass" : "fail", score: r.score, details: r.details }; }
    case "regex": { const r = scoreRegex(rule.expected, actual); return { ruleId: rule.id, status: r.passed ? "pass" : "fail", score: r.score, details: r.details }; }
    case "exact": { const want = String(rule.expected?.exact ?? ""); const got = String(actual ?? ""); const ok = want === got; return { ruleId: rule.id, status: ok ? "pass" : "fail", score: ok ? 1 : 0, details: ok ? undefined : { want, got } }; }
    default: { return { ruleId: rule.id, status: "error", score: 0, details: { error: `Unknown scorer: ${rule.scoring}` } }; }
  }
}

export async function executeRun(input: ExecuteRunInput): Promise<ExecuteRunOutput> {
  const { packId, targetId, variables } = input;
  const pack = await getPack(packId);
  const target = await getTarget(targetId);
  if (!pack) throw new Error(`Pack not found: ${packId}`);
  if (!target) throw new Error(`Target not found: ${targetId}`);

  const rules = await getRulesForPack(pack);
  const runId = `run_${Date.now()}`;
  const startedAt = new Date().toISOString();

  const results: RunResult[] = [];
  for (const rule of rules) {
    try { const { output } = await callHttpTarget(target, rule.promptTemplate, variables); const actual = extractField(rule.io, output); const scored = score(rule, actual); results.push(scored); }
    catch (err: any) { results.push({ ruleId: rule.id, status: "error", score: 0, details: { error: String(err?.message || err) } }); }
  }

  const passCount = results.filter(r => r.status === "pass").length;
  const finishedAt = new Date().toISOString();
  return { runId, packId, targetId, startedAt, finishedAt, passCount, results };
}

export async function executeSingleRule(input: ExecuteSingleRuleInput): Promise<ExecuteSingleRuleOutput> {
  const { ruleId, targetId, variables } = input;
  const rule = await getRule(ruleId);
  const target = await getTarget(targetId);
  if (!rule) throw new Error(`Rule not found: ${ruleId}`);
  if (!target) throw new Error(`Target not found: ${targetId}`);
  const { output } = await callHttpTarget(target, rule.promptTemplate, variables);
  const actual = extractField(rule.io, output);
  const result = score(rule, actual);
  return { ruleId: result.ruleId, status: result.status, score: result.score, details: result.details } as ExecuteSingleRuleOutput;
}
