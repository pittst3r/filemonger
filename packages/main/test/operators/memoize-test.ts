import { fixturesPath } from "../test-support";
import { of, concat } from "rxjs";
import { toArray } from "rxjs/operators";
import { persist, memoize } from "../../src";
import fs from "@filemonger/fs";
import { assert } from "chai";
import { resolve } from "path";

describe("memoize operator", () => {
  it("memoizes the given operator", complete => {
    const operation$ = of(fixturesPath()).pipe(
      persist(resolve("tmp/memoize-operator", fs.rand()))
    );
    const memoizedOperation$ = of(fixturesPath()).pipe(
      memoize("persist", persist(resolve("tmp/memoize-operator", fs.rand())))
    );

    concat(operation$, memoizedOperation$, memoizedOperation$)
      .pipe(toArray())
      .subscribe({
        next([firstDestDir, secondDestDir, thirdDestDir]) {
          assert.notEqual(
            secondDestDir,
            firstDestDir,
            "op without memoization creates a new dest dir each time"
          );
          assert.equal(
            thirdDestDir,
            secondDestDir,
            "op with memoization returns the same dest dir"
          );
        },
        complete
      });
  });
});
