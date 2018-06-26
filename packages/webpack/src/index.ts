import { resolve } from "path";
import {
  Operator,
  Observable,
  OperatorFunction,
  Subscriber,
  combineLatest
} from "rxjs";
import { mergeMap, last, mapTo } from "rxjs/operators";
import fs from "@filemonger/fs";
import * as wp from "webpack";

class WebpackOperator implements Operator<string, string> {
  private _config: wp.Configuration;

  constructor(config: wp.Configuration = {}) {
    this._config =
      Object.keys(config).length > 0
        ? config
        : require(resolve("webpack.config.js"));
  }

  call(subscriber: Subscriber<string>, source: Observable<string>) {
    return combineLatest(source, fs.tmp())
      .pipe(
        mergeMap(([srcDir, destDir]) => {
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

          if (this._config.output) {
            this._config.output.path = destDir;
          } else {
            this._config.output = { path: destDir };
          }

          this._config.entry = normalizeEntry(this._config.entry);

          return new Observable(subscriber => {
            wp(this._config, (err, stats) => {
              const errors = err
                ? [err]
                : stats.hasErrors() ? stats.toJson().errors : null;

              if (errors) {
                // TODO: This is wrong
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
