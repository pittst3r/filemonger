import { assert } from "chai";
import * as rimraf from "rimraf";
import { typescriptmonger } from "@filemonger/typescriptmonger";
import { Directory, AbsolutePath } from "@filemonger/types";
import { passthrumonger } from "../src";
import {
  fixturesPath,
  createTmpDirSync,
  makeFileReader,
  babelmonger
} from "./test-support";
import * as glob from "glob";
import { Observable } from "rxjs";

describe("filemonger", () => {
  let destDir: Directory<AbsolutePath>;

  beforeEach(() => {
    destDir = createTmpDirSync();
  });

  afterEach(() => {
    rimraf.sync(destDir);
  });

  describe("passthrumonger", () => {
    it("links all files from srcDir to destDir with no args", done => {
      const srcDir = fixturesPath();

      passthrumonger().run(srcDir, destDir, (err, files) => {
        if (err) throw err;

        assert.sameMembers(files, [
          "text/bar.txt",
          "typescript/foo.ts",
          "typescript/types.d.ts",
          "text/baz.txt"
        ]);

        assert.sameMembers(glob.sync("**/*.*", { cwd: destDir }), files);

        done();
      });
    });

    it("links a subset of files from srcDir to destDir with a glob", done => {
      const srcDir = fixturesPath();

      passthrumonger("**/*.txt").run(srcDir, destDir, (err, files) => {
        if (err) throw err;

        assert.sameMembers(files, ["text/bar.txt", "text/baz.txt"]);

        assert.sameMembers(glob.sync("**/*.txt", { cwd: destDir }), files);

        done();
      });
    });

    it("links a subset of files from srcDir to destDir with a stream", done => {
      const srcDir = fixturesPath();
      const file$ = Observable.from(["text/bar.txt", "text/baz.txt"]);

      passthrumonger(file$).run(srcDir, destDir, (err, files) => {
        if (err) throw err;

        assert.sameMembers(files, ["text/bar.txt", "text/baz.txt"]);

        assert.sameMembers(glob.sync("**/*.txt", { cwd: destDir }), files);

        done();
      });
    });
  });

  describe("IFilemonger", () => {
    describe("#run()", () => {
      it("runs the monger's transformation", done => {
        const srcDir = fixturesPath();

        passthrumonger("**/*.txt").run(srcDir, destDir, (err, files) => {
          if (err) throw err;

          assert.sameMembers(files, ["text/bar.txt", "text/baz.txt"]);
          assert.sameMembers(glob.sync("**/*.txt", { cwd: destDir }), files);

          done();
        });
      });
    });

    describe("#bind()", () => {
      it("streams the result into the given function which returns a new filemonger instance", done => {
        const srcDir = fixturesPath();

        passthrumonger("**/*.*")
          .bind(file$ => passthrumonger(file$.filter(f => !!f.match("txt"))))
          .bind(file$ => passthrumonger(file$.filter(f => !!f.match("bar"))))
          .run(srcDir, destDir, (err, files) => {
            if (err) throw err;

            assert.sameMembers(files, ["text/bar.txt"], "files array");
            assert.sameMembers(
              glob.sync("**/bar.txt", { cwd: destDir }),
              files,
              "destDir"
            );

            done();
          });
      });
    });

    describe("#merge()", () => {
      it("merges one monger with another creating a new monger", done => {
        const srcDir = fixturesPath();

        passthrumonger("**/*.ts")
          .merge(passthrumonger("**/baz.txt"))
          .run(srcDir, destDir, (err, files) => {
            if (err) throw err;

            assert.sameMembers(files, [
              "typescript/types.d.ts",
              "typescript/foo.ts",
              "text/baz.txt"
            ]);
            assert.sameMembers(
              [
                ...glob.sync("**/*.ts", { cwd: destDir }),
                ...glob.sync("**/baz.txt", { cwd: destDir })
              ],
              files
            );

            done();
          });
      });
    });

    describe("#multicast()", () => {
      it("streams transform results into multiple other mongers and merges them, creating a new filemonger instance", done => {
        const srcDir = fixturesPath();

        type StrMatches = (f: string) => boolean;
        const matchesDts: StrMatches = f => !!f.match(/d\.ts$/);
        const matchesJs: StrMatches = f => !!f.match(/\.js$/);

        typescriptmonger("**/*.ts")
          .multicast(
            file$ => passthrumonger(file$.filter(matchesDts)),
            file$ => babelmonger(file$.filter(matchesJs))
          )
          .run(srcDir, destDir, (err, files) => {
            if (err) throw err;

            assert.sameDeepMembers(files.map(makeFileReader(destDir)), [
              {
                content:
                  'import { Foo } from "./types";\nexport default function foo(): Foo;\n',
                file: "typescript/foo.d.ts"
              },
              {
                content:
                  '"use strict";\n\nObject.defineProperty(exports, "__esModule", { value: true });\nfunction foo() {\n    return "foo";\n}\nexports.default = foo;',
                file: "typescript/foo.js"
              }
            ]);

            done();
          });
      });
    });

    describe("#bypass()", () => {
      it("streams transform results into into given monger if predicate true, bypasses the monger if false", done => {
        const srcDir = fixturesPath();

        type StrMatches = (f: string) => boolean;
        const matchesJs: StrMatches = f => !!f.match(/\.js$/);

        typescriptmonger("**/*.ts")
          .bypass(matchesJs, babelmonger)
          .run(srcDir, destDir, (err, files) => {
            if (err) throw err;

            assert.sameDeepMembers(files.map(makeFileReader(destDir)), [
              {
                content:
                  'import { Foo } from "./types";\nexport default function foo(): Foo;\n',
                file: "typescript/foo.d.ts"
              },
              {
                content:
                  '"use strict";\n\nObject.defineProperty(exports, "__esModule", { value: true });\nfunction foo() {\n    return "foo";\n}\nexports.default = foo;',
                file: "typescript/foo.js"
              }
            ]);

            done();
          });
      });
    });
  });
});
