import { make, helpers } from "@filemonger/main";
import { Filemonger } from "@filemonger/types";
import { join, parse, relative, resolve } from "path";
import { render } from "node-sass";
import { Observable } from "rxjs";

const sass = Observable.bindNodeCallback(render);
const { f } = helpers;

export const sassmonger: Filemonger<{ file?: string }> = make(
  (srcDir, destDir, opts) => {
    const entry = join(srcDir, opts.file || "index.scss");

    return sass({
      includePaths: [resolve("node_modules")],
      ...opts,
      file: entry
    }).mergeMap(result => {
      const parts = parse(relative(srcDir, entry));
      const file = join(destDir, parts.dir, parts.name) + ".css";

      return helpers.writeFile(f.fullPath(f.abs(file)), result.css.toString());
    });
  }
);
