const { makeFilemonger, helpers } = require("@filemonger/main");
const { join, parse, relative } = require("path");
const { Observable } = require("rxjs");
const sass = Observable.bindNodeCallback(require("node-sass").render);

module.exports = makeFilemonger((file$, srcDir, destDir, { entry }) => {
  return file$.toArray().flatMap(() =>
    sass({ file: join(srcDir, entry) }).flatMap(result => {
      const parts = parse(entry);
      const file = join(destDir, parts.dir, parts.name) + ".css";

      return helpers.writeFile(file, result.css).mapTo(relative(destDir, file));
    })
  );
});
