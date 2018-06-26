import { inspectOutput } from "@filemonger/test-helpers";
import { resolve } from "path";
import { typescript } from "../src";
import { of } from "rxjs";

const srcDir = resolve("fixtures/src");

describe("typescript", function() {
  it("works", function() {
    // tsc is slow
    this.timeout(5000);

    const output$ = of(srcDir).pipe(
      typescript({
        files: ["index.ts"],
        compilerOptions: {
          target: "es2015",
          module: "commonjs",
          moduleResolution: "node",
          declaration: true
        }
      })
    );

    return inspectOutput(output$, [
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
  });
});
