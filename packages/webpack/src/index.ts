import { resolve } from "path";
import {
  Operator,
  Observable,
  OperatorFunction,
  Subscriber,
  combineLatest
} from "rxjs";
import { mergeMap, last, mapTo } from "rxjs/operators";
import { tmp } from "@filemonger/main";
import * as wp from "webpack";

class WebpackOperator implements Operator<string, string> {
  constructor(private _config: wp.Configuration) {}

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return combineLatest(source, tmp())
      .pipe(
        mergeMap(([srcDir, destDir]) => {
          const config: wp.Configuration =
            Object.keys(this._config).length > 0
              ? this._config
              : require(resolve("webpack.config.js"));
          const normalizeEntry = (
            entry: any
          ): string | string[] | wp.Entry | wp.EntryFunc => {
            if (typeof entry === "object" && entry.length) {
              return entry.map((e: string) => resolve(srcDir, entry));
            }

            if (typeof entry === "object") {
              return Object.keys(entry).reduce(
                (memo, k) => ({ ...memo, [k]: normalizeEntry(entry[k]) }),
                {}
              );
            }

            return resolve(srcDir, entry);
          };

          if (config.output) {
            config.output.path = destDir;
          } else {
            config.output = { path: destDir };
          }

          config.entry = normalizeEntry(config.entry);

          return new Observable(subscriber => {
            wp(config, (err, stats) => {
              const errors = err
                ? [err]
                : stats.hasErrors() ? stats.toJson().errors : null;

              if (errors) {
                errors.forEach((error: any) => {
                  subscriber.error(error);
                });
              }

              subscriber.next();
              subscriber.complete();
            });
          }).pipe(last(), mapTo(destDir));
        })
      )
      .subscribe(subscriber);
  }
}

export function webpack(
  config: wp.Configuration = Object.create({})
): OperatorFunction<string, string> {
  return (source: Observable<string>) =>
    source.lift(new WebpackOperator(config));
}
