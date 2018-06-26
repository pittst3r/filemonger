import { fixturesPath } from "./test-support";
import { identity, of } from "rxjs";
import { map } from "rxjs/operators";
import { Filemonger, Sinks } from "../src";
import { funnel, symlink } from "../src/operators";
import { inspectOutput } from "@filemonger/test-helpers";
import { assert } from "chai";
import { relative, resolve } from "path";

const expectedOutput = [
  {
    content:
      'import { Foo } from "./types";\n\nexport default function foo(): Foo {\n  return "foo";\n}\n',
    file: "stuff/typescript/foo.ts"
  },
  {
    content: 'export type Foo = "foo";\n',
    file: "stuff/typescript/types.d.ts"
  },
  {
    content: "baz",
    file: "stuff/text/foo.txt"
  },
  {
    content: "bar",
    file: "stuff/text/bar.txt"
  }
];

describe("filemonger", () => {
  describe("shit", () => {
    it("does shit", () => {
      const outDir = of(fixturesPath()).pipe(
        symlink(resolve("tmp/filemonger/stuff")),
        map(path => resolve(path, ".."))
      );

      return inspectOutput(outDir, expectedOutput);
    });

    it("does more shit", async () => {
      class Foomonger extends Filemonger {
        srcDir = fixturesPath();
        destDir = "tmp/filemonger/first";
        sinks: Sinks = [["stuff", funnel(map(identity))]];
      }

      const monger = new Foomonger();

      const firstOutput = monger.run();

      assert.equal(relative(monger.rootDir, await firstOutput), monger.destDir);
      await inspectOutput(firstOutput, expectedOutput);

      monger.destDir = "tmp/filemonger/second";

      const secondOutput = monger.run();

      assert.equal(
        relative(monger.rootDir, await secondOutput),
        monger.destDir
      );
      await inspectOutput(secondOutput, expectedOutput);
    });
  });
});
