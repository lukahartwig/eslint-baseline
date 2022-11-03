import fs from "node:fs";
import path from "node:path";
import { command, flag, option, restPositionals, run, string } from "cmd-ts";
import { ESLint, Linter } from "eslint";
import { z } from "zod";

const baselineSchema = z.record(
  z.array(
    z.object({
      ruleId: z.string(),
      message: z.string(),
      severity: z.number(),
    })
  )
);

type Baseline = z.infer<typeof baselineSchema>;

function lintMessageToKey(
  cwd: string,
  filePath: string,
  message: Linter.LintMessage
): string {
  const relative = path.relative(cwd, filePath);
  return `${relative}:${message.line}:${message.column}`;
}

function generateBaselineFromResults(
  results: ESLint.LintResult[],
  opts: { cwd: string }
): Baseline {
  const baseline: Baseline = {};

  for (const result of results) {
    for (const message of result.messages) {
      if (message.ruleId && message.severity === 2) {
        const key = lintMessageToKey(opts.cwd, result.filePath, message);

        (baseline[key] ??= []).push({
          ruleId: message.ruleId,
          message: message.message,
          severity: message.severity,
        });
      }
    }
  }

  return baseline;
}

function processResults(
  results: ESLint.LintResult[],
  opts: { cwd: string; baselineFile: string; updateBaseline: boolean }
): ESLint.LintResult[] {
  const newBaseline = generateBaselineFromResults(results, opts);

  if (!fs.existsSync(opts.baselineFile)) {
    fs.writeFileSync(opts.baselineFile, JSON.stringify(newBaseline, null, 2));
    return results;
  } else {
    const rawBaseline = fs.readFileSync(opts.baselineFile, "utf-8");
    const oldBaseline = baselineSchema.parse(JSON.parse(rawBaseline));

    const newResults = results.map((result) => {
      let errorCount = 0;
      let fatalErrorCount = 0;
      let fixableErrorCount = 0;
      const filteredMessages: Linter.LintMessage[] = [];

      for (const message of result.messages) {
        if (message.ruleId) {
          const key = lintMessageToKey(opts.cwd, result.filePath, message);

          if (message.severity === 2) {
            // Check if we already have messages at this location
            const oldMessages = oldBaseline[key];

            if (oldMessages) {
              // Check if the message is already known
              const oldMessage = oldMessages.find(
                (m) =>
                  m.ruleId === message.ruleId && m.message === message.message
              );

              if (oldMessage) {
                continue;
              }
            }

            errorCount++;

            if (message.fatal) {
              fatalErrorCount++;
            }

            if (message.fix) {
              fixableErrorCount++;
            }
          }

          filteredMessages.push(message);
        }
      }

      return {
        ...result,
        errorCount,
        fatalErrorCount,
        fixableErrorCount,
        messages: filteredMessages,
      };
    });

    if (opts.updateBaseline) {
      fs.writeFileSync(opts.baselineFile, JSON.stringify(newBaseline, null, 2));
    }

    return newResults;
  }
}

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

    const results = await eslint.lintFiles(args.files);
    const processedResults = processResults(results, {
      cwd: args.cwd,
      baselineFile: args.baseline,
      updateBaseline: args.update,
    });

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
