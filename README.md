# eslint-baseline

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/lukahartwig/eslint-baseline/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/eslint-baseline.svg?style=flat)](https://www.npmjs.com/package/eslint-baseline)

Trying to add a linter to a legacy project can be tough. eslint-baseline lets you ignore all existing errors by creating a baseline.

## Project Status

This project is still in early development. It is usable but non of the APIs are stable yet.

## Getting Started

Install eslint-baseline

```sh
npm install --save-dev eslint eslint-baseline
```

If you already have ESlint setup update the lint scripts in `package.json`

```diff
{
  "scripts": {
-   "lint": "eslint ."
+   "lint": "eslint-baseline .",
+   "lint:update-baseline": "eslint-baseline --update-baseline ."
  }
}
```

Run the script to create a baseline

```sh
npm run lint
```

There should be a file `.eslint-baseline.json` that contains all current lint errors. Subsequent runs of `npm run lint` will only show new errors.

To update the baseline run

```sh
npm run lint:update-baseline
```

## Known limitations

- The heuristic to detect already known errors is based on the location of the error. Editing a file with errors might move those errors to a different location and thus will show them as "new" in the output. As a workaround, you have to update the baseline.

## Alternatives

A list of similar projects

- [@lint-todo/eslint-formatter-todo](https://www.npmjs.com/package/@lint-todo/eslint-formatter-todo)
- [@luminateone/eslint-baseline](https://www.npmjs.com/package/@luminateone/eslint-baseline)
