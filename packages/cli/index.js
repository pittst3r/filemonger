#!/usr/bin/env node

const { join } = require("path");
const { ensureDir } = require("fs-extra");
const yargs = require("yargs");

const argv = yargs
  .option("dest", {
    alias: "d",
    describe: "Destination directory to place transformed files",
    type: "string"
  })
  .demandOption(["dest"]).argv;

const destDir = argv.dest;

const mongerfile = require(join(process.cwd(), "mongerfile"));

ensureDir(destDir, err => {
  if (err) {
    console.error(err);
    process.exit(1);
    return;
  }

  console.time("Filemonger");
  mongerfile.run(destDir, err => {
    console.timeEnd("Filemonger");

    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
});
