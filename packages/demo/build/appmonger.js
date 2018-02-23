const { makeFilemonger, passthrumonger } = require("@filemonger/main");
const { inHtmlDir, inSrcDir, inStylesDir, isHtml } = require("./helpers");
const htmlentrypointmonger = require("./htmlentrypointmonger");
const pathrewritemonger = require("./pathrewritemonger");
const movemonger = require("./movemonger");

const appmonger = makeFilemonger((file$, srcDir, destDir, { entry }) =>
  htmlentrypointmonger(file$, { entry })
    .multicast(
      f$ => movemonger(f$.filter(inHtmlDir), { path: "../.." }),
      f$ => movemonger(f$.filter(inSrcDir), { path: "../assets" }),
      f$ => movemonger(f$.filter(inStylesDir), { path: "../assets" })
    )
    .bypass(isHtml, f$ =>
      pathrewritemonger(f$, {
        pattern: /^\/(src|styles)/,
        replacer: "assets"
      }).bind(f$ =>
        pathrewritemonger(f$, {
          pattern: /\.scss$/,
          replacer: ".css"
        })
      )
    )
    .unit(srcDir, destDir)
);

module.exports = appmonger;
