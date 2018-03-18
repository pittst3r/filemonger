import { make } from "@filemonger/main";
import { Filemonger } from "@filemonger/types";
import { resolve } from "path";
import { Observable } from "rxjs";
import * as webpack from "webpack";

export const webpackmonger: Filemonger<webpack.Configuration> = make(
  (srcDir, destDir, opts) => {
    const configPath = resolve("webpack.config.js");
    const config: webpack.Configuration =
      Object.keys(opts).length > 0 ? opts : require(configPath);
    const normalizeEntry = (
      entry: any
    ): string | string[] | webpack.Entry | webpack.EntryFunc => {
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
      webpack(config, (err, stats) => {
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
    }).last();
  }
);
