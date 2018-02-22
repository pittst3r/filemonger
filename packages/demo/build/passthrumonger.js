const { makeFilemonger, helpers } = require("@filemonger/main");
const { join } = require("path");

module.exports = makeFilemonger((file$, srcDir, destDir) =>
  file$.delayWhen(file =>
    helpers.symlinkFile(join(srcDir, file), join(destDir, file))
  )
);
