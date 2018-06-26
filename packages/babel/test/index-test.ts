import { babel } from "../src";
import { inspectOutput } from "@filemonger/test-helpers";
import { resolve } from "path";
import { of } from "rxjs";

const srcDir = resolve("fixtures");

describe("babel", () => {
  it("uses babelrc", () => {
    const outDir = of(srcDir).pipe(babel());

    return inspectOutput(outDir, [
      {
        content: "null",
        file: "foo.js.map"
      },
      {
        content:
          '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.default = foo;\nfunction foo() {\n  return "foo";\n}',
        file: "foo.js"
      }
    ]);
  });

  it("ignores babelrc if given options", () => {
    const outDir = of(srcDir).pipe(babel({ compact: true }));

    return inspectOutput(outDir, [
      {
        content: "null",
        file: "foo.js.map"
      },
      {
        content: 'export default function foo(){return"foo";}',
        file: "foo.js"
      }
    ]);
  });
});
