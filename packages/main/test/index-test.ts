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

  describe("passthrumonger", () => {
    it("links", done => {
      const srcRoot = fixturesPath();

      filtermonger().run(srcRoot, destDir, err => {
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

      merge(filtermonger("typescript"), filtermonger("text")).run(
        srcDir,
        destDir,
        err => {
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
        }
      );
    });
  });

  describe("IFilemonger", () => {
    describe("#run()", () => {
      it("runs the monger's transformation", done => {
        const srcRoot = fixturesPath();

        filtermonger("text").run(srcRoot, destDir, err => {
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

    describe("#bind()", () => {
      it("streams the result into the given function which returns a new filemonger instance", done => {
        const srcRoot = fixturesPath();

        filtermonger()
          .bind(srcDir$ => filtermonger(srcDir$, { pattern: "text/*" }))
          .run(srcRoot, destDir, err => {
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

    describe("#multicast()", () => {
      it("streams transform results into multiple other mongers and merges them, creating a new filemonger instance", done => {
        const srcDir = fixturesPath();

        filtermonger()
          .multicast(
            srcDir$ => filtermonger(srcDir$, { pattern: "**/bar.txt" }),
            srcDir$ => filtermonger(srcDir$, { pattern: "**/types.d.ts" })
          )
          .run(srcDir, destDir, err => {
            if (err) throw err;

            assert.sameMembers(glob.sync("**/*.*", { cwd: destDir }), [
              "text/bar.txt",
              "typescript/types.d.ts"
            ]);

            done();
          });
      });
    });
  });
});
