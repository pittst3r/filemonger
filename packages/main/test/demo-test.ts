import { assert } from "chai";
import {
  fixturesPath,
  createTmpDirSync,
  typescriptmonger,
  typescriptbabelmonger,
  makeFileReader
} from "./test-support";

describe("demos", () => {
  it("compiles typescript with tsc and babel", done => {
    const srcDir = fixturesPath();
    const pattern = "**/*.ts";
    const destDir = createTmpDirSync();

    typescriptbabelmonger(pattern, srcDir, destDir)
      .map(makeFileReader(destDir))
      .toArray()
      .subscribe(files => {
        assert.sameDeepMembers(files, [
          {
            content:
              '"use strict";\n\nObject.defineProperty(exports, "__esModule", { value: true });\nfunction foo() {\n    return "foo";\n}\nexports.default = foo;',
            file: "typescript/foo.js"
          },
          {
            content:
              'import { Foo } from "./types";\nexport default function foo(): Foo;\n',
            file: "typescript/foo.d.ts"
          }
        ]);
        done();
      });
  });

  it("compiles typescript with tsc", done => {
    const srcDir = fixturesPath();
    const pattern = "**/*.ts";
    const destDir = createTmpDirSync();

    typescriptmonger(pattern, srcDir, destDir)
      .map(makeFileReader(destDir))
      .toArray()
      .subscribe(files => {
        assert.sameDeepMembers(files, [
          {
            content:
              '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nfunction foo() {\n    return "foo";\n}\nexports.default = foo;\n',
            file: "typescript/foo.js"
          },
          {
            content:
              'import { Foo } from "./types";\nexport default function foo(): Foo;\n',
            file: "typescript/foo.d.ts"
          }
        ]);
        done();
      });
  });
});
