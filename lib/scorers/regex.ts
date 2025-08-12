export function scoreRegex(expected: any, output: unknown) {
  const text = typeof output === 'string' ? output : JSON.stringify(output);
  const must = Array.isArray(expected?.mustMatch) ? expected.mustMatch : [];
  const mustNot = Array.isArray(expected?.mustNotMatch) ? expected.mustNotMatch : [];
  let ok = true;
  const misses: string[] = [];
  const violations: string[] = [];
  for (const p of must) { const re = new RegExp(p, 'm'); if (!re.test(text)) { ok = false; misses.push(p); } }
  for (const p of mustNot) { const re = new RegExp(p, 'm'); if (re.test(text)) { ok = false; violations.push(p); } }
  return { passed: ok, score: ok ? 1 : 0, details: { misses, violations } };
}