import {
  Operator,
  Subscriber,
  Observable,
  OperatorFunction,
  forkJoin
} from "rxjs";
import { mergeMap, delayWhen } from "rxjs/operators";
import fs from "@filemonger/fs";
import { join } from "path";

class PickOperator implements Operator<string, string> {
  constructor(private _files: string[]) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return source
      .pipe(
        mergeMap(srcDir =>
          fs
            .tmp()
            .pipe(
              delayWhen(destDir =>
                forkJoin(
                  this._files.map(file =>
                    fs.copy(join(srcDir, file), join(destDir, file))
                  )
                )
              )
            )
        )
      )
      .subscribe(subscriber);
  }
}

export default function pick(
  files: string[]
): OperatorFunction<string, string> {
  return (source: Observable<string>) => source.lift(new PickOperator(files));
}
