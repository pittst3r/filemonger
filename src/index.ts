import { resolve } from "path";
import * as helpers from "./helpers";
import {
  Filemonger,
  Transform,
  FileStream,
  RelativePath,
  AbsolutePath,
  Directory
} from "../types";
import * as f from "./file";

export { f, helpers };

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

function find(
  patternOrFileStream: string | FileStream<RelativePath>,
  srcDir: Directory<AbsolutePath>
): FileStream<RelativePath> {
  return typeof patternOrFileStream === "string"
    ? helpers.filesInDir(srcDir, f.pat(patternOrFileStream))
    : (patternOrFileStream as any);
}
