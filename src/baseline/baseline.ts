import path from "node:path";
import type { ESLint } from "eslint";
import type { Baseline, LintViolation } from "./types.js";
import { lintMessageToLintViolation } from "./helper.js";

export class HashBaseline implements Baseline {
  private violations: Map<string, LintViolation[]> = new Map();

  static fromResults(
    results: ESLint.LintResult[],
    opts: { cwd: string }
  ): Baseline {
    const baseline = new HashBaseline();

    for (const result of results) {
      const filePath = path.relative(opts.cwd, result.filePath);

      for (const message of result.messages) {
        if (message.ruleId === null || message.severity < 2) {
          continue;
        }

        const violation = lintMessageToLintViolation(message, {
          filePath,
        });

        baseline.addViolation(violation);
      }
    }

    return baseline;
  }

  public addViolation(violation: LintViolation): void {
    const violationsForFile = this.violations.get(violation.filePath) ?? [];
    violationsForFile.push(violation);
    this.violations.set(violation.filePath, violationsForFile);
  }

  public getViolations(): LintViolation[] {
    return Array.from(this.violations.values()).flat();
  }

  public hasFileViolation(violation: LintViolation): boolean {
    const violationsForFile = this.violations.get(violation.filePath) ?? [];
    return violationsForFile.some((v) => this.violationsMatch(v, violation));
  }

  private violationsMatch(v1: LintViolation, v2: LintViolation): boolean {
    return (
      this.violationsMatchByHash(v1, v2) ||
      this.violationsMatchByLocationAndMessage(v1, v2)
    );
  }

  private violationsMatchByHash(v1: LintViolation, v2: LintViolation): boolean {
    return v1.hash !== "" && v2.hash !== "" && v1.hash === v2.hash;
  }

  private violationsMatchByLocationAndMessage(
    v1: LintViolation,
    v2: LintViolation
  ): boolean {
    return (
      v1.filePath === v2.filePath &&
      v1.startLine === v2.startLine &&
      v1.startColumn === v2.startColumn &&
      v1.endLine === v2.endLine &&
      v1.endColumn === v2.endColumn &&
      v1.message === v2.message
    );
  }
}
