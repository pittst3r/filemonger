# Filemonger

* [Introduction](#introduction)
* [Installation](#installation)
* [API](#api)
* [CLI](#cli)

## Introduction

Filemonger seeks to make it easy to create a file processing pipeline by
providing interfaces for composing single-purpose filemongers into compound
filemongers. A filemonger is a function which represents a transformation that
may be applied to a stream of files. Effectual code is encapsulated in
filemongers, hidden away from functional pipeline code.

One composes a pipeline of filemonger instances into a compound filemonger
instance, which may be further composed into another compound instance.
Filemonger instances are executed lazily, so once you've composed your pipeline
you can kick it off with a source directory and a destination directory, or
export it for later usage, or wrap your instance in a new filemonger and share
it with others.

### Using filemongers

```ts
import {
  typescriptmonger,
  passthrumonger,
  babelmonger,
  closurecompilermonger
} from "some-cool-package";
import { compilerOptions } from "./tsconfig";

const matchesDts = f => !!f.match(/d\.ts$/);
const matchesJs = f => !!f.match(/\.js$/);
const opts = { compilerOptions };

const compoundmonger = typescriptmonger("**/*.ts", opts).multicast(
  file$ => passthrumonger(file$.filter(matchesDts)),
  file$ => babelmonger(file$.filter(matchesJs)).bind(closurecompilermonger)
);

compoundmonger.run("./src", "./dist", (err, files) => {
  console.log("Output files:");
  files.forEach(console.log);
});
```

### Creating a filemonger

```ts
import makeFilemonger from "@filemonger/main";
import { f, copyFile } from "@filemonger/helpers";

export const passthrumonger = makeFilemonger((file$, srcDir, destDir, opts) =>
  file$.flatMap(file =>
    copyFile(
      f.fullPath(f.abs(join(srcDir, file))),
      f.fullPath(f.abs(join(destDir, file)))
    ).map(file => f.fullPath(f.rel(relative(destDir, file))))
  )
);
```

## Installation

To get the basics:

```sh
yarn add [-D] @filemonger/main
```

But you probably also want some helper functions if you're creating a
filemonger:

```sh
yarn add [-D] @filemonger/helpers
```

## API

### Making a filemonger

Read files from `srcDir`, transform them, and place the new files in the
`destDir`, returning a stream of the new file paths which may or may not have
changed. `file$` is an Rxjs stream of file paths relative to the `srcDir`.
`opts` is the option object passed in through the filemonger invocation as the
second argument. If no options were passed then `opts` will be an empty object.

```ts
const mrcoolicemonger = makeFilemonger((file$, srcDir, destDir, opts) => {
  // Do stuff
});
```

### Invoking a filemonger

Invoking a filemonger (i.e. instantiating it) gives us an interface which
we can use to compose this instance with other filemonger instances. The
instantiation of a filemonger captures a particular stream of files, and maybe
some options. Specifying a source directory and destination directory happens
later.

```ts
mrcoolicemonger("img/**/*.jpg");
```

### Composing filemongers

```ts
icyhotstunnazmonger("img/**/*.jpg")
  .merge(mrcoolicemonger("img/**/*.jpg"))
  .bind(imgcompressmonger);
```

#### `#bind()`

Binds one filemonger to another, essentially linking them together.

```ts
firstmonger().bind(file$ => secondmonger(file$));
// or simply
firstmonger().bind(secondmonger);
```

All the output files from `firstmonger` get piped into `secondmonger` when the
pipeline is run. After `bind`ing we are left with a new filemonger instance that
can be further composed.

#### `#merge()`

Merges one filemonger instance with another. Useful for funneling multiple
sources into the same pipeline.

```ts
firstmonger().merge(secondmonger());
```

Unlike with `#bind()`, `#merge()` requires a filemonger instance be provided
rather than a filemonger instance factory. This is because we are merging two
different streams which are responsible for their own source.

#### `#multicast()`

Sends the same file stream to multiple other filemongers. You can use this to
split processing into multiple branches. `#multicast()` will merge these
branches back into a single pipeline for you.

```ts
firstmonger().multicast(secondmonger, thirdmonger);
```

#### `#bypass()`

Sends the file stream through a predicate; if true the file passes into
the given filemonger, if false bypasses the filemonger and merges in with the
files that exited the filemonger. Syntactic sugar and a fancy multicast.

```ts
const isGif = f => f.match(/\.gif$/);

imagemonger()
  .bypass(isGif, gifreezemonger)
  .bind(thumbnailmonger);
```

### Running filemongers

There are two ways to run a filemonger pipeline, the `#run()` and `#unit()`
methods. `#run()` does not expose the file stream and allows for a callback to
be provided which is called upon completion. This is the recommended API for
general filemonger usage. `#unit()` is a lower-level API to be used in the
creation of filemongers and returns an unsubscribed Rxjs stream of files.

#### `#run()`

```ts
firstmonger()
  .multicast(secondmonger, thirdmonger)
  .run("./src", "./dist", (err, files) => {
    console.log("Donezo");
    console.log("Output files:");
    files.forEach(console.log);
  });
```

#### `#unit()`

```ts
const loggingmonger = makeFilemonger((file$, srcDir, destDir, opts) => {
  if (typeof opts.monger !== "function") {
    throw new Error("BAD");
  }

  return opts
    .monger(file$, opts)
    .unit(srcDir, destDir)
    .do(console.log);
});
```

### Authoring and sharing compound filemongers

If you've made a filemonger pipeline you want to share with others, you want
to wrap it in a new filemonger. This combines all of the previously mentioned
APIs, and potentially some Rxjs APIs, as with the following example.

You can see with this example that this moderately complex pipeline is concisely
expressed (and could be expressed other ways). Some of the functions and
filemongers in this example are hand-waved for brevity. To see a complete
example see the demo package.

First make a package that exports a filemonger:

```ts
const appmonger = makeFilemonger((entrypoint$, srcDir, destDir) =>
  htmlentrypointmonger(entrypoint$)
    .multicast(
      f$ => movemonger(f$.filter(inHtmlDir), { path: "../.." }),
      f$ => movemonger(f$.filter(inSrcDir), { path: "../assets" }),
      f$ => movemonger(f$.filter(inStylesDir), { path: "../assets" })
    )
    .bypass(isHtml, f$ =>
      pathrewritemonger(f$, {
        pattern: /^\/(src|styles)/,
        replacer: "assets"
      }).bind(f$ =>
        pathrewritemonger(f$, {
          pattern: /\.scss$/,
          replacer: ".css"
        })
      )
    )
    .bind(fingerprintmonger)
    .unit(srcDir, destDir)
);

export { appmonger };
```

Which could then be consumed in a `mongerfile.js`:

```ts
const { appmonger } = require("some-cool-package");
const { movemonger } = require("some-other-cool-package");

module.exports = appmonger("/static/html/*").merge(
  movemonger("/static/img/**/*", { path: "../../img" })
);
```

And then with the CLI:

```sh
fm -s app -d dist
```

## CLI

Filemonger comes with a barebones CLI to simplify usage:

1. Run `yarn add -D @filemonger/cli`
2. Add a `mongerfile.js` to the root of your project
3. Export a filemonger instance from your `mongerfile.js` (see example above)
4. Run `fm -s path/to/source/dir -d path/to/dest/dir`
