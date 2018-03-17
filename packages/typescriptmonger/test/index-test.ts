import { assert } from "chai";
import { readFileSync, mkdtempSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";
import * as rimraf from "rimraf";
import * as glob from "glob";
import { typescriptmonger } from "../src";

describe("typescriptmonger", function() {
  let destDir: string;

  beforeEach(function() {
    destDir = mkdtempSync(join(tmpdir(), "filemonger-"));
  });

  afterEach(function() {
    rimraf.sync(destDir);
  });

  it("works", function(done) {
    this.timeout(3000); // Ugh, tsc is slow af
    const srcDir = resolve("fixtures/src");
    const instance = typescriptmonger(srcDir, {
      entry: "index.ts",
      compilerOptions: {
        target: "es2015",
        module: "commonjs",
        moduleResolution: "node",
        declaration: true
      }
    });

    instance.run(destDir, err => {
      if (err) throw err;

      const actual: { content: string; file: string }[] = glob
        .sync("**/*.*", {
          cwd: destDir
        })
        .map(file => ({
          file,
          content: readFileSync(join(destDir, file)).toString()
        }));

      assert.sameDeepMembers(actual, [
        {
          file: "index.d.ts",
          content:
            'export { default as foo } from "./stuff/foo";\nexport { default as bar } from "./stuff/bar";\n'
        },
        {
          file: "index.js",
          content:
            '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nvar foo_1 = require("./stuff/foo");\nexports.foo = foo_1.default;\nvar bar_1 = require("./stuff/bar");\nexports.bar = bar_1.default;\n'
        },
        {
          file: "stuff/bar.d.ts",
          content:
            'import { Bar } from "../../types";\nexport default function bar(): Bar;\n'
        },
        {
          file: "stuff/bar.js",
          content:
            '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nfunction bar() {\n    return "bar";\n}\nexports.default = bar;\n'
        },
        {
          file: "stuff/foo.d.ts",
          content:
            'import { Foo } from "../../types";\nexport default function foo(): Foo;\n'
        },
        {
          file: "stuff/foo.js",
          content:
            '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nfunction foo() {\n    return "foo";\n}\nexports.default = foo;\n'
        }
      ]);

      done();
    });
  });
});
