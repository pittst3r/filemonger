import { resolve, join } from "path";
import {
  BindOperator,
  Filemonger,
  IDict,
  MergeOperator,
  MulticastOperator,
  Run,
  Transform,
  Unit,
  BypassOperator,
  FileStream,
  RelativePath
} from "@filemonger/types";
import * as helpers from "./helpers";
import { Subject, Observable } from "rxjs";

const { f, tmp, symlinkFile, filesInDir } = helpers;

export { helpers };

export function makeFilemonger<Opts extends IDict<any>>(
  transform: Transform<Opts>
): Filemonger<Opts> {
  return (patternOrFileStream = "**/*.*", opts = {} as Opts) => {
    const unit: Unit = (srcDir: string, destDir: string) => {
      const resolvedSrcDir = f.dir(f.abs(resolve(process.cwd(), srcDir)));
      const finalDestDir = f.dir(f.abs(resolve(process.cwd(), destDir)));
      const file$ =
        typeof patternOrFileStream === "string"
          ? filesInDir(resolvedSrcDir, f.pat(patternOrFileStream))
          : (patternOrFileStream as FileStream<RelativePath>);

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

    const bind: BindOperator = mongerFactory => {
      const bindingmonger = makeFilemonger((_, srcDir, destDir) =>
        tmp(tmpDir => mongerFactory(unit(srcDir, tmpDir)).unit(tmpDir, destDir))
      );

      return bindingmonger();
    };

    const bypass: BypassOperator = (predicate, fn) => {
      return multicast(
        f$ => fn(f$.filter(predicate)),
        f$ => passthrumonger(f$.filter(f => !predicate(f)))
      );
    };

    const merge: MergeOperator = (...others) => {
      const mergemonger = makeFilemonger((_, srcDir, destDir) => {
        const thisFile$ = unit(srcDir, destDir);
        const otherFile$s = others.map(o => o.unit(srcDir, destDir));

        return Observable.merge(thisFile$, ...otherFile$s);
      });

      return mergemonger();
    };

    const multicast: MulticastOperator = (...sinkFactories) => {
      const multicastmonger = makeFilemonger((file$, srcDir, destDir) =>
        file$.multicast(
          () => new Subject(),
          file$ =>
            Observable.merge(
              ...sinkFactories.map(sF => sF(file$).unit(srcDir, destDir))
            )
        )
      );

      return bind(multicastmonger);
    };

    return {
      bind,
      bypass,
      multicast,
      merge,
      unit,
      run
    };
  };
}

export const passthrumonger = makeFilemonger((file$, srcDir, destDir) =>
  file$.delayWhen(file =>
    symlinkFile(
      f.fullPath(f.abs(join(srcDir, file))),
      f.fullPath(f.abs(join(destDir, file)))
    )
  )
);
