#!/usr/bin/env node

const { join } = require("path");
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

console.log("Filemongering...");
console.time("Time");
mongerfile.run(destDir, err => {
  console.timeEnd("Time");

  if (err) {
    console.error(err);
    process.exit(1);
  }
});
