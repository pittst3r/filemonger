const { makeFilemonger } = require("@filemonger/main");
const { Observable } = require("rxjs");
const { rollup } = require("rollup");
const { join } = require("path");

module.exports = makeFilemonger((entrypoint$, srcDir, destDir) => {
  return entrypoint$.delayWhen(entrypoint => {
    return Observable.fromPromise(
      rollup({ input: join(srcDir, entrypoint) }).then(b =>
        b.write({ file: join(destDir, entrypoint), format: "iife" })
      )
    );
  });
});
