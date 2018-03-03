import { assert } from "chai";
import { mkdtempSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";
import * as rimraf from "rimraf";
import * as glob from "glob";
import { filtermonger } from "../src";

describe("filtermonger", () => {
  let destDir: string;

  beforeEach(() => {
    destDir = mkdtempSync(join(tmpdir(), "filemonger-"));
  });

  afterEach(() => {
    rimraf.sync(destDir);
  });

  it("works", done => {
    const srcDir = resolve("fixtures");

    filtermonger(srcDir, { pattern: "**/bar.txt" }).run(destDir, err => {
      if (err) throw err;

      assert.sameMembers(glob.sync("**/*", { cwd: destDir }), [
        "text",
        "text/bar.txt"
      ]);

      done();
    });
  });
});
