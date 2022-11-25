import { createBuilder } from "./build.js";
import { createFilter } from "./filter.js";
import { createSerializer } from "./serialize.js";
import type { Engine } from "./types";

interface CreateEngineOptions {
  cwd: string;
}

export const createEngine = (opts: CreateEngineOptions): Engine => {
  const serializer = createSerializer();
  return {
    build: createBuilder({ cwd: opts.cwd }),
    filter: createFilter({ cwd: opts.cwd }),
    serialize: serializer.serialize,
    deserialize: serializer.deserialize,
  };
};
