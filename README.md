# Filemonger

A filemonger is a function which represents a transformation that may be applied
to a stream of files. Calling a filemonger function gets you a filemonger
instance, which you may compose with other instances.

## Installation

To get the basics:

```sh
yarn add -D @filemonger/main
```

But you probably also want some helper functions if you're creating a
filemonger:

```sh
yarn add -D @filemonger/helpers
```

## Introduction by example

### Using filemongers

```ts
import {
  typescriptmonger,
  filtermonger,
  babelmonger,
  closurecompilermonger
} from "some-cool-package";
import { compilerOptions } from "./tsconfig";

const matchesDts = f => !!f.match(/d\.ts$/);
const matchesJs = f => !!f.match(/\.js$/);
const opts = { compilerOptions };

const compoundmonger = typescriptmonger("**/*.ts", opts).multicast(
  file$ => filtermonger(file$.filter(matchesDts)),
  file$ =>
    babelmonger(file$.filter(matchesJs)).bind(file$ =>
      closurecompilermonger(file$)
    )
);

compoundmonger.process("./src", "./dist", files => {
  console.log("Output files:");
  files.forEach(console.log);
});
```

### Creating a filemonger

```ts
import makeFilemonger from "@filemonger/main";
import { f, helpers: { copyFile } } from "@filemonger/helpers";

export const filtermonger = makeFilemonger((file$, srcDir, destDir, opts) =>
  file$.flatMap(file =>
      copyFile(
        f.fullPath(f.abs(join(srcDir, file))),
        f.fullPath(f.abs(join(destDir, file)))
      )
      .map(file => f.fullPath(f.rel(relative(destDir, file))))
  )
);
```
