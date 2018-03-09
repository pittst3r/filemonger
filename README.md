# Filemonger

Filemonger is a generic, composable, code-over-config build pipeline tool for
Node. Build your app, your library, or just process some files.

A filemonger is a function which represents a transformation that may be applied
to a directory. Using a very compact API, one may compose filemongers together
to form compound filemongers, making it easy to concisely express both simple
and complex build pipelines.

Filemonger executes lazily, so once you've composed your pipeline you can kick
it off at your leisure, or export it for usage elsewhere, or wrap your pipeline
in a new filemonger and share it with others.

* [Example](#example)
* [Demo](#demo)
* [Installation](#installation)
* [API](#api)
* [CLI](#cli)

## Example

Here is a simplified version of a common thing we do:

```js
module.exports = merge(
  babelmonger("src").bind(srcDir =>
    webpackmonger(srcDir, { entry: "app/index.js" })
  ),
  sassmonger("src", { file: "styles/index.scss" })
);
```

If we were using webpack alone it might look like this:

```js
module.exports = {
  entry: "./src/app/index",
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.scss$/,
        use: {
          loader: "sass-loader"
        }
      }
    ]
  }
};
```

## Demo

To see an end-to-end working example, see
[this preact-todomvc fork](https://github.com/robbiepitts/preact-todomvc/tree/filemonger).
Start by looking at the package.json `build` and `start` scripts, which run the
`mongerfile.js`. This kicks off a build pipeline using filemongers in the
`build` directory.

## Installation

```sh
yarn add [-D] @filemonger/main [@filemonger/cli]
```

## API

### Making a filemonger

Read files from `srcDir`, transform them, and place the new files in the
`destDir`, returning an `Observable`, `Promise`, or nothing (in case of a
syncronous operation). If your filemonger returns an `Observable` or `Promise`,
emissions will be awaited. `opts` is where options passed to your filemonger
come in. If no options were passed then `opts` will be an empty object.

```ts
import { make } from "@filemonger/main";

const foomonger = make((srcDir, destDir, opts) => {
  // Do stuff
});
```

### Invoking a filemonger

Invoking a filemonger (i.e. instantiating it) gives us an interface which
we can use to compose this instance with other filemonger instances.

```ts
filtermonger("src", { pattern: "**/*.js" });
```

### Composing filemongers

#### `#bind()`

Binds one filemonger to another, linking them together into a pipeline.

```ts
firstmonger().bind(srcDir => secondmonger(srcDir));
// or simply
firstmonger().bind(secondmonger);
```

The output directory gets piped into `secondmonger` when the pipeline is run.
After `bind`ing we are left with a new filemonger instance that can be
further composed.

#### `merge()`

Merges one filemonger instance with another, creating a new filemonger. Useful
for funneling multiple sources into the same pipeline.

```ts
import { merge } from "@filemonger/main";

merge(firstmonger(), secondmonger()).bind(thirdmonger);
```

### Running filemongers

There are two ways to run a filemonger pipeline, the `#run()` and `#writeTo()`
methods. `#run()` does not expose the stream and allows for a callback to
be provided which is called upon completion or error. This is the recommended
API for general filemonger usage. `#writeTo()` is a lower-level API to be used
in the creation of filemongers and returns an Rxjs `Observable`.

#### `#run()`

```ts
firstmonger("src").run("dist", err => {
  if (err) throw err;
  console.log("Donezo");
});
```

#### `#writeTo()`

```ts
import { make } from "@filemonger/main";

const timemonger = make((srcDir, destDir, opts) => {
  console.time(opts.descriptor);

  return opts
    .monger(srcDir, opts.options)
    .writeTo(destDir)
    .do(() => console.timeEnd(opts.descriptor));
});
```

### Authoring and sharing compound filemongers

If you've made a filemonger pipeline you want to share with others, you want
to wrap it in a new filemonger.

You can see with this example that this moderately complex pipeline is concisely
expressed (and could be expressed other ways). To see a complete example see the
demo mentioned above.

First make a package that exports a filemonger:

```ts
const { make } = require("@filemonger/main");
// etc.

const appmonger = make((srcDir, destDir) =>
  merge(
    filtermonger(srcDir, { pattern: "index.html" }),
    babelmonger(srcDir).bind(srcDir =>
      webpackmonger(srcDir, { entry: "app/index.js" })
    ),
    sassmonger(srcDir, { file: "styles/index.scss" })
  ).writeTo(destDir)
);

module.exports = appmonger;
```

Which could then be consumed in a `mongerfile.js`:

```js
const appmonger = require("some-cool-package");

module.exports = appmonger("src");
```

And then with the CLI:

```sh
fm -d dist
```

## CLI

Filemonger comes with a barebones CLI to simplify usage:

1. Run `yarn add -D @filemonger/cli`
2. Add a `mongerfile.js` to the root of your project
3. Export a filemonger instance from your `mongerfile.js` (see example above)
4. Run `fm -d path/to/dest/dir`
