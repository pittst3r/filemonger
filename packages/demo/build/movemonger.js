const { makeFilemonger } = require("@filemonger/main");
const { symlinkFile } = require("@filemonger/helpers");
const { join, relative, parse } = require("path");

module.exports = makeFilemonger((file$, srcDir, destDir, { path }) => {
  return file$.flatMap(file => {
    const src = join(srcDir, file);
    const parts = parse(file);
    const target = join(destDir, parts.dir, path, parts.base);

    return symlinkFile(src, target).mapTo(relative(destDir, target));
  });
});
