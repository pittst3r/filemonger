import { inspectOutput } from "@filemonger/test-helpers";
import { resolve } from "path";
import { sass } from "../src";
import { of } from "rxjs";

const srcDir = resolve("fixtures");

describe("sass", function() {
  it("works", function() {
    const outDir = of(srcDir).pipe(sass({ file: "index.scss" }));

    return inspectOutput(outDir, [
      {
        content:
          "body {\n  background-color: blanchedalmond; }\n\nbody {\n  margin: 1em; }\n",
        file: "index.css"
      }
    ]);
  });
});
