import path from "node:path";
import type { ESLint } from "eslint";
import { lintMessageToLintViolation } from "./helper.js";
import type { BaselineFilter } from "./types.js";

interface CreateFilterOptions {
  cwd: string;
}

export function createFilter(opts: CreateFilterOptions): BaselineFilter {
  return (results, baseline) => {
    const newResults: ESLint.LintResult[] = [];

    for (const result of results) {
      const filePath = path.relative(opts.cwd, result.filePath);

      const newResult: ESLint.LintResult = {
        ...result,
        messages: [],
        errorCount: 0,
        fatalErrorCount: 0,
        warningCount: 0,
        fixableErrorCount: 0,
        fixableWarningCount: 0,
      };

      for (const message of result.messages) {
        if (message.ruleId !== null) {
          const violation = lintMessageToLintViolation(message, {
            filePath,
          });

          if (baseline.hasFileViolation(violation)) {
            continue;
          }
        }

        if (message.severity === 2) {
          newResult.errorCount += 1;
        } else if (message.severity === 1) {
          newResult.warningCount += 1;
        }

        if (message.fix) {
          if (message.severity === 2) {
            newResult.fixableErrorCount += 1;
          } else if (message.severity === 1) {
            newResult.fixableWarningCount += 1;
          }
        }

        if (message.fatal) {
          newResult.fatalErrorCount += 1;
        }

        newResult.messages.push(message);
      }

      newResults.push(newResult);
    }

    return newResults;
  };
}
