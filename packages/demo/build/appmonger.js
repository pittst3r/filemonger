const { makeFilemonger, filtermonger } = require("@filemonger/main");
const { inAppDir, inStylesDir, isHtml } = require("./helpers");
const htmlentrypointmonger = require("./htmlentrypointmonger");
const pathrewritemonger = require("./pathrewritemonger");
const movemonger = require("./movemonger");

const appmonger = makeFilemonger((srcDir$, destDir, { entry }) =>
  htmlentrypointmonger(srcDir$, { entry })
    .multicast(
      srcDir$ => filtermonger(srcDir$, { pattern: "**/*.js" }),
      srcDir$ => filtermonger(srcDir$, { pattern: "**/*.css" }),
      srcDir$ =>
        filtermonger(srcDir$, { pattern: "**/*.html" }).bind(dir =>
          pathrewritemonger(dir, {
            pattern: /\.scss$/,
            replacer: ".css"
          })
        )
    )
    .unit(destDir)
);

module.exports = appmonger;
