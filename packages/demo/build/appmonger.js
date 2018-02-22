const { makeFilemonger } = require("@filemonger/main");
const { copyFile, symlinkFile, writeFile } = require("@filemonger/helpers");
const cheerio = require("cheerio");
const { readFileSync, readdirSync } = require("fs");
const { join, relative, basename, parse } = require("path");
const { Observable, Subject } = require("rxjs");
const { rollup } = require("rollup");
const sass = Observable.bindNodeCallback(require("node-sass").render);

const inHtmlDir = f => !!f.match(/^static\/html/);
const inSrcDir = f => !!f.match(/^src/);
const inStylesDir = f => !!f.match(/^styles/);
const isHtml = f => !!f.match(/\.html$/);

const passthrumonger = makeFilemonger((file$, srcDir, destDir) =>
  file$.delayWhen(file => symlinkFile(join(srcDir, file), join(destDir, file)))
);

const rollupmonger = makeFilemonger((entrypoint$, srcDir, destDir) => {
  return entrypoint$.delayWhen(entrypoint => {
    return Observable.fromPromise(
      rollup({ input: join(srcDir, entrypoint) }).then(b =>
        b.write({ file: join(destDir, entrypoint), format: "iife" })
      )
    );
  });
});

const sassmonger = makeFilemonger((entrypoint$, srcDir, destDir) => {
  return entrypoint$.flatMap(entrypoint =>
    sass({ file: join(srcDir, entrypoint) }).flatMap(result => {
      const parts = parse(entrypoint);
      const file = join(destDir, parts.dir, parts.name) + ".css";

      return writeFile(file, result.css).mapTo(relative(destDir, file));
    })
  );
});

const htmlentrypointmonger = makeFilemonger((entrypoint$, srcDir, destDir) =>
  entrypoint$.filter(isHtml).flatMap(entrypoint => {
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

const movemonger = makeFilemonger((file$, srcDir, destDir, { path }) => {
  return file$.flatMap(file => {
    const src = join(srcDir, file);
    const parts = parse(file);
    const target = join(destDir, parts.dir, path, parts.base);

    return symlinkFile(src, target).mapTo(relative(destDir, target));
  });
});

const pathrewritemonger = makeFilemonger(
  (file$, srcDir, destDir, { pattern, replacer }) =>
    file$.filter(file => !!file.match(/\.html$/)).delayWhen(entrypoint => {
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

const appmonger = makeFilemonger((entrypoint$, srcDir, destDir) =>
  htmlentrypointmonger(entrypoint$)
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
