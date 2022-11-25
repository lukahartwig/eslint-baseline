import { command, flag, option, restPositionals, run, string } from "cmd-ts";
import { ESLint } from "eslint";
import { Processor } from "./processor.js";

const app = command({
  name: "eslint-baseline",
  description: "Run ESLint with a baseline",
  args: {
    baseline: option({
      long: "baseline-file",
      description: "Path to the baseline file",
      defaultValue: () => ".eslint-baseline.json",
      type: string,
    }),
    update: flag({
      long: "update-baseline",
      short: "u",
      description: "Update the baseline file",
      defaultValue: () => false,
    }),
    cwd: option({
      long: "cwd",
      defaultValue: () => process.cwd(),
      description:
        "The current working directory. Files in the baseline are resolved relative to this.",
      type: string,
    }),
    files: restPositionals({
      description: "Files to lint. This is passed to ESLint.",
      type: string,
    }),
  },
  handler: async (args) => {
    const eslint = new ESLint({
      cwd: args.cwd,
    });

    const processor = new Processor({
      cwd: args.cwd,
      baselineFile: args.baseline,
      updateBaseline: args.update,
    });

    const results = await eslint.lintFiles(args.files);
    const processedResults = processor.process(results);
    const rulesMeta = eslint.getRulesMetaForResults(processedResults);
    const formatter = await eslint.loadFormatter();
    const formatted = await formatter.format(processedResults, {
      cwd: args.cwd,
      rulesMeta,
    });

    process.stdout.write(formatted);
    process.exitCode = processedResults.some((r) => r.errorCount > 0) ? 1 : 0;
  },
});

await run(app, process.argv.slice(2));
