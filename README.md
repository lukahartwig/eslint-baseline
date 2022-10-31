# eslint-baseline

eslint-baseline is a tool to help adopting ESLint in legacy codebases.

## Getting Started

Install eslint-baseline

```sh
npm install --save-dev eslint-baseline
```

Update your lint scripts

```json
// package.json
{
  "scripts": {
    "lint": "eslint-baseline .",
    "lint:update-baseline": "eslint-baseline --update-baseline ."
  }   
}
```

Run the script to create a baseline

```sh
npm run lint
```

You should see a file `.eslint-baseline.json` that contains all current errors
and warnings from the project. Subsequent runs of `npm run lint` will only show new warnings and errors.

After fixing some errors you can run the update script to update the baseline to the current state.

```sh
npm run lint:update-baseline
```

## Known limitations

* The heuristic to detect already known errors is based on the location of the error. Editing a file with errors might move those errors to a different location and thus will show them as "new" in the output. As a workaround you have to update the baseline.