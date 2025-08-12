import Ajv from "ajv";
const ajv = new Ajv({ allErrors: true, strict: true });
export function scoreJsonSchema(expected: any, output: unknown) {
  const schema = expected?.schema;
  if (!schema) return { passed: false, score: 0, details: { error: "No schema provided" } };
  const validate = ajv.compile(schema);
  const ok = validate(output);
  return { passed: !!ok, score: ok ? 1 : 0, details: ok ? undefined : { errors: validate.errors } };
}