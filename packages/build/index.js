const typescriptmonger = require("./typescriptmonger");

module.exports = env => {
  const args =
    (process.env.NODE_ENV || env || "prod") === "test"
      ? ["test/**/*.ts", "./", "./tmp"]
      : ["index.ts", "./src", "./dist"];

  console.log("Building...");
  console.time("Build time");
  typescriptmonger(args.shift()).process(...args, err => {
    console.timeEnd("Build time");

    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
};
