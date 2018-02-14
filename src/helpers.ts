import { Observable, Subject } from "rxjs";
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
import * as rimraf from "rimraf";

export const TMP_NAMESPACE = "filemonger";

export function tmp(
  fn: (tmpDir: Directory<AbsolutePath>) => FileStream<RelativePath>
): FileStream<RelativePath> {
  return createTmpDir().flatMap(tmpDir =>
    fn(tmpDir).do({
      complete() {
        rimraf(tmpDir, err => {
          if (err) throw err;
        });
      }
    })
  );
}

function createTmpDir(): DirectoryStream<AbsolutePath> {
  const path = f.dir(
    f.abs(
      join(
        process.cwd(),
        "tmp",
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

export function multicast(
  source$: FileStream<RelativePath>,
  ...sinkFactories: Array<
    (intermediate$: FileStream<RelativePath>) => FileStream<RelativePath>
  >
): FileStream<RelativePath> {
  return source$.multicast(
    () => new Subject(),
    intermediate$ =>
      Observable.merge(...sinkFactories.map(sF => sF(intermediate$)))
  );
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
