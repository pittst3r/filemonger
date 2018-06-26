#!/usr/bin/env node

const { join } = require("path");
const { ensureDir } = require("fs-extra");
const yargs = require("yargs");

const argv = yargs.option("name", {
  alias: "n",
  describe: "The name of the exported filemonger to use",
  type: "string"
}).argv;

const name = argv.name || "default";
const mongerfile = require(join(process.cwd(), "mongerfile"));
const monger = new mongerfile[name]();

console.time("Filemonger");

monger
  .run()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    console.timeEnd("Filemonger");
  });
