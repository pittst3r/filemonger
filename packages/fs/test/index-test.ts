import fs from "../src";
import * as fse from "fs-extra";
import { assert } from "chai";
import { fixturesPath } from "./test-support";
import { inspectOutput } from "@filemonger/test-helpers";
import { resolve } from "path";
import { join } from "path";
import { mergeMap, toArray } from "rxjs/operators";
import { pipe, of, concat } from "rxjs";

const fixtures = "95d62af7e16d5dce481d41301daccc6254506be7";
const foo_txt = "0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33";
// const bar = "60209932bf2c5d6e1c39d6cd197e2ac1fd053def";
// const bar_baz_txt = "bbe960a25ea311d21d40669e93df2003ba9b90a2";

describe("fs", () => {
  afterEach(() => {
    fs.clean();
  });

  describe("memoize", () => {
    it("memoizes the given operator", complete => {
      const copy$ = of(fixturesPath()).pipe(mergeMap(dir => fs.copy(dir)));
      const memoizedCopy$ = of(fixturesPath()).pipe(
        mergeMap(srcDir =>
          fs.memoize(srcDir, "copy", pipe(mergeMap(dir => fs.copy(dir))))
        )
      );

      concat(copy$, memoizedCopy$, memoizedCopy$)
        .pipe(toArray())
        .subscribe({
          next([firstDestDir, secondDestDir, thirdDestDir]) {
            assert.notEqual(
              secondDestDir,
              firstDestDir,
              "copy without memoization creates a new dest dir each time"
            );
            assert.equal(
              thirdDestDir,
              secondDestDir,
              "copy with memoization returns the same dest dir"
            );
          },
          complete
        });
    });

    it("does not memoize if the destination is out of the rootDir", complete => {
      const externalDestDir = () => resolve("tmp/unmemoizable", fs.rand());
      const op = mergeMap<string, string>(dir =>
        fs.copy(dir, externalDestDir())
      );
      const unmemoizableCopy$ = of(fixturesPath()).pipe(
        mergeMap(srcDir => fs.memoize(srcDir, "copy", op))
      );

      concat(unmemoizableCopy$, unmemoizableCopy$)
        .pipe(toArray())
        .subscribe({
          next([firstDestDir, secondDestDir]) {
            assert.notEqual(secondDestDir, firstDestDir);
          },
          complete
        });
    });
  });

  describe("hashPath", () => {
    it("hashes single files", complete => {
      const path = join(fixturesPath(), "foo.txt");
      const hash$ = fs.hashPath(path);

      hash$.subscribe({
        next(value) {
          assert.deepEqual(value, ["blob", path, foo_txt]);
        },
        complete
      });
    });

    it("hashes directories", complete => {
      const path = fixturesPath();
      const hash$ = fs.hashPath(path);

      hash$.subscribe({
        next(value) {
          assert.deepEqual(value, ["tree", path, fixtures]);
        },
        complete
      });
    });
  });

  describe("copy", () => {
    it("works", async () => {
      const output$ = fs.copy(fixturesPath(), resolve("tmp/copy-test"));

      return inspectOutput(output$, [
        { content: "baz", file: "bar/baz.txt" },
        { content: "foo", file: "foo.txt" }
      ]);
    });
  });

  describe("symlink", () => {
    it("works", async () => {
      const output$ = fs.symlink(fixturesPath(), resolve("tmp/symlink-test"));

      return inspectOutput(output$, [
        { content: "baz", file: "bar/baz.txt" },
        { content: "foo", file: "foo.txt" }
      ]);
    });
  });

  describe("tmp", () => {
    it("works", async () => {
      const tmpDir = fs.tmp().toPromise();

      assert.ok((await fse.lstat(await tmpDir)).isDirectory());
    });
  });
});
