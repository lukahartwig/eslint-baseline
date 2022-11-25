import type { ESLint } from "eslint";

export interface LintViolation {
  filePath: string;
  startLine: number;
  startColumn: number;
  endLine?: number | undefined;
  endColumn?: number | undefined;
  ruleId: string;
  message: string;
  severity: number;
  hash?: string | undefined;
}

export interface Baseline {
  getViolations(): LintViolation[];
  hasFileViolation(violation: LintViolation): boolean;
}

export interface BaselineBuilder {
  (results: ESLint.LintResult[]): Baseline;
}

export interface BaselineSerializer {
  serialize: (baseline: Baseline) => string;
  deserialize: (text: string) => Baseline;
}

export interface BaselineFilter {
  (results: ESLint.LintResult[], baseline: Baseline): ESLint.LintResult[];
}

export interface Engine {
  build: BaselineBuilder;
  filter: BaselineFilter;
  serialize: BaselineSerializer["serialize"];
  deserialize: BaselineSerializer["deserialize"];
}
