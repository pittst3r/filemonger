import { resolve } from "path";
import { Filemonger, Transform, IDict } from "@filemonger/types";
import { f, tmp } from "@filemonger/helpers";
import find from "./find";
import { Subject, Observable } from "rxjs";

module.exports = function makeFilemonger<Opts extends IDict<any>>(
  transform: Transform<Opts>
): Filemonger<Opts> {
  return (patternOrFileStream, opts) => {
    const makeReturn = (srcDir: string, destDir: string) => {
      const resolvedSrcDir = f.dir(f.abs(resolve(process.cwd(), srcDir)));
      const finalDestDir = f.dir(f.abs(resolve(process.cwd(), destDir)));
      const file$ = find(patternOrFileStream, resolvedSrcDir);

      return transform(file$, resolvedSrcDir, finalDestDir, opts);
    };

    return {
      bind(fn) {
        const boundmonger = makeFilemonger((file$, srcDir, destDir) =>
          tmp(tmpDir =>
            fn(transform(file$, srcDir, tmpDir)).return(tmpDir, destDir)
          )
        );

        return boundmonger(patternOrFileStream);
      },

      multicast(...sinkFactories) {
        const compositemonger = makeFilemonger((file$, srcDir, destDir) =>
          tmp(tmpDir =>
            transform(file$, srcDir, tmpDir).multicast(
              () => new Subject(),
              intermediate$ =>
                Observable.merge(
                  ...sinkFactories.map(sF =>
                    sF(intermediate$).return(tmpDir, destDir)
                  )
                )
            )
          )
        );

        return compositemonger(patternOrFileStream);
      },

      merge(other) {
        const mergedmonger = makeFilemonger((file$, srcDir, destDir) => {
          const thisFile$ = transform(file$, srcDir, destDir);
          const otherFile$ = other.return(srcDir, destDir);

          return Observable.merge(thisFile$, otherFile$);
        });

        return mergedmonger(patternOrFileStream);
      },

      process(srcDir, destDir, complete) {
        return makeReturn(srcDir, destDir)
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
      },

      return(srcDir, destDir) {
        return makeReturn(srcDir, destDir);
      }
    };
  };
};
