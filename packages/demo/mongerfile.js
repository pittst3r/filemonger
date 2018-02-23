const appmonger = require("./build/appmonger");
const { passthrumonger } = require("@filemonger/main");

module.exports = appmonger("**/*.*", { entry: "static/html/index.html" });
