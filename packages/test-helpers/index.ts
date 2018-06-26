import { assert } from "chai";
import { of, from, ObservableInput } from "rxjs";
import { map, mergeMap, toArray } from "rxjs/operators";
import { find, read } from "@filemonger/main";
import { join } from "path";

export function inspectOutput(
  source: ObservableInput<string>,
  expected: { file: string; content: string }[]
): Promise<void> {
  return from(source)
    .pipe(
      mergeMap(path =>
        of(path).pipe(
          find({ nodir: true, follow: true }),
          mergeMap(file =>
            of(join(path, file)).pipe(
              read(),
              map(content => ({ content, file }))
            )
          ),
          toArray()
        )
      ),
      map(actual => assert.sameDeepMembers(actual, expected))
    )
    .toPromise();
}
