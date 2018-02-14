import { resolve } from "path";
import { Filemonger, Transform } from "@filemonger/types";
import { f } from "@filemonger/helpers";
import find from "./find";

export function makeFilemonger(transform: Transform): Filemonger {
  return (patternOrFileStream, srcDir, destDir) => {
    const resolvedSrcDir = f.dir(f.abs(resolve(process.cwd(), srcDir)));
    const finalDestDir = f.dir(f.abs(resolve(process.cwd(), destDir)));
    const file$ = find(patternOrFileStream, resolvedSrcDir);

    return transform(file$, {
      srcDir: resolvedSrcDir,
      destDir: finalDestDir
    });
  };
}
