const typescriptmonger = require("./typescriptmonger");

console.log("Building...");
console.time("Build");
typescriptmonger("test/**/*.ts", "./", "./tmp").subscribe({
  complete() {
    console.timeEnd("Build");
  },
  error(err) {
    console.timeEnd("Build");
    console.error(err);
    process.exit(1);
  }
});
