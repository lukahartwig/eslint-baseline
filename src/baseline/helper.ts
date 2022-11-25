import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { Linter } from "eslint";
import type { LintViolation } from "./types.js";

/**
 * These helper methods are copied from @lint-todo/utils
 * @see https://github.com/lint-todo/utils/blob/59e4b2e475e2a8becb18d10d86a1c86bfd64d732/src/source.ts
 * 
 * I don't want to add a dependency on @lint-todo/utils on it since I'm probably
 * going to change the implementation of these methods in the future.
 * 
 * For now, I'm copying their approach of using the source code as heuristic to
 * determine if two violations are the same.
 */

interface Range {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
}

function buildRange(
  startLine: number,
  startColumn: number,
  endLine?: number,
  endColumn?: number
): Range {
  return {
    start: {
      line: startLine,
      column: startColumn,
    },
    end: {
      line: endLine ?? startLine,
      column: endColumn ?? startColumn,
    },
  };
}

const LINES_PATTERN = /(.*?(?:\r\n?|\n|$))/gm;
const _sourceCache = new Map<string, string>();

function readSource(filePath: string | undefined): string {
  if (!filePath) {
    return "";
  }

  if (existsSync(filePath) && !_sourceCache.has(filePath)) {
    const source = readFileSync(filePath, { encoding: "utf8" });

    _sourceCache.set(filePath, source);
  }

  return _sourceCache.get(filePath) || "";
}

function getSourceForRange(source: string, range: Range): string {
  if (!source) {
    return "";
  }

  const sourceLines = source.match(LINES_PATTERN) || [];
  const firstLine = range.start.line - 1;
  const lastLine = range.end.line - 1;
  let currentLine = firstLine - 1;
  const firstColumn = range.start.column - 1;
  const lastColumn = range.end.column - 1;
  const src = [];
  let line;

  while (currentLine < lastLine) {
    currentLine++;
    line = sourceLines[currentLine];

    if (currentLine === firstLine) {
      if (firstLine === lastLine) {
        // @ts-expect-error -- copied
        src.push(line.slice(firstColumn, lastColumn));
      } else {
        // @ts-expect-error -- copied
        src.push(line.slice(firstColumn));
      }
    } else if (currentLine === lastLine) {
      // @ts-expect-error -- copied
      src.push(line.slice(0, lastColumn));
    } else {
      src.push(line);
    }
  }

  return src.join("");
}

function hashSourceCode(sourceCode: string): string {
  return createHash("sha256").update(sourceCode).digest("hex");
}

export function lintMessageToLintViolation(
  message: Linter.LintMessage,
  opts: {
    filePath: string;
  }
): LintViolation {
  if (message.ruleId === null) {
    throw new Error("Expected message.ruleId to be a string.");
  }

  const range = buildRange(
    message.line,
    message.column,
    message.endLine,
    message.endColumn
  );

  const sourceFile = readSource(opts.filePath);
  const sourceCode = getSourceForRange(sourceFile, range);

  return {
    filePath: opts.filePath,
    startLine: message.line,
    startColumn: message.column,
    endLine: message.endLine,
    endColumn: message.endColumn,
    ruleId: message.ruleId,
    hash: sourceCode ? hashSourceCode(sourceCode) : undefined,
    message: message.message,
    severity: message.severity,
  };
}
