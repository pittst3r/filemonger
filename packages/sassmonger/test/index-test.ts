import { inspectOutput } from "@filemonger/test-helpers";
import { resolve } from "path";
import { sassmonger } from "../src";

const srcDir = resolve("fixtures");

describe("sassmonger", function() {
  it("works", function() {
    const monger = sassmonger(srcDir, { file: "foo.scss" });

    return inspectOutput(monger, [
      {
        content: "body {\n  background-color: blanchedalmond; }\n",
        file: "foo.css"
      }
    ]);
  });
});
