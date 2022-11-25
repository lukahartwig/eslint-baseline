import { z } from "zod";
import { HashBaseline } from "./baseline.js";
import type { Baseline, BaselineSerializer, LintViolation } from "./types.js";

const schema = z.object({
  files: z.record(
    z.object({
      errors: z.array(
        z.object({
          ruleId: z.string(),
          message: z.string(),
          severity: z.number(),
          hash: z.string().optional(),
        })
      ),
    })
  ),
});

type BaselineFile = z.infer<typeof schema>;

export function createSerializer(): BaselineSerializer {
  const buildKey = (violation: LintViolation): string => {
    let key = `${violation.filePath}:${violation.startLine}:${violation.startColumn}`;

    if (violation.endLine !== undefined && violation.endColumn !== undefined) {
      key += `-${violation.endLine}:${violation.endColumn}`;
    }

    return key;
  };

  const readKey = (key: string) => {
    const [filePath, startLine, startColumn, endLine, endColumn] =
      key.split(":");

    if (!filePath || !startLine || !startColumn) {
      throw new Error(`Invalid key: ${key}`);
    }

    return {
      filePath,
      startLine: Number(startLine),
      startColumn: Number(startColumn),
      endLine: endLine ? Number(endLine.slice(1)) : undefined,
      endColumn: endColumn ? Number(endColumn) : undefined,
    };
  };

  const serialize = (baseline: Baseline) => {
    const output: BaselineFile = {
      files: {},
    };

    for (const violation of baseline.getViolations()) {
      const key = buildKey(violation);

      const file = (output.files[key] ??= {
        errors: [],
      });

      file.errors.push({
        ruleId: violation.ruleId,
        message: violation.message,
        severity: violation.severity,
        hash: violation.hash,
      });
    }

    return JSON.stringify(output, null, 2);
  };

  const deserialize = (text: string) => {
    const input = schema.parse(JSON.parse(text));

    const baseline = new HashBaseline();

    for (const [key, file] of Object.entries(input.files)) {
      const { filePath, startLine, startColumn, endLine, endColumn } =
        readKey(key);

      for (const error of file.errors) {
        baseline.addViolation({
          ...error,
          filePath,
          startLine,
          startColumn,
          endLine,
          endColumn,
        });
      }
    }

    return baseline;
  };

  return {
    serialize,
    deserialize,
  };
}
