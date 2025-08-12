export type Rule = {
  id: string;
  name: string;
  category: string;
  scoring: "json_schema" | "regex" | "exact" | string;
  promptTemplate: string;
  expected: any;
  io: { expects: "json" | "text"; field?: string };
};

export type Pack = {
  id: string;
  name: string;
  rules: Array<{ id: string; freq: "hourly" | "daily" | "weekly"; threshold: number }>;
};

export type Target = {
  id: string;
  name: string;
  type: "http"; // MVP
  method: string;
  baseUrl: string;
  headers?: Record<string, string>;
  bodyTemplate?: any; // object with templated strings
  capabilities?: Record<string, any>;
};

export type RunResult = {
  ruleId: string;
  status: "pass" | "fail" | "error";
  score: number;
  details?: any;
};

export type ExecuteRunInput = {
  packId: string;
  targetId: string;
  variables: Record<string, string>;
};

export type ExecuteRunOutput = {
  runId: string;
  packId: string;
  targetId: string;
  startedAt: string;
  finishedAt: string;
  passCount: number;
  results: RunResult[];
};

export type ExecuteSingleRuleInput = { ruleId: string; targetId: string; variables: Record<string,string> };
export type ExecuteSingleRuleOutput = { ruleId: string; status: "pass"|"fail"|"error"; score: number; details?: any };
