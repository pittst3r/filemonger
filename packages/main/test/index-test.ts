import { fixturesPath } from "./test-support";
import { identity } from "rxjs";
import { map } from "rxjs/operators";
import { Filemonger, Sinks } from "../src";
import { funnel } from "../src/operators";
import { inspectOutput } from "@filemonger/test-helpers";
import { assert } from "chai";
import { relative } from "path";

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

describe("Filemonger", () => {
  it("works", async () => {
    class Foomonger extends Filemonger {
      srcDir = fixturesPath();
      destDir = "tmp/filemonger/first";
      sinks: Sinks = [["stuff", funnel(map(identity))]];
    }

    const monger = new Foomonger();

    const firstOutput = monger.stream.toPromise();

    assert.equal(relative(monger.rootDir, await firstOutput), monger.destDir);
    await inspectOutput(firstOutput, expectedOutput);

    monger.destDir = "tmp/filemonger/second";

    const secondOutput = monger.stream.toPromise();

    assert.equal(relative(monger.rootDir, await secondOutput), monger.destDir);
    await inspectOutput(secondOutput, expectedOutput);
  });
});
