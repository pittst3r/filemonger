# Filemonger

* [Example](#example)
* [Installation](#installation)
* [API](#api)
* [CLI](#cli)

## Example

Here is an example using Filemonger to build an app with babel, webpack, and
sass. We extend the abstract `Filemonger` class and use Filemonger's Rxjs
operators to compile the source.

```js
// mongerfile.js

// ... imports ...

export default class Appmonger extends Filemonger {
  srcDir = "src";
  destDir = "dist";
  sinks = [
    [
      ".",
      funnel(
        pipe(babel(), webpack({ entry: "app/index.js" })),
        sass({ file: "styles/index.scss" })
      )
    ]
  ];
}
```

If we were using webpack alone it might look something like this:

```js
// webpack.config.js

// ... imports ...

module.exports = {
  entry: { main: ["./src/app/index.js", "./src/styles/index.scss"] },
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
      },
      {
        test: /\.scss$/,
        use: {
          loader: "sass-loader"
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      path: path.resolve(__dirname, "dist")
    })
  ]
};
```

## Installation

```sh
yarn add [-D] @filemonger/main [@filemonger/cli]
```

## API

Filemonger is an abstract class plus a collection of Rxjs operators. These
operators can be used by classes extending the abstract `Filemonger` class.

### Authoring and sharing filemongers

## CLI

Filemonger comes with a barebones CLI to simplify usage:

1. Run `yarn add -D @filemonger/cli`
2. Add a `mongerfile.js` to the root of your project (where your `package.json`
   is)
3. Export default and/or named filemongers from your `mongerfile.js`
4. Add `scripts` to your `package.json` that run `fm` to run the default export
   or `fm -n Foo` to run the export named `Foo`
