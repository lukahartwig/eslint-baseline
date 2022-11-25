import type { ESLint } from "eslint";
import type { BaselineBuilder } from "./types.js";
import { HashBaseline } from "./baseline.js";

interface CreateBuilderOptions {
  cwd: string;
}

export function createBuilder(opts: CreateBuilderOptions): BaselineBuilder {
  return (results: ESLint.LintResult[]) =>
    HashBaseline.fromResults(results, {
      cwd: opts.cwd,
    });
}
