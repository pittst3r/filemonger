import { assert } from "chai";
import {
  fixturesPath,
  createTmpDirSync,
  passthroughmonger,
  makeFileReader,
  typescriptmonger,
  babelmonger
} from "./test-support";

describe("filemonger", () => {
  describe("#process()", () => {
    it("runs the monger's transformation", done => {
      const srcDir = fixturesPath();
      const destDir = createTmpDirSync();

      passthroughmonger("**/*.txt").process(srcDir, destDir, (err, files) => {
        if (err) throw err;

        assert.sameDeepMembers(files.map(makeFileReader(destDir)), [
          { file: "text/bar.txt", content: "bar" },
          { file: "text/baz.txt", content: "baz" }
        ]);

        done();
      });
    });
  });

  describe("#bind()", () => {
    it("streams the result into the given function which returns a new filemonger instance", done => {
      const srcDir = fixturesPath();
      const destDir = createTmpDirSync();

      passthroughmonger("**/*.*")
        .bind(file$ => passthroughmonger(file$.filter(f => !!f.match("txt"))))
        .bind(file$ => passthroughmonger(file$.filter(f => !!f.match("bar"))))
        .process(srcDir, destDir, (err, files) => {
          if (err) throw err;

          assert.sameDeepMembers(files.map(makeFileReader(destDir)), [
            { file: "text/bar.txt", content: "bar" }
          ]);

          done();
        });
    });
  });

  describe("#merge()", () => {
    it("merges one monger with another creating a new monger", done => {
      const srcDir = fixturesPath();
      const destDir = createTmpDirSync();

      passthroughmonger("**/*.ts")
        .merge(passthroughmonger("**/baz.txt"))
        .process(srcDir, destDir, (err, files) => {
          if (err) throw err;

          assert.sameDeepMembers(files.map(makeFileReader(destDir)), [
            {
              content: 'export type Foo = "foo";\n',
              file: "typescript/types.d.ts"
            },
            {
              content:
                'import { Foo } from "./types";\n\nexport default function foo(): Foo {\n  return "foo";\n}\n',
              file: "typescript/foo.ts"
            },
            {
              content: "baz",
              file: "text/baz.txt"
            }
          ]);

          done();
        });
    });
  });

  describe("#multicast()", () => {
    it("streams transform results into multiple other mongers and merges them, creating a new filemonger instance", done => {
      const srcDir = fixturesPath();
      const destDir = createTmpDirSync();

      type StrMatches = (f: string) => boolean;
      const matchesDts: StrMatches = f => !!f.match(/d\.ts$/);
      const matchesJs: StrMatches = f => !!f.match(/\.js$/);

      typescriptmonger("**/*.ts")
        .multicast(
          file$ => passthroughmonger(file$.filter(matchesDts)),
          file$ => babelmonger(file$.filter(matchesJs))
        )
        .process(srcDir, destDir, (err, files) => {
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
