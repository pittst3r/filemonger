import { tmpdir } from "os";
import { Observable } from "rxjs";
import { join } from "path";
import * as glob from "glob";
import { IOptions } from "glob";
import {
  AbsolutePath,
  Directory,
  Pattern,
  Path,
  DirectoryStream,
  FileStream,
  FullPath,
  RelativePath
} from "../types";
import * as f from "./file";
import { mkdirp, copy } from "fs-extra";

export const TMP_NAMESPACE = "filemonger";

export function createTmpDir(): DirectoryStream<AbsolutePath> {
  const path = f.dir(
    f.abs(
      join(
        tmpdir(),
        TMP_NAMESPACE,
        Math.random()
          .toString(36)
          .substring(7)
      )
    )
  );

  return new Observable(subscriber => {
    mkdirp(path, err => {
      if (err) {
        subscriber.error(err);
        return;
      }

      subscriber.next(f.dir(f.abs(path)));
      subscriber.complete();
    });
  });
}

export function filesInDir(
  dir: Directory<Path>,
  pattern: Pattern = f.pat("**/*.*")
): FileStream<RelativePath> {
  const obsGlob = Observable.bindNodeCallback<string, IOptions, string[]>(glob);

  return obsGlob(pattern, { cwd: dir }).flatMap(files => {
    return Observable.from(files).map(file => f.fullPath(f.rel(file)));
  });
}

export function copyFile(
  srcFile: FullPath<AbsolutePath>,
  outFile: FullPath<AbsolutePath>
): FileStream<AbsolutePath> {
  return new Observable(subscriber => {
    copy(srcFile, outFile, err => {
      if (err) {
        subscriber.error(err);
        return;
      }
      subscriber.next(outFile);
      subscriber.complete();
    });
  });
}
