const { makeFilemonger, helpers, filtermonger } = require("@filemonger/main");
const { readFileSync, readdirSync } = require("fs");
const { join, relative } = require("path");
const cheerio = require("cheerio");
const { Observable, Subject } = require("rxjs");
const rollupmonger = require("./rollupmonger");
const sassmonger = require("./sassmonger");

module.exports = makeFilemonger((srcDir$, destDir, { entry }) => {
  return srcDir$
    .mergeMap(srcDir => {
      const $ = cheerio.load(readFileSync(join(srcDir, entry)).toString());
      const html$ = filtermonger(srcDir, { pattern: entry }).unit(destDir);
      const js = $("script")
        .map((_, el) => el.attribs["src"])
        .toArray()
        .map(script => rollupmonger(srcDir, { entry: script }).unit(destDir));
      const css = $("link[rel='stylesheet']")
        .map((_, el) => el.attribs["href"])
        .toArray()
        .map(s => sassmonger(srcDir, { entry: s }).unit(destDir));

      return Observable.merge(html$, ...js, ...css).toArray();
    })
    .mapTo(destDir);
});
