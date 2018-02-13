const typescriptmonger = require("./typescriptmonger");

console.log("Building...");
console.time("Build");
typescriptmonger("index.ts", "./src", "./dist").subscribe({
  complete() {
    console.timeEnd("Build");
  },
  error(err) {
    console.timeEnd("Build");
    console.error(err);
    process.exit(1);
  }
});
