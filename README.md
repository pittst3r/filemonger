# Filemonger

* [Example](#example)
* [Installation](#installation)
* [API](#api)
* [CLI](#cli)

## Example

Here is a simple example using Filemonger to build some js with babel and
webpack. We extend the abstract `Filemonger` class and use Filemonger's Rxjs
operators to compile the source.

```js
// mongerfile.js

// ... imports ...

export default class Appmonger extends Filemonger {
  srcDir = "src";
  destDir = "dist";
  sinks = [[".", pipe(babel(), webpack({ entry: "index.js" }))]];
}
```

If we were using webpack alone it might look something like this:

```js
// webpack.config.js

// ... imports ...

module.exports = {
  entry: { main: ["./src/index.js"] },
  output: {
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};
```

## Installation

```sh
yarn add [-D] @filemonger/main [@filemonger/cli]
```

## API

Filemonger is an abstract class plus a collection of Rxjs operators. These
operators can be used on their own or by classes extending the abstract
`Filemonger` class.

### `Filemonger` abstract class

You must define the `srcDir`, `destDir`, and `sinks` properties when extending
the `Filemonger` class. Classes extending `Filemonger` are used primarily as
exports from your `mongerfile.js` which is used by `@filemonger/cli`.

The below example will grab files from the `src` directory, send them through
the babel/webpack pipeline (which is an Rxjs operator), and place the results in
the `dest` directory.

```js
class Appmonger extends Filemonger {
  srcDir = "src";
  destDir = "dist";
  sinks = [[".", pipe(babel(), webpack({ entry: "index.js" }))]];
}
```

#### `srcDir`

The directory to look in for source files. Can be absolute or relative. Relative
paths are resolved from the process's current working directory.

#### `destDir`

The directory to ultimately save all files to. This is where the `sinks` get
placed.

#### `sinks`

An array of tuples of the form `[destPath, operator]`, where `destPath` is the
path relative to `destDir` to place the results of `operator` applied to
`srcDir`.

### Operators

\# TODO

#### `find`

#### `funnel`

#### `memoize`

#### `persist`

#### `pick`

#### `read`

#### `babel`

#### `sass`

#### `typescript`

#### `webpack`

## CLI

Filemonger comes with a barebones CLI to simplify usage:

1. Run `yarn add -D @filemonger/cli`
2. Add a `mongerfile.js` to the root of your project (where your `package.json`
   is)
3. Export default and/or named filemongers from your `mongerfile.js`
4. Add `scripts` to your `package.json` that run `fm` to run the default export
   or `fm -n Foo` to run the export named `Foo`
