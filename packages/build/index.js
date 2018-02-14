const typescriptmonger = require("./typescriptmonger");

module.exports = env => {
  const args =
    (process.env.NODE_ENV || env || "prod") === "test"
      ? ["test/**/*.ts", "./", "./tmp"]
      : ["index.ts", "./src", "./dist"];

  console.log("Building...");
  console.time("Build");
  typescriptmonger(...args).subscribe({
    complete() {
      console.timeEnd("Build");
    },
    error(err) {
      console.timeEnd("Build");
      console.error(err);
      process.exit(1);
    }
  });
};
