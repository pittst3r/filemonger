import { resolve } from "path";
import {
  BindOperator,
  Filemonger,
  IDict,
  MergeOperator,
  MulticastOperator,
  Run,
  Transform,
  Unit
} from "@filemonger/types";
import { f, tmp } from "@filemonger/helpers";
import find from "./find";
import { Subject, Observable } from "rxjs";

export function makeFilemonger<Opts extends IDict<any>>(
  transform: Transform<Opts>
): Filemonger<Opts> {
  return (patternOrFileStream = "**/*", opts = {} as Opts) => {
    const unit: Unit = (srcDir: string, destDir: string) => {
      const resolvedSrcDir = f.dir(f.abs(resolve(process.cwd(), srcDir)));
      const finalDestDir = f.dir(f.abs(resolve(process.cwd(), destDir)));
      const file$ = find(patternOrFileStream, resolvedSrcDir);

      return transform(file$, resolvedSrcDir, finalDestDir, opts);
    };

    const run: Run = (srcDir, destDir, complete) => {
      return unit(srcDir, destDir)
        .toArray()
        .first()
        .subscribe({
          next(files) {
            complete(undefined, files);
          },
          error(err) {
            complete(err, []);
          }
        });
    };

    const bind: BindOperator = fn => {
      const boundmonger = makeFilemonger((_, srcDir, destDir) =>
        tmp(tmpDir => fn(unit(srcDir, tmpDir)).unit(tmpDir, destDir))
      );

      return boundmonger();
    };

    const merge: MergeOperator = (...others) => {
      const mergingmonger = makeFilemonger((_, srcDir, destDir) => {
        const thisFile$ = unit(srcDir, destDir);
        const otherFile$s = others.map(o => o.unit(srcDir, destDir));

        return Observable.merge(thisFile$, ...otherFile$s);
      });

      return mergingmonger();
    };

    const multicast: MulticastOperator = (...sinkFactories) => {
      const multicastingmonger = makeFilemonger((file$, srcDir, destDir) =>
        file$.multicast(
          () => new Subject(),
          file$ =>
            Observable.merge(
              ...sinkFactories.map(sF => sF(file$).unit(srcDir, destDir))
            )
        )
      );

      return bind(multicastingmonger);
    };

    return {
      bind,
      multicast,
      merge,
      unit,
      run
    };
  };
}
