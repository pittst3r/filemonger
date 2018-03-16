import { inspectOutput } from "@filemonger/test-helpers";
import { resolve } from "path";
import { babelmonger } from "../src";

const srcDir = resolve("fixtures");

describe("babelmonger", () => {
  it("uses babelrc", function() {
    const monger = babelmonger(srcDir);

    return inspectOutput(monger, [
      {
        content:
          '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.default = foo;\nfunction foo() {\n  return "foo";\n}',
        file: "foo.js"
      }
    ]);
  });

  it("ignores babelrc if given options", function() {
    const monger = babelmonger(srcDir, { compact: true });

    return inspectOutput(monger, [
      {
        content: 'export default function foo(){return"foo";}',
        file: "foo.js"
      }
    ]);
  });
});
