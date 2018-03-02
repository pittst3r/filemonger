import { assert } from "chai";
import * as rimraf from "rimraf";
import { Directory, AbsolutePath } from "@filemonger/types";
import { filtermonger, merge } from "../src";
import { fixturesPath, createTmpDirSync } from "./test-support";
import * as glob from "glob";

describe("filemonger", () => {
  let destDir: Directory<AbsolutePath>;

  beforeEach(() => {
    destDir = createTmpDirSync();
  });

  afterEach(() => {
    rimraf.sync(destDir);
  });

  describe("filtermonger", () => {
    it("works", done => {
      const srcDir = fixturesPath();

      filtermonger(srcDir).run(destDir, err => {
        if (err) throw err;

        assert.sameMembers(glob.sync("**/*", { cwd: destDir }), [
          "text",
          "text/bar.txt",
          "text/baz.txt",
          "typescript",
          "typescript/types.d.ts",
          "typescript/foo.ts"
        ]);

        done();
      });
    });
  });

  describe("merge()", () => {
    it("merges one monger with another creating a new monger", done => {
      const srcDir = fixturesPath();

      merge(
        filtermonger(srcDir, { pattern: "**/bar.txt" }),
        filtermonger(srcDir, { pattern: "**/types.d.ts" })
      ).run(destDir, err => {
        if (err) throw err;

        assert.sameMembers(glob.sync("**/*.*", { cwd: destDir }), [
          "text/bar.txt",
          "typescript/types.d.ts"
        ]);

        done();
      });
    });
  });

  describe("IFilemonger", () => {
    describe("#run()", () => {
      it("runs the monger's transformation", done => {
        const srcDir = fixturesPath();

        filtermonger(srcDir).run(destDir, err => {
          if (err) throw err;

          assert.sameMembers(glob.sync("**/*", { cwd: destDir }), [
            "text",
            "text/bar.txt",
            "text/baz.txt",
            "typescript",
            "typescript/types.d.ts",
            "typescript/foo.ts"
          ]);

          done();
        });
      });
    });

    describe("#bind()", () => {
      it("streams the result into the given function which returns a new filemonger instance", done => {
        const srcDir = fixturesPath();

        filtermonger(srcDir)
          .bind(srcDir => filtermonger(srcDir, { pattern: "text/*" }))
          .run(destDir, err => {
            if (err) throw err;

            assert.sameMembers(glob.sync("**/*", { cwd: destDir }), [
              "text",
              "text/bar.txt",
              "text/baz.txt"
            ]);

            done();
          });
      });
    });
  });
});
