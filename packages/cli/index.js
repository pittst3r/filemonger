#!/usr/bin/env node

const { resolve, join } = require("path");
const { ensureDir } = require("fs-extra");
const yargs = require("yargs");
const { of } = require("rxjs");
const { map, tap } = require("rxjs/operators");
const { pick } = require("@filemonger/main");
const { babel } = require("@filemonger/babel");

const argv = yargs.option("name", {
  alias: "n",
  describe: "The name of the exported filemonger to use",
  type: "string"
}).argv;

const name = argv.name || "default";
const mongerfile$ = of(process.cwd()).pipe(
  pick(["mongerfile.js"]),
  babel({
    presets: [
      [
        require("babel-preset-env"),
        {
          targets: {
            node: "current"
          }
        }
      ]
    ],
    plugins: [require("babel-plugin-transform-class-properties")]
  }),
  map(srcDir => require(join(srcDir, "mongerfile.js")))
);
const runMongerfile = async mongerfile => {
  const monger = new mongerfile[name]();

  console.time("Filemonger");

  monger.stream.subscribe({
    error(err) {
      console.error(err);
      console.timeEnd("Filemonger");
      process.exit(1);
    },
    complete() {
      console.timeEnd("Filemonger");
      process.exit(0);
    }
  });
};
const mongerfileError = err => {
  throw err;
};

mongerfile$.subscribe(runMongerfile, mongerfileError);
