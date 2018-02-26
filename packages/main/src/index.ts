import { resolve, join } from "path";
import {
  BindOperator,
  Filemonger,
  IDict,
  MulticastOperator,
  Run,
  Transform,
  Unit,
  DirectoryStream,
  IFilemonger,
  AbsolutePath
} from "@filemonger/types";
import * as helpers from "./helpers";
import { Subject, Observable } from "rxjs";
import filesInDir from "./helpers/files-in-dir";

const { f, tmp, copyFile } = helpers;

export { helpers };

export function makeFilemonger<Opts extends IDict<any>>(
  transform: Transform<Opts>
): Filemonger<Opts> {
  return (pathOrDirStream = "", opts = Object.create({})) => {
    const unit: Unit = (destDir: string) => {
      const finalDestDir = f.dir(f.abs(resolve(process.cwd(), destDir)));
      const srcDir$ =
        typeof pathOrDirStream === "string"
          ? Observable.of(f.dir(f.abs(resolve(process.cwd(), pathOrDirStream))))
          : (pathOrDirStream as DirectoryStream<AbsolutePath>);

      return transform(srcDir$, finalDestDir, opts);
    };

    const run: Run = (destDir, complete) => {
      return unit(destDir).subscribe({
        complete() {
          complete(undefined);
        },
        error(err) {
          complete(err);
        }
      });
    };

    const bind: BindOperator = mongerFactory => {
      const bindingmonger = makeFilemonger((srcDir$, destDir) =>
        tmp(tmpDir => mongerFactory(unit(tmpDir)).unit(destDir))
      );

      return bindingmonger();
    };

    const multicast: MulticastOperator = (...sinkFactories) => {
      const multicastmonger = makeFilemonger((srcDir$, destDir) =>
        srcDir$.multicast(
          () => new Subject(),
          srcDir$ =>
            Observable.merge(
              ...sinkFactories.map(sF => sF(srcDir$).unit(destDir))
            )
              .toArray()
              .mapTo(destDir)
        )
      );

      return bind(multicastmonger);
    };

    return {
      bind,
      multicast,
      unit,
      run
    };
  };
}

export const merge = (...mongers: IFilemonger[]): IFilemonger => {
  const mergemonger = makeFilemonger((_, destDir) =>
    Observable.from(mongers)
      .flatMap(m => m.unit(destDir))
      .toArray()
      .mapTo(destDir)
  );

  return mergemonger();
};

export const filtermonger = makeFilemonger<{ pattern?: string }>(
  (srcDir$, destDir, { pattern }) => {
    return srcDir$.mergeMap(srcDir =>
      filesInDir(srcDir, pattern ? f.pat(pattern) : undefined)
        .delayWhen(file =>
          copyFile(
            f.fullPath(f.abs(join(srcDir, file))),
            f.fullPath(f.abs(join(destDir, file)))
          )
        )
        .toArray()
        .mapTo(destDir)
    );
  }
);
