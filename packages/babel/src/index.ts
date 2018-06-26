import { join } from "path";
import {
  Observable,
  bindNodeCallback,
  OperatorFunction,
  Subscriber,
  Operator,
  of,
  forkJoin,
  combineLatest
} from "rxjs";
import { find } from "@filemonger/main";
import fs from "@filemonger/fs";
import { mergeMap, mapTo, last, map, delayWhen } from "rxjs/operators";
import { transformFile, TransformOptions } from "babel-core";
import { outputFile } from "fs-extra";

const observableBabel = bindNodeCallback(transformFile);
const write = bindNodeCallback(outputFile);

class BabelOperator implements Operator<string, string> {
  private _options: TransformOptions;

  constructor(options: TransformOptions = {}) {
    this._options =
      Object.keys(options).length > 0
        ? { ...options, babelrc: false }
        : options;
  }

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return combineLatest(source, fs.tmp())
      .pipe(
        mergeMap(([srcDir, destDir]) =>
          of(srcDir).pipe(
            find({ pattern: "**/*.js" }),
            mergeMap(file =>
              observableBabel(join(srcDir, file), this._options).pipe(
                map(({ code, map }) => ({
                  code,
                  map: JSON.stringify(map),
                  file: join(destDir, file)
                }))
              )
            ),
            delayWhen(({ code, map, file }) =>
              forkJoin(
                code ? write(file, code) : of(null),
                map ? write(file + ".map", map) : of(null)
              )
            ),
            last(),
            mapTo(destDir)
          )
        )
      )
      .subscribe(subscriber);
  }
}

export function babel(
  options?: TransformOptions
): OperatorFunction<string, string> {
  return (source: Observable<string>) =>
    source.lift(new BabelOperator(options));
}
