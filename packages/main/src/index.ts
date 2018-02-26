import { resolve, join } from "path";
import {
  BindOperator,
  Filemonger,
  IDict,
  MulticastOperator,
  Run,
  Transform,
  Unit,
  RelativePath,
  DirectoryStream,
  IFilemonger
} from "@filemonger/types";
import * as helpers from "./helpers";
import { Subject, Observable } from "rxjs";
import filesInDir from "./helpers/files-in-dir";

const { f, tmp, symlinkFile } = helpers;

export { helpers };

export function makeFilemonger<Opts extends IDict<any>>(
  transform: Transform<Opts>
): Filemonger<Opts> {
  return (pathOrDirStream = "", opts = Object.create({})) => {
    const unit: Unit = (srcRoot: string, destDir: string) => {
      const resolvedSrcRoot = f.dir(f.abs(resolve(process.cwd(), srcRoot)));
      const finalDestDir = f.dir(f.abs(resolve(process.cwd(), destDir)));
      const srcDir$ =
        typeof pathOrDirStream === "string"
          ? Observable.of(f.dir(f.rel(pathOrDirStream)))
          : (pathOrDirStream as DirectoryStream<RelativePath>);

      return transform(srcDir$, resolvedSrcRoot, finalDestDir, opts);
    };

    const run: Run = (srcRoot, destDir, complete) => {
      return unit(srcRoot, destDir).subscribe({
        complete() {
          complete(undefined);
        },
        error(err) {
          complete(err);
        }
      });
    };

    const bind: BindOperator = mongerFactory => {
      const bindingmonger = makeFilemonger((srcDir$, srcRoot, destDir) =>
        tmp(tmpDir =>
          mongerFactory(unit(srcRoot, tmpDir)).unit(tmpDir, destDir)
        )
      );

      return bindingmonger();
    };

    const multicast: MulticastOperator = (...sinkFactories) => {
      const multicastmonger = makeFilemonger((srcDir$, srcRoot, destDir) =>
        srcDir$.multicast(
          () => new Subject(),
          srcDir$ =>
            Observable.merge(
              ...sinkFactories.map(sF => sF(srcDir$).unit(srcRoot, destDir))
            )
              .toArray()
              .mapTo(f.dir(f.rel("")))
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
  const mergemonger = makeFilemonger((_, srcRoot, destDir) =>
    Observable.from(mongers)
      .flatMap(m => m.unit(srcRoot, destDir))
      .toArray()
      .mapTo(f.dir(f.rel("")))
  );

  return mergemonger();
};

export const filtermonger = makeFilemonger<{ pattern?: string }>(
  (srcDir$, srcRoot, destDir, { pattern }) => {
    return srcDir$.delayWhen(srcDir =>
      filesInDir(
        f.dir(f.abs(join(srcRoot, srcDir))),
        pattern ? f.pat(pattern) : undefined
      )
        .delayWhen(file =>
          symlinkFile(
            f.dir(f.abs(join(srcRoot, srcDir, file))),
            f.dir(f.abs(join(destDir, srcDir, file)))
          )
        )
        .toArray()
    );
  }
);
