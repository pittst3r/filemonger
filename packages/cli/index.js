#!/usr/bin/env node

const { join } = require("path");
const yargs = require("yargs");

const argv = yargs
  .option("src", {
    alias: "s",
    describe: "Source directory to pull files from",
    type: "string"
  })
  .option("dest", {
    alias: "d",
    describe: "Destination directory to place transformed files",
    type: "string"
  })
  .demandOption(["src", "dest"]).argv;

const srcRoot = argv.src;
const destDir = argv.dest;

const mongerfile = require(join(process.cwd(), "mongerfile"));

console.log("Filemongering...");
console.time("Time");
mongerfile.run(srcRoot, destDir, err => {
  console.timeEnd("Time");

  if (err) {
    console.error(err);
    process.exit(1);
  }
});
