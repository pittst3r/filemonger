const { makeFilemonger, helpers, passthrumonger } = require("@filemonger/main");
const { readFileSync, readdirSync } = require("fs");
const { join, relative } = require("path");
const cheerio = require("cheerio");
const { Observable, Subject } = require("rxjs");
const { inHtmlDir, inSrcDir, inStylesDir, isHtml } = require("./helpers");
const rollupmonger = require("./rollupmonger");
const sassmonger = require("./sassmonger");

module.exports = makeFilemonger((file$, srcDir, destDir, { entry }) => {
  return file$.multicast(
    () => new Subject(),
    f$ => {
      return getCheerio(srcDir, f$.filter(f => f === entry)).multicast(
        () => new Subject(),
        cheerio$ => {
          const html$ = passthrumonger(f$.filter(f => f === entry)).unit(
            srcDir,
            destDir
          );
          const js$ = getScripts(srcDir, cheerio$).flatMap(s =>
            rollupmonger(f$, { entry: s }).unit(srcDir, destDir)
          );
          const css$ = getStyles(srcDir, cheerio$).flatMap(s =>
            sassmonger(f$, { entry: s }).unit(srcDir, destDir)
          );

          return Observable.merge(html$, js$, css$);
        }
      );
    }
  );
});

function getCheerio(srcDir, entry$) {
  return entry$.map(entry =>
    cheerio.load(readFileSync(join(srcDir, entry)).toString())
  );
}

function getScripts(srcDir, cheerio$) {
  return cheerio$.flatMap($ =>
    Observable.from(
      $("script")
        .map((_, el) => el.attribs["src"])
        .toArray()
        .map(path => relative(srcDir, join(srcDir, path)))
    )
  );
}

function getStyles(srcDir, cheerio$) {
  return cheerio$.flatMap($ =>
    Observable.from(
      $("link[rel='stylesheet']")
        .map((_, el) => el.attribs["href"])
        .toArray()
        .map(path => relative(srcDir, join(srcDir, path)))
    )
  );
}
