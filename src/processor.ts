import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { ESLint } from "eslint";
import { createEngine } from "./baseline/engine.js";
import type { Engine } from "./baseline/types.js";

interface ProcessorOptions {
  cwd: string;
  baselineFile: string;
  updateBaseline: boolean;
}

export class Processor {
  private engine: Engine;

  private baselineFile: string;
  private updateBaseline: boolean;

  constructor(opts: ProcessorOptions) {
    this.baselineFile = opts.baselineFile;
    this.updateBaseline = opts.updateBaseline;

    this.engine = createEngine({
      cwd: opts.cwd,
    });
  }

  process(results: ESLint.LintResult[]): ESLint.LintResult[] {
    if (existsSync(this.baselineFile)) {
      return this.handleBaselineExists(results);
    } else {
      return this.handleBaselineDoesNotExist(results);
    }
  }

  private handleBaselineExists(
    results: ESLint.LintResult[]
  ): ESLint.LintResult[] {
    let baseline = this.engine.deserialize(
      readFileSync(this.baselineFile, "utf8")
    );

    if (this.updateBaseline) {
      baseline = this.engine.build(results);
      writeFileSync(this.baselineFile, this.engine.serialize(baseline));
    }

    return this.engine.filter(results, baseline);
  }

  private handleBaselineDoesNotExist(
    results: ESLint.LintResult[]
  ): ESLint.LintResult[] {
    const baseline = this.engine.build(results);
    writeFileSync(this.baselineFile, this.engine.serialize(baseline));
    return results;
  }
}
