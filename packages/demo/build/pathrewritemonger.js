const { makeFilemonger } = require("@filemonger/main");
const cheerio = require("cheerio");
const { readFileSync } = require("fs");
const { writeFile } = require("@filemonger/helpers");
const { join } = require("path");

module.exports = makeFilemonger(
  (file$, srcDir, destDir, { pattern, replacer }) =>
    file$.delayWhen(entrypoint => {
      const html = readFileSync(join(srcDir, entrypoint)).toString();
      const $ = cheerio.load(html);
      const scripts = $("script").each((_, el) => {
        el.attribs["src"] = el.attribs["src"].replace(pattern, replacer);
      });
      const styles = $("link[rel='stylesheet']").each((_, el) => {
        el.attribs["href"] = el.attribs["href"].replace(pattern, replacer);
      });

      return writeFile(join(destDir, entrypoint), $.html());
    })
);
