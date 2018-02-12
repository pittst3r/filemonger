import { assert } from "chai";
import {
  fixturesPath,
  createTmpDirSync,
  passthroughmonger,
  makeFileReader
} from "./test-support";

describe("filemonger", () => {
  it("works", done => {
    const srcDir = fixturesPath();
    const pattern = "**/*.txt";
    const destDir = createTmpDirSync();

    passthroughmonger(pattern, srcDir, destDir)
      .map(makeFileReader(destDir))
      .toArray()
      .subscribe(files => {
        assert.sameDeepMembers(files, [
          { file: "text/bar.txt", content: "bar" }
        ]);
        done();
      });
  });
});
