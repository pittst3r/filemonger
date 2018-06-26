import { join, parse, relative, resolve } from "path";
import { render, Options } from "node-sass";
import {
  bindNodeCallback,
  Operator,
  Observable,
  OperatorFunction,
  Subscriber,
  combineLatest
} from "rxjs";
import { mergeMap, mapTo, last } from "rxjs/operators";
import { tmp } from "@filemonger/main";
import { outputFile } from "fs-extra";

const observableSass = bindNodeCallback(render);
const write = bindNodeCallback(outputFile);

class SassOperator implements Operator<string, string> {
  constructor(private _options: Options = Object.create({})) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return combineLatest(source, tmp())
      .pipe(
        mergeMap(([srcDir, destDir]) => {
          const entry = this._options.file
            ? join(srcDir, this._options.file)
            : undefined;

          return observableSass({
            includePaths: [resolve("node_modules")],
            ...this._options,
            file: entry
          }).pipe(
            mergeMap(result => {
              // We know entry is here because without it Sass will have
              // errored already
              const parts = parse(relative(srcDir, entry!));
              const file = join(destDir, parts.dir, parts.name) + ".css";

              return write(file, result.css.toString());
            }),
            last(),
            mapTo(destDir)
          );
        })
      )
      .subscribe(subscriber);
  }
}

export function sass(options?: Options): OperatorFunction<string, string> {
  return (source: Observable<string>) => source.lift(new SassOperator(options));
}
