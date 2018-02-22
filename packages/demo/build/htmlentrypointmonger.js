const { makeFilemonger } = require("@filemonger/main");
const { readFileSync } = require("fs");
const { join, relative } = require("path");
const cheerio = require("cheerio");
const { Observable } = require("rxjs");
const { inHtmlDir, inSrcDir, inStylesDir, isHtml } = require("./helpers");
const passthrumonger = require("./passthrumonger");
const rollupmonger = require("./rollupmonger");
const sassmonger = require("./sassmonger");

module.exports = makeFilemonger((entrypoint$, srcDir, destDir) =>
  entrypoint$.flatMap(entrypoint => {
    const html = readFileSync(join(srcDir, entrypoint)).toString();
    const $ = cheerio.load(html);
    const scripts = $("script")
      .map((_, el) => el.attribs["src"])
      .toArray()
      .map(path => relative(srcDir, join(srcDir, path)));
    const styles = $("link[rel='stylesheet']")
      .map((_, el) => el.attribs["href"])
      .toArray()
      .map(path => relative(srcDir, join(srcDir, path)));

    return Observable.merge(
      passthrumonger(Observable.of(entrypoint)).unit(srcDir, destDir),
      rollupmonger(Observable.from(scripts)).unit(srcDir, destDir),
      sassmonger(Observable.from(styles)).unit(srcDir, destDir)
    );
  })
);
