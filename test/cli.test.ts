import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";

let cwd: string;

beforeEach(async () => {
  cwd = await mkdtemp(join(__dirname, "./temp/"));
});

afterEach(async () => {
  await rm(cwd, { recursive: true });
});

async function runCLI(args: string[]): Promise<number | null> {
  const spawned = spawn(join(__dirname, "../bin/cli.js"), args, {
    cwd,
    stdio: "inherit",
  });

  return new Promise((resolve, reject) => {
    spawned.on("exit", (exitCode) => resolve(exitCode));
    spawned.on("error", reject);
  });
}

async function writeTestFile(content: string, name = "file.js") {
  return writeFile(join(cwd, name), content, "utf8");
}

async function writeBaseline(content: string, name = ".eslint-baseline.json") {
  return writeFile(join(cwd, name), content, "utf8");
}

async function readBaseline(name = ".eslint-baseline.json"): Promise<string> {
  return readFile(join(cwd, name), "utf8");
}

test("generate empty baseline", async () => {
  await writeTestFile("console.log()\n");
  const code = await runCLI(["."]);
  const baseline = await readBaseline();
  expect(code).toBe(0);
  expect(baseline).toMatchInlineSnapshot(`
    "{
      \\"files\\": {}
    }"
  `);
});

test("generate baseline with errors", async () => {
  await writeTestFile(`const a = 'b'\n`);
  const code = await runCLI(["."]);
  const baseline = await readBaseline();
  expect(code).toBe(1);
  expect(baseline).toMatchInlineSnapshot(`
    "{
      \\"files\\": {
        \\"file.js:1:7-1:8\\": {
          \\"errors\\": [
            {
              \\"ruleId\\": \\"no-unused-vars\\",
              \\"message\\": \\"'a' is assigned a value but never used.\\",
              \\"severity\\": 2,
              \\"hash\\": \\"ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb\\"
            }
          ]
        }
      }
    }"
  `);
});

test("pass with baseline", async () => {
  await writeBaseline(`
    {
      "files": {
        "file.js:1:7-1:8": {
          "errors": [
            {
              "ruleId": "no-unused-vars",
              "message": "'a' is assigned a value but never used.",
              "severity": 2,
              "hash": "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb"
            }
          ]
        }
      }
    }
  `);
  await writeTestFile(`const a = 'b'\n`);
  const code = await runCLI(["."]);
  expect(code).toBe(0);
});

test("updates baseline", async () => {
  await writeBaseline(`
    {
      "files": {
        "file.js:1:7": {
          "errors": [
            {
              "message": "'a' is assigned a value but never used.",
              "ruleId": "no-unused-vars",
              "severity": 2
            }
          ]
        }
      }
    }
  `);
  await writeTestFile("console.log()\n");
  const code = await runCLI(["--update-baseline", "."]);
  expect(code).toBe(0);
  const newBaseline = await readBaseline();
  expect(newBaseline).toMatchInlineSnapshot(`
    "{
      \\"files\\": {}
    }"
  `);
});
