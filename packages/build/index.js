const { typescriptmonger } = require("@filemonger/typescriptmonger");

module.exports = typescriptmonger(
  process.env.NODE_ENV === "test" ? "test/**/*.ts" : "index.ts"
);
