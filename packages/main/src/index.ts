import { resolve, join } from "path";
import {
  BindOperator,
  Filemonger,
  IDict,
  Run,
  Transform,
  WriteTo,
  IFilemonger,
  Opaque
} from "@filemonger/types";
import * as helpers from "./helpers";
import { Observable } from "rxjs";
import filesInDir from "./helpers/files-in-dir";

const { f, tmp, copyFile } = helpers;

export { helpers };

const isSubscribable = (thing: any): thing is Observable<Opaque> =>
  thing && thing.subscribe;

const isPromise = (thing: any): thing is Promise<Opaque> => thing && thing.then;

export const make = <Opts extends IDict<any>>(
  transform: Transform<Opts>
): Filemonger<Opts> => (srcDir = "", opts = Object.create({})) => {
  const writeTo: WriteTo = (destDir: string) => {
    const resolvedSrcDir = f.dir(f.abs(resolve(process.cwd(), srcDir)));
    const resolvedDestDir = f.dir(f.abs(resolve(process.cwd(), destDir)));
    const result = transform(resolvedSrcDir, resolvedDestDir, opts);

    if (isSubscribable(result)) {
      return result.mapTo(null);
    }

    if (isPromise(result)) {
      return Observable.fromPromise(result).mapTo(null);
    }

    return Observable.of(result).mapTo(null);
  };

  const run: Run = (destDir, complete) => {
    return writeTo(destDir).subscribe({
      complete() {
        complete(undefined);
      },
      error(err) {
        complete(err);
      }
    });
  };

  const bind: BindOperator = mongerFactory => {
    const bindingmonger = make((_, destDir) =>
      tmp(tmpDir =>
        writeTo(tmpDir).mergeMap(() => mongerFactory(tmpDir).writeTo(destDir))
      )
    );

    return bindingmonger();
  };

  return {
    bind,
    writeTo,
    run
  };
};

export const merge = (...mongers: IFilemonger[]): IFilemonger => {
  const mergemonger = make((_, destDir) =>
    Observable.forkJoin(mongers.map(m => m.writeTo(destDir)))
  );

  return mergemonger();
};

export const filtermonger = make<{ pattern?: string }>(
  (srcDir, destDir, { pattern }) =>
    filesInDir(srcDir, pattern ? f.pat(pattern) : undefined)
      .delayWhen(file =>
        copyFile(
          f.fullPath(f.abs(join(srcDir, file))),
          f.fullPath(f.abs(join(destDir, file)))
        )
      )
      .last()
);
