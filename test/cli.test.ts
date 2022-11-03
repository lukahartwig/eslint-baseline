import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

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
  expect(baseline).toMatchInlineSnapshot(`"{}"`);
});

test("generate baseline with errors", async () => {
  await writeTestFile(`const a = 'b'\n`);
  const code = await runCLI(["."]);
  const baseline = await readBaseline();
  expect(code).toBe(1);
  expect(baseline).toMatchInlineSnapshot(`
    "{
      "file.js:1:7": [
        {
          "ruleId": "no-unused-vars",
          "message": "'a' is assigned a value but never used.",
          "severity": 2
        }
      ]
    }"
  `);
});

test("pass with baseline", async () => {
  await writeBaseline(`
    {
      "file.js:1:7": [
        {
          "message": "'a' is assigned a value but never used.",
          "ruleId": "no-unused-vars",
          "severity": 2
        }
      ]
    }
  `);
  await writeTestFile(`const a = 'b'\n`);
  const code = await runCLI(["."]);
  expect(code).toBe(0);
});

test("updates baseline", async () => {
  await writeBaseline(`
    {
      "file.js:1:7": [
        {
          "message": "'a' is assigned a value but never used.",
          "ruleId": "no-unused-vars",
          "severity": 2
        }
      ]
    }
  `);
  await writeTestFile("console.log()\n");
  const code = await runCLI(["--update-baseline", "."]);
  expect(code).toBe(0);
  const newBaseline = await readBaseline();
  expect(newBaseline).toMatchInlineSnapshot(`"{}"`);
});
