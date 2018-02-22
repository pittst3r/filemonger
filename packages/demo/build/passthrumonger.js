const { makeFilemonger } = require("@filemonger/main");
const { symlinkFile } = require("@filemonger/helpers");
const { join } = require("path");

module.exports = makeFilemonger((file$, srcDir, destDir) =>
  file$.delayWhen(file => symlinkFile(join(srcDir, file), join(destDir, file)))
);
