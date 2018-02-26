const { makeFilemonger, helpers } = require("@filemonger/main");
const { join, parse, relative } = require("path");
const { Observable } = require("rxjs");
const sass = Observable.bindNodeCallback(require("node-sass").render);

module.exports = makeFilemonger((srcDir$, destDir, { entry }) => {
  const node_modules = join(process.cwd(), "node_modules");
  return srcDir$.mergeMap(srcDir =>
    sass({ file: join(srcDir, entry), includePaths: [node_modules] }).mergeMap(
      result => {
        const parts = parse(entry);
        const file = join(destDir, parts.dir, parts.name) + ".css";

        return helpers
          .writeFile(file, result.css)
          .mapTo(relative(destDir, file));
      }
    )
  );
});
