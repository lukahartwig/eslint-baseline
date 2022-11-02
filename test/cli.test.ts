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
  const spawned = spawn(join(__dirname, "../bin/eslint-overlook.js"), args, {
    cwd,
  });

  return new Promise((resolve, reject) => {
    spawned.on("exit", (exitCode) => resolve(exitCode));
    spawned.on("error", reject);
  });
}

async function readBaseline(name = ".eslint-overlook.json"): Promise<string> {
  return readFile(join(cwd, name), "utf8");
}

test("generate empty baseline", async () => {
  const filepath = join(cwd, "file.js");
  await writeFile(filepath, "console.log()\n");
  const code = await runCLI(["."]);
  const baseline = await readBaseline();
  expect(code).toBe(0);
  expect(baseline).toMatchInlineSnapshot(`"{}"`);
});

test("generate baseline with errors", async () => {
  const filepath = join(cwd, "file.js");
  await writeFile(filepath, `const a = 'b'\n`);
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
  const baseline = join(cwd, ".eslint-overlook.json");
  await writeFile(
    baseline,
    `
    {
      "file.js:1:7": [
        {
          "message": "'a' is assigned a value but never used.",
          "ruleId": "no-unused-vars",
          "severity": 2
        }
      ]
    }
  `
  );
  const filepath = join(cwd, "file.js");
  await writeFile(filepath, `const a = 'b'\n`);
  const code = await runCLI(["."]);
  expect(code).toBe(0);
});

test("updates baseline", async () => {
  const baseline = join(cwd, ".eslint-overlook.json");
  await writeFile(
    baseline,
    `
    {
      "file.js:1:7": [
        {
          "message": "'a' is assigned a value but never used.",
          "ruleId": "no-unused-vars",
          "severity": 2
        }
      ]
    }
  `
  );
  const filepath = join(cwd, "file.js");
  await writeFile(filepath, "console.log()\n");
  const code = await runCLI(["--update-baseline", "."]);
  expect(code).toBe(0);
  const newBaseline = await readBaseline();
  expect(newBaseline).toMatchInlineSnapshot(`"{}"`);
});
