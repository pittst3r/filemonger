const { makeFilemonger } = require("@filemonger/main");
const { Observable } = require("rxjs");
const { rollup } = require("rollup");
const { join } = require("path");

module.exports = makeFilemonger((file$, srcDir, destDir, { entry }) => {
  return file$
    .toArray()
    .flatMap(() =>
      Observable.fromPromise(
        rollup({ input: join(srcDir, entry) }).then(b =>
          b.write({ file: join(destDir, entry), format: "iife" })
        )
      ).mapTo(entry)
    );
});
