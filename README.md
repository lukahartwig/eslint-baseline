# eslint-overlook

Trying to add a linter to a legacy project can be though. eslint-overlook let's you pretend the existing errors and warnings don't exists and you can start from a clean slate.

## Getting Started

Install eslint-overlook

```sh
npm install --save-dev eslint-overlook
```

Update your lint scripts in `package.json`

```json
{
  "scripts": {
    "lint": "eslint-overlook .",
    "lint:update-baseline": "eslint-overlook --update-baseline ."
  }   
}
```

Run the script to create a baseline

```sh
npm run lint
```

You should see a file `.eslint-overlook.json` that contains all current errors
and warnings from the project. Subsequent runs of `npm run lint` will only show new warnings and errors.

After fixing some errors you can run the update script to update the baseline to the current state.

```sh
npm run lint:update-baseline
```

## Known limitations

* The heuristic to detect already known errors is based on the location of the error. Editing a file with errors might move those errors to a different location and thus will show them as "new" in the output. As a workaround you have to update the baseline.